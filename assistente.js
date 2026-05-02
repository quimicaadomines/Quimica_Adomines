// ==========================================
// ASSISTENTE DE VOZ ADÔMINES (V4 - DIREÇÕES, TUTORIAL INTELIGENTE E ESTADO)
// ==========================================
let assistenteAtivo = localStorage.getItem("assistenteAtiva") !== "false"; 
let assistenteReconhecimento = null;
let assistenteSintese = window.speechSynthesis;
let vozAssistente = null;
let contextoAssistente = null; 

let estouFalando = false; 
let espacoPressionado = false;
let tempoPressaoEspaco = 0;
window.falaAtual = null;

// ==========================================
// 0. CAIXA DE MENSAGEM EXCLUSIVA DA ASSISTENTE
// ==========================================
window.mostrarMensagemAssistente = function(texto, persistente = false) {
    let caixa = document.getElementById("msg-assistente-box");
    if (!caixa) {
        caixa = document.createElement("div");
        caixa.id = "msg-assistente-box";
        caixa.style.cssText = "position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.85); color:#fff; padding:12px 24px; border-radius:30px; z-index:999999; font-family:sans-serif; font-size:16px; text-align:center; max-width:85%; pointer-events:none; transition: opacity 0.3s; border: 2px solid #3b82f6;";
        document.body.appendChild(caixa);
    }
    caixa.innerText = texto;
    caixa.style.opacity = "1";
    caixa.style.display = "block";
    
    if (window.msgAssistenteTimeout) clearTimeout(window.msgAssistenteTimeout);
    
    if (!persistente) {
        window.msgAssistenteTimeout = setTimeout(() => {
            window.ocultarMensagemAssistente();
        }, 4000);
    }
};

window.ocultarMensagemAssistente = function() {
    let caixa = document.getElementById("msg-assistente-box");
    if (caixa) {
        caixa.style.opacity = "0";
        setTimeout(() => { if(caixa.style.opacity === "0") caixa.style.display = "none"; }, 300);
    }
};

// ==========================================
// 1. CONFIGURAÇÃO DA VOZ E RECONHECIMENTO
// ==========================================
function carregarVozes() {
    let vozes = assistenteSintese.getVoices();
    if(vozes.length === 0) return;
    let vozesBR = vozes.filter(v => v.lang === 'pt-BR' || v.lang === 'pt_BR' || v.lang.includes('pt-BR'));
    vozAssistente = vozesBR.length > 0 ? (vozesBR.find(v => v.name.includes('Online') || v.name.includes('Google') || v.name.includes('Neural')) || vozesBR[0]) : vozes[0];
}
if (speechSynthesis.onvoiceschanged !== undefined) { speechSynthesis.onvoiceschanged = carregarVozes; }

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    assistenteReconhecimento = new SpeechRecognition();
    assistenteReconhecimento.lang = 'pt-BR'; 
    assistenteReconhecimento.continuous = true; 
    assistenteReconhecimento.interimResults = false;

    assistenteReconhecimento.onstart = function() {
        let btn = document.getElementById("btnAssistente");
        if(btn) btn.classList.add("mic-ouvindo");
    };

    assistenteReconhecimento.onresult = function(event) {
        let comandoOriginal = event.results[event.results.length - 1][0].transcript.trim();
        if(comandoOriginal.length > 1) mostrarMensagemAssistente('🎤 Eu ouvi: "' + comandoOriginal + '"', true);
        if(!assistenteAtivo || estouFalando || comandoOriginal.length < 2) {
            setTimeout(ocultarMensagemAssistente, 2000); return;
        }
        processarComandoVoz(comandoOriginal);
    };

    assistenteReconhecimento.onerror = function(event) {
        if(event.error === 'not-allowed') {
            mostrarMensagemAssistente("Permissão do microfone negada.", false);
            assistenteAtivo = false; 
            localStorage.setItem("assistenteAtiva", "false");
            let btn = document.getElementById("btnAssistente"); if(btn) btn.classList.remove("mic-ouvindo");
        }
    };

    assistenteReconhecimento.onend = function() {
        let btn = document.getElementById("btnAssistente");
        if(btn && !espacoPressionado) btn.classList.remove("mic-ouvindo");
        if (assistenteAtivo && espacoPressionado && !estouFalando) {
            try { assistenteReconhecimento.start(); } catch(e){}
        }
    };
}

// ==========================================
// 2. FUNÇÃO DE FALA E CONTROLE DE ESTADO
// ==========================================
window.falarAssistente = function(texto) {
    if(assistenteSintese.speaking) assistenteSintese.cancel(); 
    if(!vozAssistente) carregarVozes();
    
    estouFalando = true; 
    window.falaAtual = new SpeechSynthesisUtterance(texto);
    window.falaAtual.lang = "pt-BR"; 
    if(vozAssistente) window.falaAtual.voice = vozAssistente;
    window.falaAtual.rate = 1.0; 
    window.falaAtual.pitch = 1.1; 
    
    window.falaAtual.onend = function() { estouFalando = false; window.ocultarMensagemAssistente(); };
    window.falaAtual.onerror = function() { estouFalando = false; window.ocultarMensagemAssistente(); };

    mostrarMensagemAssistente('🤖 Adômines: "' + texto + '"', true);
    assistenteSintese.speak(window.falaAtual);
}

window.toggleAssistenteVoz = function(silencioso = false) {
    if(!silencioso && typeof tocarSomClick === "function") tocarSomClick();
    if (assistenteAtivo) {
        assistenteAtivo = false; 
        localStorage.setItem("assistenteAtiva", "false");
        contextoAssistente = null; 
        try { assistenteReconhecimento.stop(); } catch(e){} 
        let btn = document.getElementById("btnAssistente"); if(btn) btn.classList.remove("mic-ouvindo");
        if(!silencioso) falarAssistente("Assistente desativada.");
    } else {
        assistenteAtivo = true; 
        localStorage.setItem("assistenteAtiva", "true");
        contextoAssistente = null; 
        if(!silencioso) falarAssistente("Assistente ativada. Segure a tecla Espaço para falar.");
    }
}

// ==========================================
// 3. BARRA DE ESPAÇO E BOAS-VINDAS
// ==========================================
function dispararBoasVindas() {
    if (!sessionStorage.getItem("boasVindasLidas")) {
        sessionStorage.setItem("boasVindasLidas", "true");
        if (assistenteSintese) assistenteSintese.resume();
        if(typeof musica !== 'undefined' && musica && musica.paused && !mutado) musica.play().catch(()=>{});
        
        if(assistenteAtivo) {
            falarAssistente("Olá! A assistente de voz já está ligada. Segure a tecla espaço para falar. Para desativar a assistente, dê um clique rápido na tecla espaço.");
        } else {
            falarAssistente("Olá! O jogo possui uma assistente. Para ativar, dê um clique rápido na tecla espaço.");
        }
    }
}

document.addEventListener("click", dispararBoasVindas, { once: true });

document.addEventListener("keydown", (e) => {
    if(e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
    if (e.code !== "F5" && e.code !== "F12") dispararBoasVindas();

    if (e.code === "Space") { 
        e.preventDefault(); 
        if (e.repeat) return; 
        if (assistenteSintese.speaking) assistenteSintese.cancel();

        tempoPressaoEspaco = Date.now();
        espacoPressionado = true;
        if(typeof tocarSomClick === "function") tocarSomClick(); 
        if (assistenteAtivo && !estouFalando && assistenteReconhecimento) {
            try { assistenteReconhecimento.start(); } catch(err){}
        }
    }
});

document.addEventListener("keyup", (e) => {
    if(e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
    if (e.code === "Space") { 
        e.preventDefault(); 
        espacoPressionado = false;
        let tempoSegurado = Date.now() - tempoPressaoEspaco;
        
        if (tempoSegurado < 350) {
            try { assistenteReconhecimento.abort(); } catch(err){}
            toggleAssistenteVoz();
        } else {
            if (assistenteAtivo && assistenteReconhecimento) {
                try { assistenteReconhecimento.stop(); } catch(err){}
                setTimeout(ocultarMensagemAssistente, 2000); 
            }
        }
    }
});

// ==========================================
// 4. OLHO BIÔNICO E SINCRONIA VISUAL
// ==========================================
const observadorAutomatico = new MutationObserver(() => {
    if (!assistenteAtivo || estouFalando) return;
    let modalClass = document.getElementById("modal-classificacao");
    if (modalClass && window.getComputedStyle(modalClass).display !== "none" && !modalClass.dataset.lido) {
        modalClass.dataset.lido = "true";
        falarAssistente("A estrutura está correta! Agora, classifique a molécula para ganhar a estrela. Diga qual marcar para Cadeia, Disposição, Saturação e Natureza. Depois diga Confirmar.");
        return;
    }
    let enunciado = document.querySelector(".hud-pergunta") || document.getElementById("texto-enunciado");
    if (enunciado && enunciado.innerText.trim().length > 5 && enunciado.dataset.ultimoLido !== enunciado.innerText) {
        enunciado.dataset.ultimoLido = enunciado.innerText;
        falarAssistente("A tarefa é: " + enunciado.innerText.replace("💡", ""));
    }
});

document.addEventListener("DOMContentLoaded", () => {
    observadorAutomatico.observe(document.body, { childList: true, subtree: true, characterData: true });
});

// ==========================================
// 5. CÉREBRO LOCAL (TRADUTOR DE PALAVRAS E DIREÇÕES)
// ==========================================
const normalizarVozNum = (str) => {
    let t = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return t.replace(/\bum\b/g, "1").replace(/\bdois\b/g, "2").replace(/\btres\b/g, "3").replace(/\bquatro\b/g, "4").replace(/\bcinco\b/g, "5").replace(/[.,!?]/g, "");
};

async function processarComandoVoz(comandoOriginal) {
    let limpo = normalizarVozNum(comandoOriginal); 
    const tem = (...palavras) => palavras.some(p => new RegExp('\\b' + p + '\\b', 'i').test(limpo));

    if (contextoAssistente) {
        if (tem("cancela", "cancelar", "esquece", "esquecer", "sair", "para", "parar")) {
            contextoAssistente = null; 
            return falarAssistente("Operação cancelada.");
        }
        if (contextoAssistente === "escolher_modo_estruturando_base") {
            if (tem("livre")) { contextoAssistente = null; return executarIntencao({acao: "JOGAR_ESTRUTURANDO", detalhe: "livre"}); }
            if (tem("desafio")) { contextoAssistente = "escolher_submodo_estruturando"; return falarAssistente("O modo desafio contém os seguintes níveis: fácil, médio, difícil e impossível. Qual você quer jogar?"); }
            return falarAssistente("Por favor, responda se você quer jogar o modo livre ou o modo desafio.");
        }
        if (contextoAssistente === "escolher_submodo_estruturando") {
            if (tem("facil")) { contextoAssistente = null; return executarIntencao({acao: "JOGAR_ESTRUTURANDO", detalhe: "facil"}); }
            if (tem("medio", "media")) { contextoAssistente = null; return executarIntencao({acao: "JOGAR_ESTRUTURANDO", detalhe: "medio"}); }
            if (tem("dificil")) { contextoAssistente = null; return executarIntencao({acao: "JOGAR_ESTRUTURANDO", detalhe: "dificil"}); }
            if (tem("impossivel")) { contextoAssistente = null; return executarIntencao({acao: "JOGAR_ESTRUTURANDO", detalhe: "impossivel"}); }
            return falarAssistente("Por favor, escolha um nível válido: fácil, médio, difícil ou impossível.");
        }
        if (contextoAssistente === "escolher_modo_inclusivo") {
            if (tem("reconhecer", "reconhece")) { contextoAssistente = null; return executarIntencao({acao: "JOGAR_INCLUSIVO", detalhe: "reconhecer"}); }
            if (tem("relacionar", "relaciona")) { contextoAssistente = null; return executarIntencao({acao: "JOGAR_INCLUSIVO", detalhe: "relacionar"}); }
            if (tem("interpretar", "interpreta")) { contextoAssistente = null; return executarIntencao({acao: "JOGAR_INCLUSIVO", detalhe: "interpretar"}); }
            return falarAssistente("Por favor, escolha entre: reconhecer, relacionar ou interpretar.");
        }
    }

    if (tem("fecha", "fechar", "sai", "sair", "esconde", "esconder", "oculta", "ocultar")) {
        if (tem("configuracoes", "configura", "configurar", "ajuste", "ajustes")) return executarIntencao({acao: "FECHAR_CONFIG"});
        if (tem("tabela", "elemento", "elementos")) return executarIntencao({acao: "FECHAR_TABELA"});
        if (tem("conquista", "conquistas", "trofeu", "medalha")) return executarIntencao({acao: "FECHAR_CONQUISTAS"});
        if (tem("chat", "conversa", "adm", "administrador")) return executarIntencao({acao: "FECHAR_CHAT"});
        if (tem("tudo", "janela", "modal", "tutorial")) return executarIntencao({acao: "FECHAR_TUDO"});
    }

    let regexPeca = /(carbono|oxigenio|hidrogenio|nitrogenio|enxofre|fosforo|cloro|fluor|bromo|iodo)\s*(\d+)?/gi;
    let matchesPeca =[...limpo.matchAll(regexPeca)]; 

    // NOVIDADE: Adiciona ligação no átomo detectando esquerda, direita, cima e baixo
    if (tem("liga", "ligar", "coloca", "colocar", "adiciona", "adicionar", "bota", "botar", "insere", "inserir") && tem("ligacao") && matchesPeca.length === 1) {
        let pA = matchesPeca[0][0];
        let t = "simples"; if(tem("dupla", "duas")) t="dupla"; if(tem("tripla", "tres", "três")) t="tripla";
        
        let d = "direita"; // Posição padrão
        if (tem("esquerda", "atras")) d = "esquerda";
        else if (tem("cima", "acima", "topo", "em cima")) d = "cima";
        else if (tem("baixo", "abaixo", "embaixo")) d = "baixo";
        
        return executarIntencao({acao: "ADICIONAR_LIGACAO_ATOMO", detalhe: `${pA}|${t}|${d}`});
    }

    if (tem("liga", "ligar", "conecta", "conectar", "junta", "juntar", "interliga", "interligar", "une", "unir") && matchesPeca.length >= 2) {
        let pA = matchesPeca[0][0]; let pB = matchesPeca[1][0];
        let t = "simples"; if(tem("dupla", "duas")) t="dupla"; if(tem("tripla", "tres", "três")) t="tripla";
        return executarIntencao({acao: "LIGAR_ATOMOS", detalhe: `${pA}|${pB}|${t}`});
    }
    
    if (tem("coloca", "colocar", "cria", "criar", "adiciona", "adicionar", "pega", "pegar", "inserir", "bota", "botar") && tem("ligacao")) {
        let t = "simples"; if(tem("dupla", "duas")) t="dupla"; if(tem("tripla", "tres")) t="tripla";
        return executarIntencao({acao: "CRIAR_LIGACAO", detalhe: t});
    }

    if (tem("completa", "completar", "hidrogenio", "encher", "preenche", "preencher") && matchesPeca.length >= 1 && !tem("cria", "criar", "coloca", "colocar")) {
        return executarIntencao({acao: "COMPLETAR_VALENCIA", detalhe: matchesPeca[0][0]});
    }
    if (tem("desvincula", "desvincular", "separa", "separar", "solta", "soltar", "desconecta", "desconectar") && matchesPeca.length >= 1) {
        return executarIntencao({acao: "DESVINCULAR_PECA", detalhe: matchesPeca[0][0]});
    }
    if (tem("exclui", "excluir", "apaga", "apagar", "deleta", "deletar", "remove", "remover", "tira", "tirar") && matchesPeca.length >= 1) {
        return executarIntencao({acao: "EXCLUIR_PECA", detalhe: matchesPeca[0][0]});
    }
    if (tem("coloca", "colocar", "cria", "criar", "adiciona", "adicionar", "bota", "botar", "pega", "pegar", "inserir") && matchesPeca.length >= 1) {
        return executarIntencao({acao: "CRIAR_ATOMO", detalhe: matchesPeca[0][1] || matchesPeca[0][0]}); 
    }
    
    if (tem("limpa quadro", "limpar quadro", "apaga tudo", "apagar tudo", "recomecar", "recomeça")) return executarIntencao({acao: "LIMPAR_QUADRO"});
    if (tem("o que tem", "ler quadro", "minhas pecas", "minha estrutura")) return executarIntencao({acao: "LER_QUADRO"});

    let modalClass = document.getElementById("modal-classificacao");
    if (modalClass && window.getComputedStyle(modalClass).display !== "none") {
        if (tem("confirma", "confirmar", "verifica", "verificar", "completa", "completar", "envia", "enviar", "terminei", "finaliza", "finalizar")) return executarIntencao({acao: "CONFIRMAR_CLASSIFICACAO"});
        let opMap = { "aberta": "Aberta", "fechada": "Fechada", "normal": "Normal", "ramificada": "Ramificada", "saturada": "Saturada", "insaturada": "Insaturada", "homogenea": "Homogênea", "heterogenea": "Heterogênea" };
        let marcadas =[];
        for (let key in opMap) {
            if (tem(key)) {
                let radio = document.querySelector(`input[value="${opMap[key]}"]`);
                if(radio) { radio.checked = true; marcadas.push(opMap[key]); }
            }
        }
        if (marcadas.length > 0) return falarAssistente(`Marcadas: ${marcadas.join(", ")}.`);
    }

    if (tem("cancela", "cancelar", "esquece", "esquecer", "deixa pra la")) return falarAssistente("Cancelado."); 
    if (tem("verifica", "verificar", "checa", "checar", "terminei a molecula", "terminei a estrutura", "veja se ta certo", "corrigir estrutura")) return executarIntencao({acao: "VERIFICAR_ESTRUTURA"});
    
    if (tem("desmuta", "desmutar", "com som", "liga som", "ativa som", "volta som", "tira mudo", "tirar mudo", "desativar mudo")) return executarIntencao({acao: "DESMUTAR_SOM"});
    if (tem("muta", "mutar", "mudo", "tira som", "tirar som", "silencio", "sem som", "desliga som", "desligar som")) return executarIntencao({acao: "MUTAR_SOM"});
    
    if (tem("volta", "voltar", "retorna", "retornar", "anterior")) return executarIntencao({acao: "VOLTAR"});
    if (tem("desliga", "desligar", "para", "parar", "desativa", "desativar") && tem("assistente", "voz")) return executarIntencao({acao: "DESLIGAR_ASSISTENTE"});
    
    // NOVIDADE: Abre o tutorial vasculhando botões com o texto "reabrir tutorial"
    if (tem("abre", "abrir", "mostra", "mostrar") && tem("tutorial", "ajuda")) return executarIntencao({acao: "ABRIR_TUTORIAL"});

    if (tem("estrutura", "estruturando") || (tem("inicia", "iniciar", "jogar") && tem("livre", "desafio"))) {
        contextoAssistente = "escolher_modo_estruturando_base";
        return falarAssistente("Você quer jogar o modo livre ou o modo desafio?");
    }

    mostrarMensagemAssistente("🧠 Consultando IA...", true);
    try {
        const res = await fetch(`/api/assistente`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fraseJogador: comandoOriginal }) });
        if(!res.ok) throw new Error("Erro de internet.");
        const intencao = await res.json();
        executarIntencao(intencao, comandoOriginal);
    } catch (e) { 
        falarAssistente(`Eu ouvi: "${comandoOriginal}". Mas não encontrei esse comando e a inteligência da internet não respondeu.`); 
    }
}

// ==========================================
// 6. MOTOR DE EXECUÇÃO TOTAL
// ==========================================
function executarIntencao(intencao, comandoFalado = "") {
    let acao = (intencao.acao || "DESCONHECIDO").toUpperCase();
    let detalhe = (intencao.detalhe || "").toLowerCase();

    switch (acao) {
        case "FECHAR_CONFIG": let mConf = document.getElementById("menu"); if(mConf) mConf.style.display = "none"; falarAssistente("Fechado."); break;
        case "FECHAR_TUDO": document.querySelectorAll('.modal-overlay').forEach(el => el.style.display = "none"); falarAssistente("Fechado."); break;
        case "ABRIR_CONFIG": if(typeof window.toggleMenu === "function") window.toggleMenu(new Event('click')); break;
        case "DESMUTAR_SOM": if(typeof window.toggleMute === "function") window.toggleMute("desmutar"); falarAssistente("Som ativado."); break;
        case "MUTAR_SOM": if(typeof window.toggleMute === "function") window.toggleMute("mutar"); falarAssistente("Som silenciado."); break;
        case "VOLTAR": if(window.history.length > 1) window.history.back(); else window.mudarTela('index.html'); falarAssistente("Voltando."); break;
        
        // CORREÇÃO DO TUTORIAL: Procura pelo texto exato nos botões da tela
        case "ABRIR_TUTORIAL":
        case "IR_TUTORIAL":
            let modalTut = document.getElementById("tutorial-genshin-overlay") || document.getElementById("modal-tutorial");
            let botoesTela = Array.from(document.querySelectorAll('button, a, div, span, p'));
            let btnBuscaTexto = botoesTela.find(b => b.innerText && b.innerText.toLowerCase().includes("reabrir tutorial"));
            let btnClassId = document.querySelector('[id*="btn-tutorial"], [class*="btn-tutorial"], [onclick*="Tutorial"],[id*="ajuda"],[class*="ajuda"], [title*="Ajuda"]');
            
            if (modalTut && window.getComputedStyle(modalTut).display === "none") {
                modalTut.style.display = "flex"; falarAssistente("Abrindo o tutorial na tela.");
            } else if (btnBuscaTexto) {
                btnBuscaTexto.click(); falarAssistente("Abrindo o tutorial na tela.");
            } else if (btnClassId) {
                btnClassId.click(); falarAssistente("Abrindo o tutorial na tela.");
            } else if(typeof window.abrirTutorial === "function") {
                window.abrirTutorial(); falarAssistente("Abrindo o tutorial na tela.");
            } else {
                falarAssistente("Não consegui encontrar o botão de ajuda nesta tela.");
            }
            break;

        case "JOGAR_ESTRUTURANDO":
            let d = normalizarVozNum(detalhe);
            d = d.includes("facil") ? "facil" : d.includes("medio") ? "medio" : d.includes("dificil") ? "dificil" : d.includes("impossivel") ? "impossivel" : "livre";
            localStorage.setItem("modoAtual", d === "livre" ? "livre" : d);
            falarAssistente(`Iniciando o modo ${d}.`);
            if(typeof window.mudarTela === "function") window.mudarTela('estruturando.html'); break;

        case "VERIFICAR_ESTRUTURA": if(typeof window.verificarMoleculaDesafio === "function") { falarAssistente("Verificando..."); window.verificarMoleculaDesafio(); } break;
        
        case "CRIAR_ATOMO": if(typeof window.adicionarAtomoVoz === "function") window.adicionarAtomoVoz(detalhe); break;
        case "CRIAR_LIGACAO": if(typeof window.adicionarLigacaoVoz === "function") window.adicionarLigacaoVoz(detalhe); break;
        
        // NOVIDADE: Passa a direção para o quadro desenhar
        case "ADICIONAR_LIGACAO_ATOMO":
            let pts = detalhe.split("|");
            if(pts.length >= 2 && typeof window.adicionarLigacaoEmAtomoVoz === "function") {
                window.adicionarLigacaoEmAtomoVoz(pts[0], pts[1], pts[2] || "direita");
            }
            break;

        case "LIGAR_ATOMOS":
            let p = detalhe.split("|");
            if(p.length >= 3 && typeof window.ligarAtomosVoz === "function") window.ligarAtomosVoz(p[0], p[1], p[2] || "simples"); break;
        case "COMPLETAR_VALENCIA": if(typeof window.acaoPecaVoz === "function") window.acaoPecaVoz(detalhe, "completar"); break;
        case "EXCLUIR_PECA": if(typeof window.acaoPecaVoz === "function") window.acaoPecaVoz(detalhe, "excluir"); break;
        case "LIMPAR_QUADRO": if(typeof window.limparQuadro === "function") { window.limparQuadro(); falarAssistente("Quadro limpo."); } break;
        case "LER_QUADRO": if(typeof window.lerQuadroVoz === "function") window.lerQuadroVoz(); break;
        
        default: falarAssistente(`Eu ouvi: "${comandoFalado}". Mas não tem essa opção na tela.`); break;
    }
}

// ==========================================
// 7. FUNÇÕES DE LEGO DO QUADRO
// ==========================================
window.obterNomeElemento = function(sigla) {
    let t = normalizarVozNum(sigla).replace(/atomo de |átomo de |um |uma /g, "").trim();
    if(typeof elementosTabela !== "undefined") { let e = elementosTabela.find(x => normalizarVozNum(x.s) === t || normalizarVozNum(x.nome) === t); if(e) return { sigla: e.s, nome: e.nome }; }
    const m = { "carbono":"C", "oxigenio":"O", "hidrogenio":"H", "nitrogenio":"N", "enxofre":"S", "fosforo":"P", "cloro":"Cl", "fluor":"F", "bromo":"Br", "iodo":"I" };
    if(m[t]) return { sigla: m[t], nome: t };
    return { sigla: sigla.toUpperCase(), nome: sigla };
}

window.atualizarTagsDeVoz = function() {
    let q = document.getElementById("quadro-inner"); if(!q) return;
    let ats = Array.from(q.querySelectorAll('.peca-draggable.atomo')); let c = {};
    ats.forEach(a => {
        let n = window.obterNomeElemento(a.dataset.sigla).nome;
        if (!a.dataset.idVoz) {
            c[n] = (c[n] || 0) + 1; a.dataset.idVoz = `${n} ${c[n]}`;
            let s = document.createElement("div"); s.className = "voz-tag"; s.style.cssText = "position:absolute; top:-10px; right:-10px; background:#1e293b; color:white; border-radius:50%; width:18px; height:18px; font-size:10px; display:flex; justify-content:center; align-items:center; z-index:99; box-shadow:0 0 5px rgba(0,0,0,0.5);"; s.innerText = c[n]; a.appendChild(s);
        } else { let num = parseInt(a.dataset.idVoz.replace(/\D/g, '')); if(num > (c[n] || 0)) c[n] = num; }
    });
}

window.encontrarPecaVoz = function(nome) {
    let q = document.getElementById("quadro-inner"); if(!q) return null;
    let p = normalizarVozNum(nome); if(!p.match(/\d+/)) p += " 1"; 
    let ats = Array.from(q.querySelectorAll('.peca-draggable.atomo'));
    return ats.find(a => normalizarVozNum(a.dataset.idVoz || "") === p);
}

window.adicionarAtomoVoz = function(nome) {
    let q = document.getElementById("quadro-inner"); let l = document.getElementById("lista-atomos");
    if(!q || !l) return falarAssistente("Você precisa estar no modo Estruturando.");
    let i = window.obterNomeElemento(nome);
    let base = Array.from(l.querySelectorAll('.atomo')).find(a => a.dataset.sigla.toLowerCase() === i.sigla.toLowerCase());
    if(!base) return falarAssistente(`O átomo de ${i.nome} não está disponível nesta fase.`);
    
    let novo = base.cloneNode(true); novo.classList.add("no-quadro"); novo.dataset.id = Date.now() + "_" + Math.floor(Math.random() * 1000); novo.dataset.recemCriada = "true"; novo.style.position = "absolute"; novo.style.zIndex = 10;
    let r = q.getBoundingClientRect(); let off = Math.floor(Math.random() * 40) - 20;
    novo.style.left = (r.width/2 - 20 + off) + "px"; novo.style.top = (r.height/2 - 20 + off) + "px";
    
    q.appendChild(novo); window.atualizarTagsDeVoz();
    if(typeof window.verificarLigacoesQuimicas === "function") window.verificarLigacoesQuimicas();
    if(typeof window.atualizarContadores === "function") window.atualizarContadores();
    falarAssistente(`Adicionei o ${novo.dataset.idVoz} no quadro.`);
}

window.adicionarLigacaoVoz = function(tipo) {
    let q = document.getElementById("quadro-inner");
    if(!q) return falarAssistente("Você precisa estar no modo Estruturando.");
    let cl = "lig-simples"; let vl = 1; let ht = '<div class="linha"></div>';
    if(tipo.includes("dupla")) { cl = "lig-dupla"; vl = 2; ht = '<div class="linha"></div><div class="linha"></div>'; }
    if(tipo.includes("tripla")) { cl = "lig-tripla"; vl = 3; ht = '<div class="linha"></div><div class="linha"></div><div class="linha"></div>'; }
    
    let lig = document.createElement("div"); lig.className = `peca-draggable ligacao ${cl} no-quadro`; lig.dataset.tipo = "ligacao"; lig.dataset.val = vl; lig.dataset.id = Date.now() + "_" + Math.floor(Math.random() * 1000); lig.style.position = "absolute"; lig.style.zIndex = 9; lig.innerHTML = ht;
    
    let r = q.getBoundingClientRect(); let off = Math.floor(Math.random() * 40) - 20;
    lig.style.left = (r.width/2 - 20 + off) + "px"; lig.style.top = (r.height/2 + off) + "px";
    
    q.appendChild(lig);
    if(typeof window.verificarLigacoesQuimicas === "function") window.verificarLigacoesQuimicas();
    falarAssistente(`Adicionei uma ligação ${tipo} no quadro.`);
}

// NOVIDADE: Calcula as posições X e Y e aplica Rotação se for em cima ou embaixo
window.adicionarLigacaoEmAtomoVoz = function(nomeAtomo, tipo, direcao) {
    let pA = window.encontrarPecaVoz(nomeAtomo);
    if(!pA) return falarAssistente(`Não encontrei o ${nomeAtomo} no quadro.`);

    let cl = "lig-simples"; let vl = 1; let ht = '<div class="linha"></div>';
    if(tipo.includes("dupla")) { cl = "lig-dupla"; vl = 2; ht = '<div class="linha"></div><div class="linha"></div>'; }
    if(tipo.includes("tripla")) { cl = "lig-tripla"; vl = 3; ht = '<div class="linha"></div><div class="linha"></div><div class="linha"></div>'; }

    let lig = document.createElement("div"); 
    lig.className = `peca-draggable ligacao ${cl} no-quadro`; 
    lig.dataset.tipo = "ligacao"; 
    lig.dataset.val = vl; 
    lig.dataset.id = Date.now() + "_" + Math.floor(Math.random() * 1000); 
    lig.style.position = "absolute"; 
    lig.style.zIndex = 9; 
    lig.innerHTML = ht;

    let xA = parseFloat(pA.style.left) || 0; 
    let yA = parseFloat(pA.style.top) || 0;

    // Regras de deslocamento e rotação baseadas na direção falada
    if (direcao === "esquerda") {
        lig.style.left = (xA - 40) + "px";
        lig.style.top = (yA + 10) + "px";
    } else if (direcao === "cima") {
        lig.style.left = (xA + 10) + "px";
        lig.style.top = (yA - 40) + "px";
        lig.style.transform = "rotate(90deg)"; // Gira a peça visualmente
    } else if (direcao === "baixo") {
        lig.style.left = (xA + 10) + "px";
        lig.style.top = (yA + 50) + "px";
        lig.style.transform = "rotate(90deg)"; // Gira a peça visualmente
    } else { // direita é o padrão
        lig.style.left = (xA + 50) + "px";
        lig.style.top = (yA + 10) + "px";
    }

    document.getElementById("quadro-inner").appendChild(lig);
    if(typeof window.verificarLigacoesQuimicas === "function") window.verificarLigacoesQuimicas();
    if(typeof window.atualizarContadores === "function") window.atualizarContadores();
    
    falarAssistente(`Coloquei uma ligação ${tipo} na ${direcao} do ${pA.dataset.idVoz}.`);
}

window.ligarAtomosVoz = function(nA, nB, tipo) {
    let pA = window.encontrarPecaVoz(nA); let pB = window.encontrarPecaVoz(nB);
    if(!pA || !pB) return falarAssistente("Não encontrei um desses átomos. Diga o nome e o número, como Carbono 1.");
    if(pA === pB) return falarAssistente("Você não pode ligar um átomo nele mesmo.");
    
    let cl = "lig-simples"; let vl = 1; let ht = '<div class="linha"></div>';
    if(tipo.includes("dupla")) { cl = "lig-dupla"; vl = 2; ht = '<div class="linha"></div><div class="linha"></div>'; }
    if(tipo.includes("tripla")) { cl = "lig-tripla"; vl = 3; ht = '<div class="linha"></div><div class="linha"></div><div class="linha"></div>'; }
    let lig = document.createElement("div"); lig.className = `peca-draggable ligacao ${cl} no-quadro`; lig.dataset.tipo = "ligacao"; lig.dataset.val = vl; lig.dataset.id = Date.now() + "_" + Math.floor(Math.random() * 1000); lig.style.position = "absolute"; lig.style.zIndex = 9; lig.innerHTML = ht;
    
    let xA = parseFloat(pA.style.left) || 0; let yA = parseFloat(pA.style.top) || 0;
    lig.style.left = (xA + 40) + "px"; lig.style.top = (yA + 10) + "px";
    pB.style.left = (xA + 80) + "px"; pB.style.top = yA + "px";
    
    document.getElementById("quadro-inner").appendChild(lig);
    if(typeof window.verificarLigacoesQuimicas === "function") window.verificarLigacoesQuimicas();
    if(typeof window.atualizarContadores === "function") window.atualizarContadores();
    falarAssistente(`Liguei o ${pA.dataset.idVoz} ao ${pB.dataset.idVoz} com ligação ${tipo}.`);
}

window.acaoPecaVoz = function(nome, acao) {
    let peca = window.encontrarPecaVoz(nome);
    if(!peca) return falarAssistente(`Não achei o ${nome}.`);
    window.pecaAlvoMenu = peca; 
    if (acao === "completar") { if(typeof window.cmCompletar === "function") window.cmCompletar(); falarAssistente(`Valência completada.`); } 
    else if (acao === "excluir") { let n = peca.dataset.idVoz; if(typeof window.cmExcluir === "function") window.cmExcluir(); falarAssistente(`Excluído.`); }
    window.pecaAlvoMenu = null; 
}