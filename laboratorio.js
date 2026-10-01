// ==========================================
// MOTOR QUÍMICO - LABORATÓRIO VIRTUAL ADÔMINES
// ==========================================

let vidrariaAtiva = "bequer";
let estacaoAtual = "bancada";

let temperaturaAtual = 25.0;
let temperaturaAlvo = 25.0;
let phAtual = 7.0;

let aquecimentoAtivo = 0; // 0 = OFF, até 250°C
let agitadorAtivo = false;
let exaustorAtivo = false;

let vidrariaQuebrada = false;
let centrifugando = false;

// Estado dos componentes na vidraria
let misturaVidraria = {
    volumeTotal: 0,
    capacidadeMax: 250,
    reagentes: {}, // ex: { H2O: 50, HCl: 15, Na: 2 }
    corLiquido: "transparent",
    temPrecipitado: false,
    corPrecipitado: "#ffffff",
    temBolhas: false,
    temIndicador: null
};

// Estado da Balança Analítica
let balancaEstado = {
    pesoLiquido: 0,
    pesoTara: 0,
    reagenteAtual: null,
    nomeReagente: ""
};

// ==========================================
// EFEITOS SONOROS NATIVOS (WEB AUDIO API)
// Não dependem de arquivos externos para funcionar!
// ==========================================
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function obterAudioContext() {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

function tocarSomSintetizado(tipo) {
    try {
        let ctx = obterAudioContext();
        let osc = ctx.createOscillator();
        let gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (tipo === 'explosao') {
            // Ruído branco de explosão com decaimento grave
            let bufferSize = ctx.sampleRate * 1.5;
            let buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            let data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.3));
            }
            let noise = ctx.createBufferSource();
            noise.buffer = buffer;
            let filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(300, ctx.currentTime);
            filter.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 1.2);
            noise.connect(filter);
            filter.connect(ctx.destination);
            noise.start();
        } 
        else if (tipo === 'vidro') {
            // Estalo agudo de vidro estilhaçando
            let oscV = ctx.createOscillator();
            let gainV = ctx.createGain();
            oscV.type = 'sawtooth';
            oscV.frequency.setValueAtTime(2500, ctx.currentTime);
            oscV.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.3);
            gainV.gain.setValueAtTime(0.8, ctx.currentTime);
            gainV.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            oscV.connect(gainV);
            gainV.connect(ctx.destination);
            oscV.start();
            oscV.stop(ctx.currentTime + 0.3);
        }
        else if (tipo === 'efervescencia') {
            // Chiado de gás/bolhas
            let bufferSize = ctx.sampleRate * 0.8;
            let buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            let data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * 0.15;
            }
            let noise = ctx.createBufferSource();
            noise.buffer = buffer;
            let filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 1800;
            noise.connect(filter);
            filter.connect(ctx.destination);
            noise.start();
        }
    } catch(e) {}
}

// ==========================================
// SELEÇÃO DE ESTAÇÕES E VIDRARIAS
// ==========================================
window.mudarEstacao = function(estacao) {
    if(typeof tocarSomClick === "function") tocarSomClick();
    estacaoAtual = estacao;

    document.querySelectorAll(".aba-btn").forEach(b => b.classList.remove("ativa"));
    let btnAba = document.getElementById(`aba-${estacao}`);
    if (btnAba) btnAba.classList.add("ativa");

    let capelaBox = document.getElementById("capela-box");
    if (capelaBox) {
        if (estacao === "capela") capelaBox.classList.remove("escondido");
        else capelaBox.classList.add("escondido");
    }

    if (estacao === "balanca") {
        abrirModalBalanca();
    } else if (estacao === "centrifuga") {
        abrirModalCentrifuga();
    }
};

window.selecionarVidraria = function(tipo) {
    if(typeof tocarSomClick === "function") tocarSomClick();
    if (vidrariaQuebrada) {
        mostrarMensagemGlob("⚠️ A vidraria está estilhaçada! Limpe a bancada primeiro.");
        return;
    }

    vidrariaAtiva = tipo;
    let el = document.getElementById("vidraria-ativa");
    if (!el) return;

    el.className = "vidraria-ativa";
    if (tipo === "bequer") {
        el.classList.add("bequer-formato");
        misturaVidraria.capacidadeMax = 250;
    } else if (tipo === "erlenmeyer") {
        el.classList.add("erlenmeyer-formato");
        misturaVidraria.capacidadeMax = 250;
    } else if (tipo === "tubo") {
        el.classList.add("tubo-formato");
        misturaVidraria.capacidadeMax = 50;
    }

    atualizarVisualVidraria();
    mostrarMensagemGlob(`Recipiente alterado para: ${tipo.toUpperCase()}`);
};

// ==========================================
// MANIPULAÇÃO DE LÍQUIDOS E REAGENTES
// ==========================================
window.adicionarAguaDestilada = function(qtdML) {
    if(typeof tocarSomClick === "function") tocarSomClick();
    if (checarBloqueioVidraria()) return;

    misturaVidraria.volumeTotal = Math.min(misturaVidraria.capacidadeMax, misturaVidraria.volumeTotal + qtdML);
    misturaVidraria.reagentes['H2O'] = (misturaVidraria.reagentes['H2O'] || 0) + qtdML;

    if (misturaVidraria.corLiquido === "transparent") {
        misturaVidraria.corLiquido = "rgba(56, 189, 248, 0.45)"; // Azul claro cristalino
    }

    processarReacoesQuimicas();
    atualizarVisualVidraria();
};

window.adicionarLiquidoDireto = function(sigla, nome, vol, cor, phBase) {
    if(typeof tocarSomClick === "function") tocarSomClick();
    if (checarBloqueioVidraria()) return;

    // Alerta de segurança de manuseio de ácido concentrado fora da capela
    if (sigla === 'HCl' && (estacaoAtual !== 'capela' || !exaustorAtivo)) {
        acionarAlarmeVaporesToxicos();
    }

    misturaVidraria.volumeTotal = Math.min(misturaVidraria.capacidadeMax, misturaVidraria.volumeTotal + vol);
    misturaVidraria.reagentes[sigla] = (misturaVidraria.reagentes[sigla] || 0) + vol;

    processarReacoesQuimicas();
    atualizarVisualVidraria();
    mostrarMensagemGlob(`Adicionado: ${vol}mL de ${nome}`);
};

window.adicionarIndicador = function(tipoIndicador) {
    if(typeof tocarSomClick === "function") tocarSomClick();
    if (checarBloqueioVidraria()) return;

    misturaVidraria.temIndicador = tipoIndicador;
    mostrarMensagemGlob(`Indicador adicionado: ${tipoIndicador}`);
    processarReacoesQuimicas();
    atualizarVisualVidraria();
};

// ==========================================
// ESTAÇÃO DE PESAGEM (BALANÇA ANALÍTICA)
// ==========================================
function abrirModalBalanca() {
    let modal = document.getElementById("modal-balanca-analitica");
    if (modal) modal.style.display = "flex";
    balancaEstado.pesoLiquido = 0;
    atualizarVisorBalanca();
}

window.fecharModalBalanca = function() {
    let modal = document.getElementById("modal-balanca-analitica");
    if (modal) modal.style.display = "none";
};

window.abrirPesagemReagente = function(sigla, nome) {
    balancaEstado.reagenteAtual = sigla;
    balancaEstado.nomeReagente = nome;
    balancaEstado.pesoLiquido = 0;

    let elNome = document.getElementById("nome-reagente-pesagem");
    if (elNome) elNome.innerText = `Pesando: ${nome} (${sigla})`;

    let elPo = document.getElementById("po-pesado");
    if (elPo) {
        if (sigla === 'CuSO4') elPo.style.backgroundColor = '#2563eb';
        else if (sigla === 'Zn') elPo.style.backgroundColor = '#64748b';
        else if (sigla === 'Na') elPo.style.backgroundColor = '#94a3b8';
        else elPo.style.backgroundColor = '#ffffff';
    }

    abrirModalBalanca();
};

window.tararBalanca = function() {
    if(typeof tocarSomClick === "function") tocarSomClick();
    balancaEstado.pesoLiquido = 0;
    atualizarVisorBalanca();
    mostrarMensagemGlob("Balança Tarada (0.000 g)");
};

window.dosarReagente = function(gramas) {
    if(typeof tocarSomClick === "function") tocarSomClick();
    balancaEstado.pesoLiquido = Math.min(50, balancaEstado.pesoLiquido + gramas);
    atualizarVisorBalanca();
};

function atualizarVisorBalanca() {
    let elVisor = document.getElementById("visor-peso");
    if (elVisor) elVisor.innerText = balancaEstado.pesoLiquido.toFixed(3);
    let elPo = document.getElementById("po-pesado");
    if (elPo) {
        let escala = Math.min(2.5, 0.5 + (balancaEstado.pesoLiquido / 10));
        elPo.style.transform = `scale(${escala})`;
    }
}

window.transferirReagenteParaVidraria = function() {
    if (balancaEstado.pesoLiquido <= 0 || !balancaEstado.reagenteAtual) {
        mostrarMensagemGlob("⚠️ Coloque reagente na balança com a espátula antes de transferir!");
        return;
    }

    let sigla = balancaEstado.reagenteAtual;
    let massa = balancaEstado.pesoLiquido;

    misturaVidraria.reagentes[sigla] = (misturaVidraria.reagentes[sigla] || 0) + massa;
    
    fecharModalBalanca();
    processarReacoesQuimicas();
    atualizarVisualVidraria();
    mostrarMensagemGlob(`Transferido: ${massa.toFixed(1)}g de ${balancaEstado.nomeReagente}`);
};

// ==========================================
// MOTOR DE REAÇÕES QUÍMICAS REAIS
// ==========================================
function processarReacoesQuimicas() {
    let r = misturaVidraria.reagentes;

    // 1. SÓDIO METÁLICO (Na) NA ÁGUA = EXPLOSÃO VIOLENTA
    if (r['Na'] && r['Na'] > 0 && r['H2O'] && r['H2O'] > 0) {
        dispararExplosaoLaboratorio("EXPLOSÃO POR SÓDIO METÁLICO! O Sódio reage violentamente com a água liberando gás hidrogênio altamente combustível e calor extremo!");
        r['Na'] = 0;
        return;
    }

    // 2. PASTA DE DENTE DE ELEFANTE: H2O2 + KI + Detergente
    if (r['H2O2'] && r['KI'] && r['Detergente']) {
        dispararErupcaoEspuma();
        misturaVidraria.corLiquido = "#fef08a";
        temperaturaAtual += 25;
        r['H2O2'] = 0;
        mostrarMensagemGlob("🎉 REAÇÃO DA PASTA DE DENTE DE ELEFANTE! Decomposição catalítica ultra-rápida de H2O2 gerando espuma de oxigênio!");
    }

    // 3. EFERVESCÊNCIA: Ácido Clorídrico (HCl) + Bicarbonato de Sódio (NaHCO3)
    if (r['HCl'] && r['HCl'] > 0 && r['NaHCO3'] && r['NaHCO3'] > 0) {
        dispararEfervescenciaGas();
        let reagido = Math.min(r['HCl'], r['NaHCO3']);
        r['HCl'] -= reagido;
        r['NaHCO3'] -= reagido;
        phAtual = 7.0;
        mostrarMensagemGlob("🫧 Efervescência! Liberação de gás Dióxido de Carbono (CO2).");
    }

    // 4. EFERVESCÊNCIA DE HIDROGÊNIO: Ácido Clorídrico (HCl) + Raspas de Zinco (Zn)
    if (r['HCl'] && r['HCl'] > 0 && r['Zn'] && r['Zn'] > 0) {
        dispararEfervescenciaGas();
        temperaturaAtual += 12;
        r['Zn'] = Math.max(0, r['Zn'] - 2);
        mostrarMensagemGlob("🫧 Zinco reagindo com ácido: liberação de bolhas de Gás Hidrogênio (H2) e aquecimento!");
    }

    // 5. NEUTRALIZAÇÃO ÁCIDO-BASE: HCl + NaOH
    if (r['HCl'] && r['HCl'] > 0 && r['NaOH'] && r['NaOH'] > 0) {
        let qtdNeut = Math.min(r['HCl'], r['NaOH']);
        r['HCl'] -= qtdNeut;
        r['NaOH'] -= qtdNeut;
        temperaturaAtual += 8; // Reação exotérmica real
        mostrarMensagemGlob("Reação de Neutralização exotérmica (Ácido + Base formando Sal e Água)!");
    }

    // 6. DISSOLUÇÃO DE SULFATO DE COBRE (CuSO4)
    if (r['CuSO4'] && r['CuSO4'] > 0 && r['H2O'] && r['H2O'] > 0) {
        misturaVidraria.corLiquido = "rgba(37, 99, 235, 0.75)"; // Azul intenso de cobre hidratado
    }

    // Cálculo dinâmico do pH
    if (r['HCl'] && r['HCl'] > 0) {
        phAtual = Math.max(1.0, 7.0 - (r['HCl'] * 0.4));
    } else if (r['NaOH'] && r['NaOH'] > 0) {
        phAtual = Math.min(14.0, 7.0 + (r['NaOH'] * 0.4));
    } else {
        phAtual = 7.0;
    }

    // Ação do Indicador de Fenolftaleína
    if (misturaVidraria.temIndicador === 'Fenolftaleína') {
        if (phAtual >= 8.2) {
            misturaVidraria.corLiquido = "#ec4899"; // Rosa choque brilhante
        } else if (misturaVidraria.corLiquido === "#ec4899") {
            misturaVidraria.corLiquido = "rgba(56, 189, 248, 0.35)"; // Volta a ser incolor
        }
    }
}

// ==========================================
// EFEITOS ESPECIAIS (EXPLOSÃO, FUMAÇA, QUEBRA)
// ==========================================
function dispararExplosaoLaboratorio(motivo) {
    vidrariaQuebrada = true;
    tocarSomSintetizado('explosao');
    tocarSomSintetizado('vidro');

    let fogo = document.getElementById("efeito-fogo");
    let estilhacos = document.getElementById("efeito-estilhacos");
    let trincos = document.getElementById("trincos-vidro");
    let fumaca = document.getElementById("efeito-fumaca");

    if (fogo) fogo.classList.remove("escondido");
    if (trincos) trincos.classList.remove("escondido");
    if (fumaca) fumaca.classList.remove("escondido");

    setTimeout(() => { if (fogo) fogo.classList.add("escondido"); }, 1000);

    misturaVidraria.volumeTotal = 0;
    misturaVidraria.corLiquido = "transparent";
    temperaturaAtual = 180;
    
    atualizarVisualVidraria();
    mostrarMensagemGlob("💥 " + motivo);
}

function dispararEfervescenciaGas() {
    tocarSomSintetizado('efervescencia');
    let container = document.getElementById("particulas-bolhas");
    if (!container) return;

    container.innerHTML = "";
    for (let i = 0; i < 16; i++) {
        let b = document.createElement("div");
        b.className = "bolha-reacao";
        b.style.left = (Math.random() * 80 + 10) + "%";
        b.style.width = (Math.random() * 8 + 4) + "px";
        b.style.height = b.style.width;
        b.style.animationDelay = (Math.random() * 0.8) + "s";
        container.appendChild(b);
    }
    setTimeout(() => { if (container) container.innerHTML = ""; }, 2500);
}

function dispararErupcaoEspuma() {
    dispararEfervescenciaGas();
    misturaVidraria.volumeTotal = misturaVidraria.capacidadeMax;
}

function acionarAlarmeVaporesToxicos() {
    let fumaca = document.getElementById("efeito-fumaca");
    if (fumaca) fumaca.classList.remove("escondido");
    mostrarMensagemGlob("🚨 ALERTA: Ácido concentrado liberando vapores tóxicos fora da capela!");
    setTimeout(() => { if (fumaca && !vidrariaQuebrada) fumaca.classList.add("escondido"); }, 4000);
}

window.acionarChuveiroEmergencia = function() {
    if(typeof tocarSomClick === "function") tocarSomClick();

    vidrariaQuebrada = false;
    temperaturaAtual = 25.0;
    temperaturaAlvo = 25.0;
    phAtual = 7.0;
    aquecimentoAtivo = 0;
    agitadorAtivo = false;

    misturaVidraria = {
        volumeTotal: 0,
        capacidadeMax: 250,
        reagentes: {},
        corLiquido: "transparent",
        temPrecipitado: false,
        corPrecipitado: "#ffffff",
        temBolhas: false,
        temIndicador: null
    };

    let fogo = document.getElementById("efeito-fogo");
    let trincos = document.getElementById("trincos-vidro");
    let fumaca = document.getElementById("efeito-fumaca");
    if (fogo) fogo.classList.add("escondido");
    if (trincos) trincos.classList.add("escondido");
    if (fumaca) fumaca.classList.add("escondido");

    let indCalor = document.getElementById("indicador-calor");
    if (indCalor) indCalor.innerText = "OFF";
    let placa = document.getElementById("placa-ceramica");
    if (placa) placa.classList.remove("placa-quente");

    let peixinha = document.getElementById("peixinha-magnetica");
    if (peixinha) peixinha.classList.remove("peixinha-girando");

    atualizarVisualVidraria();
    mostrarMensagemGlob("🧯 Chuveiro de emergência acionado! Bancada e vidrarias renovadas com sucesso.");
};

// ==========================================
// CHAPA AQUECEDORA E AGITADOR MAGNÉTICO
// ==========================================
window.ajustarAquecimento = function(delta) {
    if(typeof tocarSomClick === "function") tocarSomClick();
    if (checarBloqueioVidraria()) return;

    aquecimentoAtivo = Math.max(0, Math.min(250, aquecimentoAtivo + delta));
    temperaturaAlvo = Math.max(25, aquecimentoAtivo);

    let ind = document.getElementById("indicador-calor");
    if (ind) ind.innerText = aquecimentoAtivo > 0 ? `${aquecimentoAtivo}°C` : "OFF";

    let placa = document.getElementById("placa-ceramica");
    if (placa) {
        if (aquecimentoAtivo >= 50) placa.classList.add("placa-quente");
        else placa.classList.remove("placa-quente");
    }

    // Se aquecer seco sem líquido a mais de 120°C, a vidraria trinca
    if (aquecimentoAtivo >= 120 && misturaVidraria.volumeTotal === 0) {
        tocarSomSintetizado('vidro');
        vidrariaQuebrada = true;
        let trincos = document.getElementById("trincos-vidro");
        if (trincos) trincos.classList.remove("escondido");
        mostrarMensagemGlob("💥 VIDRARIA TRINCOU! Nunca aqueça vidro seco em alta temperatura!");
    }
};

window.toggleAgitador = function() {
    if(typeof tocarSomClick === "function") tocarSomClick();
    agitadorAtivo = !agitadorAtivo;

    let peixinha = document.getElementById("peixinha-magnetica");
    let btnAg = document.getElementById("btn-agitador");
    
    if (peixinha) {
        if (agitadorAtivo) peixinha.classList.add("peixinha-girando");
        else peixinha.classList.remove("peixinha-girando");
    }
    if (btnAg) btnAg.innerText = agitadorAtivo ? "Desligar ⏹️" : "Ligar 🌀";

    if (agitadorAtivo) {
        mostrarMensagemGlob("Agitador magnético ativado.");
    }
};

window.toggleExaustor = function() {
    if(typeof tocarSomClick === "function") tocarSomClick();
    exaustorAtivo = !exaustorAtivo;

    let status = document.getElementById("status-exaustor");
    if (status) {
        status.innerText = exaustorAtivo ? "LIGADO (Seguro)" : "DESLIGADO";
        status.style.color = exaustorAtivo ? "#22c55e" : "#ef4444";
    }

    if (exaustorAtivo) {
        let fumaca = document.getElementById("efeito-fumaca");
        if (fumaca && !vidrariaQuebrada) fumaca.classList.add("escondido");
        mostrarMensagemGlob("Exaustor da capela ligado. Vapores sendo aspirados.");
    }
};

// ==========================================
// ESTAÇÃO DE CENTRIFUGAÇÃO
// ==========================================
function abrirModalCentrifuga() {
    let modal = document.getElementById("modal-centrifuga");
    if (modal) modal.style.display = "flex";
}
window.fecharModalCentrifuga = function() {
    let modal = document.getElementById("modal-centrifuga");
    if (modal) modal.style.display = "none";
};

window.toggleCentrifugacao = function() {
    if(typeof tocarSomClick === "function") tocarSomClick();
    let rotor = document.getElementById("rotor-centrifuga");
    let status = document.getElementById("centrifuga-status-txt");
    let btn = document.getElementById("btn-rodar-centrifuga");

    if (!centrifugando) {
        centrifugando = true;
        if (rotor) rotor.classList.add("rotor-girando");
        if (status) { status.innerText = "🌀 Centrifugando a 4000 RPM..."; status.style.color = "#0284c7"; }
        if (btn) btn.innerText = "Parar ⏹️";

        setTimeout(() => {
            if (centrifugando) {
                // Ao centrifugar, qualquer precipitado vai para o fundo
                misturaVidraria.temPrecipitado = true;
                misturaVidraria.corLiquido = "rgba(56, 189, 248, 0.25)"; // Sobrenadante translúcido
                atualizarVisualVidraria();
                if (status) { status.innerText = "✅ Centrifugação concluída! Precipitado decantado no fundo."; status.style.color = "#16a34a"; }
                window.toggleCentrifugacao();
            }
        }, 3500);
    } else {
        centrifugando = false;
        if (rotor) rotor.classList.remove("rotor-girando");
        if (btn) btn.innerText = "Iniciar Rotação 🌀";
    }
};

// ==========================================
// RENDERIZAÇÃO VISUAL DA VIDRARIA E MEDIDORES
// ==========================================
function atualizarVisualVidraria() {
    let elLiq = document.getElementById("liquido-camada");
    if (elLiq) {
        let porcentagem = Math.min(92, (misturaVidraria.volumeTotal / misturaVidraria.capacidadeMax) * 100);
        elLiq.style.height = `${porcentagem}%`;
        elLiq.style.backgroundColor = misturaVidraria.corLiquido;
    }

    let elPrec = document.getElementById("precipitado-fundo");
    if (elPrec) {
        if (misturaVidraria.temPrecipitado) elPrec.classList.remove("escondido");
        else elPrec.classList.add("escondido");
    }

    // Atualiza Medidor de pH
    let elPh = document.getElementById("valor-ph");
    if (elPh) {
        let classePh = "ph-neutro";
        let rotulo = "Neutro";
        if (phAtual < 6.5) { classePh = "ph-acido"; rotulo = "Ácido"; }
        else if (phAtual > 7.5) { classePh = "ph-basico"; rotulo = "Básico"; }
        
        elPh.className = classePh;
        elPh.innerText = `${phAtual.toFixed(1)} (${rotulo})`;
    }

    // Atualiza Descrição da Mistura
    let elDesc = document.getElementById("descricao-mistura");
    if (elDesc) {
        if (vidrariaQuebrada) {
            elDesc.innerText = "❌ Vidraria estilhaçada! Acione o chuveiro de emergência para limpar a bancada.";
        } else if (misturaVidraria.volumeTotal === 0 && Object.keys(misturaVidraria.reagentes).length === 0) {
            elDesc.innerText = `Recipiente limpo e vazio. Adicione solvente ou reagentes das prateleiras.`;
        } else {
            let listaNomes = [];
            for (let reg in misturaVidraria.reagentes) {
                if (misturaVidraria.reagentes[reg] > 0) {
                    listaNomes.push(`${reg} (${misturaVidraria.reagentes[reg].toFixed(1)})`);
                }
            }
            elDesc.innerText = `Volume: ${misturaVidraria.volumeTotal}mL | Reagentes: ${listaNomes.join(", ") || "Água pura"}`;
        }
    }
}

// Loop contínuo de temperatura realista
setInterval(() => {
    let elTemp = document.getElementById("valor-temperatura");
    if (Math.abs(temperaturaAtual - temperaturaAlvo) > 0.2) {
        temperaturaAtual += (temperaturaAlvo - temperaturaAtual) * 0.15;
    } else {
        temperaturaAtual = temperaturaAlvo;
    }
    if (elTemp) elTemp.innerText = `${temperaturaAtual.toFixed(1)} °C`;
}, 200);

function checarBloqueioVidraria() {
    if (vidrariaQuebrada) {
        mostrarMensagemGlob("⚠️ Vidraria quebrada! Acione o Chuveiro de Emergência para limpar a bancada.");
        return true;
    }
    return false;
}

// Inicialização da bancada
document.addEventListener("DOMContentLoaded", () => {
    atualizarVisualVidraria();
});
