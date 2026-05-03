// ==========================================
// ASSISTENTE DE VOZ ADÔMINES (V10 - SILENCIOSA E 100% SOB DEMANDA)
// ==========================================
let assistenteAtivo = localStorage.getItem("assistenteAtiva") === "true"; 
let assistenteReconhecimento = null;
let assistenteSintese = window.speechSynthesis;
let vozAssistente = null;
let contextoAssistente = null; 

let estouFalando = false; 
let espacoPressionado = false;
let tempoPressaoEspaco = 0;
window.falaAtual = null;

// ==========================================
// 0. CAIXA DE MENSAGEM
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
    if (!persistente) window.msgAssistenteTimeout = setTimeout(() => { window.ocultarMensagemAssistente(); }, 4000);
};

window.ocultarMensagemAssistente = function() {
    let caixa = document.getElementById("msg-assistente-box");
    if (caixa) {
        caixa.style.opacity = "0";
        setTimeout(() => { if(caixa.style.opacity === "0") caixa.style.display = "none"; }, 300);
    }
};

// ==========================================
// 1. CONFIGURAÇÃO DA VOZ
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
        let btn = document.getElementById("btnAssistente"); if(btn) btn.classList.add("mic-ouvindo");
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
            assistenteAtivo = false; localStorage.setItem("assistenteAtiva", "false");
            let btn = document.getElementById("btnAssistente"); if(btn) btn.classList.remove("mic-ouvindo");
        }
    };

    assistenteReconhecimento.onend = function() {
        let btn = document.getElementById("btnAssistente");
        if(btn && !espacoPressionado) btn.classList.remove("mic-ouvindo");
        if (assistenteAtivo && espacoPressionado && !estouFalando) { try { assistenteReconhecimento.start(); } catch(e){} }
    };
}

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
        assistenteAtivo = false; localStorage.setItem("assistenteAtiva", "false");
        contextoAssistente = null; 
        try { assistenteReconhecimento.stop(); } catch(e){} 
        let btn = document.getElementById("btnAssistente"); if(btn) btn.classList.remove("mic-ouvindo");
        if(!silencioso) falarAssistente("Assistente desativada.");
    } else {
        assistenteAtivo = true; localStorage.setItem("assistenteAtiva", "true");
        contextoAssistente = null; 
        if(!silencioso) falarAssistente("Assistente ativada. Segure a tecla Espaço para falar.");
    }
}

// ==========================================
// 3. INICIALIZAÇÃO SILENCIOSA E ESPAÇO
// ==========================================
function inicializarVozSilenciosamente() {
    if (!sessionStorage.getItem("audioLiberado")) {
        sessionStorage.setItem("audioLiberado", "true");
        if (assistenteSintese) assistenteSintese.resume();
        if(typeof musica !== 'undefined' && musica && musica.paused && !mutado) musica.play().catch(()=>{});
        // 100% Silencioso. Nenhuma fala de boas-vindas acontecerá aqui.
    }
}

document.addEventListener("click", inicializarVozSilenciosamente, { once: true });

document.addEventListener("keydown", (e) => {
    if(e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
    if (e.code !== "F5" && e.code !== "F12") inicializarVozSilenciosamente();

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

window.checagemBloqueioTela = function() {
    let modais = document.querySelectorAll('.modal-overlay');
    for(let m of modais) {
        if (window.getComputedStyle(m).display !== "none") return true;
    }
    return false;
}

// Leitura Especial de Introdução apenas do Modo Livre
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        let modoAtual = localStorage.getItem("modoAtual") || "";
        if (window.location.pathname.includes('estruturando') && modoAtual === "livre" && !sessionStorage.getItem("introLivreLida")) {
            sessionStorage.setItem("introLivreLida", "true");
            if (assistenteAtivo) {
                falarAssistente("Se divirta criando e explorando estruturas moleculares do jeito que quiser! No modo livre, você tem total liberdade para montar, testar e reinventar combinações sem limites ou regras rígidas. Atualmente, já existem 20 estruturas registradas — mas isso é só o começo. As possibilidades são praticamente infinitas. Experimente, erre, acerte e crie algo único!");
            }
        }
    }, 1500);
});

// ==========================================
// 5. CÉREBRO LOCAL (TRADUTOR)
// ==========================================
const normalizarVozNum = (str) => {
    let t = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return t.replace(/\bum\b/g, "1").replace(/\bdois\b/g, "2").replace(/\btres\b/g, "3").replace(/\bquatro\b/g, "4").replace(/\bcinco\b/g, "5").replace(/[.,!?]/g, "");
};

async function processarComandoVoz(comandoOriginal) {
    let limpo = normalizarVozNum(comandoOriginal); 
    const tem = (...palavras) => palavras.some(p => new RegExp('\\b' + p + '\\b', 'i').test(limpo));

    if (contextoAssistente) {
        if (tem("cancela", "cancelar", "esquece", "sair", "para")) { contextoAssistente = null; return falarAssistente("Cancelado."); }
        if (contextoAssistente === "escolher_modo_estruturando_base") {
            if (tem("livre")) { contextoAssistente = null; return executarIntencao({acao: "JOGAR_ESTRUTURANDO", detalhe: "livre"}); }
            if (tem("desafio")) { contextoAssistente = "escolher_submodo_estruturando"; return falarAssistente("O modo desafio contém: fácil, médio, difícil e impossível. Qual você quer jogar?"); }
            return falarAssistente("Por favor, responda livre ou desafio.");
        }
        if (contextoAssistente === "escolher_submodo_estruturando") {
            if (tem("facil")) { contextoAssistente = null; return executarIntencao({acao: "JOGAR_ESTRUTURANDO", detalhe: "facil"}); }
            if (tem("medio", "media")) { contextoAssistente = null; return executarIntencao({acao: "JOGAR_ESTRUTURANDO", detalhe: "medio"}); }
            if (tem("dificil")) { contextoAssistente = null; return executarIntencao({acao: "JOGAR_ESTRUTURANDO", detalhe: "dificil"}); }
            if (tem("impossivel")) { contextoAssistente = null; return executarIntencao({acao: "JOGAR_ESTRUTURANDO", detalhe: "impossivel"}); }
            return falarAssistente("Diga um nível válido: fácil, médio, difícil ou impossível.");
        }
        if (contextoAssistente === "escolher_modo_inclusivo") {
            if (tem("reconhecer", "reconhece")) { contextoAssistente = null; return executarIntencao({acao: "JOGAR_INCLUSIVO", detalhe: "reconhecer"}); }
            if (tem("relacionar", "relaciona")) { contextoAssistente = null; return executarIntencao({acao: "JOGAR_INCLUSIVO", detalhe: "relacionar"}); }
            if (tem("interpretar", "interpreta")) { contextoAssistente = null; return executarIntencao({acao: "JOGAR_INCLUSIVO", detalhe: "interpretar"}); }
            return falarAssistente("Diga: reconhecer, relacionar ou interpretar.");
        }
    }

    if (tem("fecha", "fechar", "sai", "sair", "esconde", "oculta")) {
        if (tem("configuracoes", "configura", "ajuste")) return executarIntencao({acao: "FECHAR_CONFIG"});
        if (tem("tabela", "elemento")) return executarIntencao({acao: "FECHAR_TABELA"});
        if (tem("conquista", "trofeu", "medalha")) return executarIntencao({acao: "FECHAR_CONQUISTAS"});
        if (tem("chat", "conversa")) return executarIntencao({acao: "FECHAR_CHAT"});
        if (tem("tudo", "janela", "modal", "tutorial")) return executarIntencao({acao: "FECHAR_TUDO"});
    }

    let ativadorRegex = /^(ad[ôo]mines|a dominis|a domines|adominis|as dominis|aldomines|o dominis|adomini|adomin|domines|dominis)\b/i;
    if (ativadorRegex.test(limpo)) {
        let pergunta = comandoOriginal.replace(/^(Ad[ôo]mines|A dominis|A domines|Adominis|As dominis|Aldomines|O dominis|Adomini|Adomin|Domines|Dominis)\s*/i, "").trim(); 
        if (pergunta.length > 2) {
            if(typeof window.abrirQuimiChat === "function") window.abrirQuimiChat(); 
            if(typeof window.enviarPerguntaQuimiChat === "function") window.enviarPerguntaQuimiChat(pergunta, true); 
        } else falarAssistente("Pode fazer sua pergunta de química.");
        return;
    }

    if (tem("ler", "leia", "lê") && tem("tutorial")) return executarIntencao({acao: "LER_TUTORIAL"});
    if (tem("ler", "leia", "lê") && tem("tela", "tudo")) return executarIntencao({acao: "LER_TELA"});
    if (tem("ler", "leia", "lê") && tem("alternativa", "alternativas", "item", "opcoes", "resposta")) return executarIntencao({acao: "LER_ALTERNATIVAS"});
    if (tem("ler", "leia", "lê") && tem("enunciado", "pergunta", "tarefa")) return executarIntencao({acao: "LER_ENUNCIADO"});
    
    if (tem("quais", "qual", "que") && tem("molecula", "moleculas", "estrutura", "catalogo", "cataloguei")) return executarIntencao({acao: "LER_CATALOGO"});
    if (tem("quais", "qual", "que") && tem("conquista", "conquistas", "trofeu", "trofeus", "consegui")) return executarIntencao({acao: "LER_CONQUISTAS"});
    if (tem("quais", "qual", "que") && tem("atomo", "atomos", "elemento", "elementos", "disponivel", "disponiveis", "tenho")) return executarIntencao({acao: "LER_ATOMOS_DISPONIVEIS"});

    if (tem("comando") || tem("adm") || tem("administrador")) {
        if (tem("platinar")) return executarIntencao({acao: "COMANDO_ADM", detalhe: "\\platinar"});
        if (tem("catalogador")) return executarIntencao({acao: "COMANDO_ADM", detalhe: "\\catalogador"});
        if (tem("limpar", "limpa")) return executarIntencao({acao: "COMANDO_ADM", detalhe: "\\limpar"});
        if (tem("completar", "completa")) return executarIntencao({acao: "COMANDO_ADM", detalhe: "\\completar"});
    }

    if (tem("cor", "lapis", "pintar")) {
        if (tem("borracha", "apagar", "transparente")) return executarIntencao({acao: "COR_BORRACHA"});
        if (tem("vermelho", "vermelha")) return executarIntencao({acao: "COR_VERMELHA"});
        if (tem("azul")) return executarIntencao({acao: "COR_AZUL"});
        if (tem("amarelo", "amarela")) return executarIntencao({acao: "COR_AMARELA"});
        if (tem("preto", "preta")) return executarIntencao({acao: "COR_PRETA"});
        if (tem("verde")) return executarIntencao({acao: "COR_VERDE"});
        if (tem("cinza")) return executarIntencao({acao: "COR_CINZA"});
    }
    if (tem("concluir", "terminei") && tem("pintura", "desenho")) return executarIntencao({acao: "CONCLUIR_PINTURA"});
    if (tem("informacao", "dica") && tem("quimica", "inclusiva")) return executarIntencao({acao: "INFO_INCLUSIVA"});

    let regexPeca = /(carbono|oxigenio|hidrogenio|nitrogenio|enxofre|fosforo|cloro|fluor|bromo|iodo)\s*(\d+)?/gi;
    let matchesPeca =[...limpo.matchAll(regexPeca)]; 

    if (tem("quantas ligacoes", "quantas ligações") && matchesPeca.length > 0) {
        return executarIntencao({acao: "CONSULTAR_TABELA_VOZ", detalhe: matchesPeca[0][1] ? matchesPeca[0][0].replace(matchesPeca[0][1],"").trim() + "|ligacoes" : matchesPeca[0][0] + "|ligacoes"});
    }
    if (tem("qual a massa", "massa atomica", "massa atômica") && matchesPeca.length > 0) {
        return executarIntencao({acao: "CONSULTAR_TABELA_VOZ", detalhe: matchesPeca[0][1] ? matchesPeca[0][0].replace(matchesPeca[0][1],"").trim() + "|massa" : matchesPeca[0][0] + "|massa"});
    }
    if (tem("numero atomico", "número atômico") && matchesPeca.length > 0) {
        return executarIntencao({acao: "CONSULTAR_TABELA_VOZ", detalhe: matchesPeca[0][1] ? matchesPeca[0][0].replace(matchesPeca[0][1],"").trim() + "|numero" : matchesPeca[0][0] + "|numero"});
    }

    if (tem("liga", "ligar", "coloca", "colocar", "adiciona", "insere") && tem("ligacao") && matchesPeca.length === 1) {
        let pA = matchesPeca[0][0];
        let t = "simples"; if(tem("dupla", "duas")) t="dupla"; if(tem("tripla", "tres", "três")) t="tripla";
        let d = "direita"; 
        if (tem("esquerda", "atras")) d = "esquerda";
        else if (tem("cima", "acima", "topo", "em cima")) d = "cima";
        else if (tem("baixo", "abaixo", "embaixo")) d = "baixo";
        return executarIntencao({acao: "ADICIONAR_LIGACAO_ATOMO", detalhe: `${pA}|${t}|${d}`});
    }

    if (tem("liga", "ligar", "conecta", "junta", "interliga", "une", "adiciona", "coloca") && matchesPeca.length >= 2) {
        let pA = matchesPeca[0][0]; let pB = matchesPeca[1][0];
        let t = "simples"; if(tem("dupla", "duas")) t="dupla"; if(tem("tripla", "tres", "três")) t="tripla";
        let d = ""; 
        if (tem("esquerda", "atras")) d = "esquerda";
        else if (tem("cima", "acima", "topo", "em cima")) d = "cima";
        else if (tem("baixo", "abaixo", "embaixo")) d = "baixo";
        else if (tem("direita", "frente")) d = "direita";
        return executarIntencao({acao: "LIGAR_ATOMOS", detalhe: `${pA}|${pB}|${t}|${d}`});
    }
    
    if (tem("coloca", "colocar", "cria", "crio", "adiciona", "insere") && tem("ligacao")) {
        let t = "simples"; if(tem("dupla", "duas")) t="dupla"; if(tem("tripla", "tres")) t="tripla";
        return executarIntencao({acao: "CRIAR_LIGACAO", detalhe: t});
    }

    if (tem("completa", "completar", "hidrogenio", "encher") && matchesPeca.length >= 1 && !tem("cria", "coloca")) {
        return executarIntencao({acao: "COMPLETAR_VALENCIA", detalhe: matchesPeca[0][0]});
    }
    if (tem("desvincula", "desvincular", "separa", "solta", "desconecta") && matchesPeca.length >= 1) {
        return executarIntencao({acao: "DESVINCULAR_PECA", detalhe: matchesPeca[0][0]});
    }
    if (tem("exclui", "excluir", "apaga", "deleta", "remove", "tira") && matchesPeca.length >= 1) {
        return executarIntencao({acao: "EXCLUIR_PECA", detalhe: matchesPeca[0][0]});
    }
    if (tem("coloca", "colocar", "cria", "adiciona", "bota", "pega") && matchesPeca.length >= 1) {
        return executarIntencao({acao: "CRIAR_ATOMO", detalhe: matchesPeca[0][1] || matchesPeca[0][0]}); 
    }
    
    if (tem("limpa quadro", "limpar quadro", "apaga tudo", "recomecar")) return executarIntencao({acao: "LIMPAR_QUADRO"});
    if (tem("o que tem", "ler quadro", "minhas pecas")) return executarIntencao({acao: "LER_QUADRO"});
    if (tem("gira", "girar", "rotacionar") && tem("molecula", "quadro")) return executarIntencao({acao: "GIRAR_MOLECULAS"});
    if (tem("desfazer", "desfaz", "voltar acao")) return executarIntencao({acao: "DESFAZER_ACAO"});
    
    if (tem("abre", "abrir", "mostra", "mostrar") && tem("tutorial", "ajuda", "como jogar")) return executarIntencao({acao: "ABRIR_TUTORIAL"});

    if (tem("confirma", "verifica", "completa", "envia", "terminei") && document.getElementById("modal-classificacao") && window.getComputedStyle(document.getElementById("modal-classificacao")).display !== "none") {
        return executarIntencao({acao: "CONFIRMAR_CLASSIFICACAO"});
    }

    if (tem("cancela", "esquece", "deixa pra la")) return falarAssistente("Cancelado."); 
    
    if (tem("verifica", "checa", "terminei a molecula", "corrigir estrutura", "verificar estrutura", "terminei a estrutura")) return executarIntencao({acao: "VERIFICAR_ESTRUTURA"});
    
    if (tem("desmuta", "liga som", "ativa som", "volta som", "tira mudo", "tirar mudo", "com som", "com audio")) return executarIntencao({acao: "DESMUTAR_SOM"});
    if (tem("muta", "mudo", "tira som", "silencio", "desliga som", "sem som")) return executarIntencao({acao: "MUTAR_SOM"});
    
    if (tem("tira", "bater") && tem("foto", "print")) return executarIntencao({acao: "TIRAR_FOTO"});
    if (tem("dica", "ajuda", "socorro") && tem("desafio", "fase")) return executarIntencao({acao: "DICA_DESAFIO"});
    
    if (tem("quanto tempo", "tempo restante", "relogio")) return executarIntencao({acao: "STATUS_TEMPO"});
    if (tem("quantas vidas", "minhas vidas", "coracoes")) return executarIntencao({acao: "STATUS_VIDAS"});
    if (tem("quantas estrelas", "minhas estrelas")) return executarIntencao({acao: "STATUS_ESTRELAS"});

    if (tem("aumenta", "mais") && tem("zoom")) return executarIntencao({acao: "ZOOM_MAIS"});
    if (tem("diminui", "menos", "tira") && tem("zoom")) return executarIntencao({acao: "ZOOM_MENOS"});
    if (tem("reseta", "zera", "centraliza") && tem("zoom", "visao")) return executarIntencao({acao: "ZOOM_RESET"});

    if (tem("volta", "retorna", "anterior")) return executarIntencao({acao: "VOLTAR"});
    if (tem("configura", "ajuste", "opcao")) return executarIntencao({acao: "ABRIR_CONFIG"});
    if (tem("tabela periodica", "tabela", "elementos")) return executarIntencao({acao: "ABRIR_TABELA"});
    if (tem("conquista", "trofeu")) return executarIntencao({acao: "ABRIR_CONQUISTAS"});
    if (tem("quimichat", "chat", "conversa")) return executarIntencao({acao: "ABRIR_CHAT"});
    if (tem("catalogo", "pokedex")) return executarIntencao({acao: "ABRIR_CATALOGO"});

    if (tem("estrutura", "estruturando") || (tem("inicia", "jogar") && tem("livre", "desafio"))) {
        contextoAssistente = "escolher_modo_estruturando_base";
        return falarAssistente("Você quer jogar o modo livre ou o modo desafio?");
    }

    if (tem("inclusivo", "inclusao", "inclusiva")) {
        contextoAssistente = "escolher_modo_inclusivo"; 
        return falarAssistente("Entrar em qual nível inclusivo? Reconhecer, Relacionar ou Interpretar?");
    }

    if (tem("inicia", "iniciar", "entra", "joga", "bora", "start", "comeca")) return executarIntencao({acao: "IR_MODOS"});

    mostrarMensagemAssistente("🧠 Consultando IA...", true);
    try {
        const res = await fetch(`/api/assistente`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fraseJogador: comandoOriginal }) });
        if(!res.ok) throw new Error("Erro de internet.");
        const intencao = await res.json();
        executarIntencao(intencao, comandoOriginal);
    } catch (e) { 
        falarAssistente(`Eu ouvi: "${comandoOriginal}". Mas não entendi esse comando.`); 
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
        case "FECHAR_TABELA": if(typeof window.fecharTabelaPeriodica === "function") window.fecharTabelaPeriodica(); falarAssistente("Fechado."); break;
        case "FECHAR_CONQUISTAS": if(typeof window.fecharConquistasBtn === "function") window.fecharConquistasBtn(); falarAssistente("Fechado."); break;
        case "FECHAR_CHAT": if(typeof window.fecharChatBtn === "function") window.fecharChatBtn(); if(typeof window.fecharQuimiChat === "function") window.fecharQuimiChat(); falarAssistente("Fechado."); break;
        case "FECHAR_TUDO": document.querySelectorAll('.modal-overlay').forEach(el => el.style.display = "none"); falarAssistente("Fechado."); break;

        case "ABRIR_CONFIG": if(typeof window.toggleMenu === "function") window.toggleMenu(new Event('click')); break;
        case "DESMUTAR_SOM": if(typeof window.toggleMute === "function") window.toggleMute("desmutar"); falarAssistente("Som ativado."); break;
        case "MUTAR_SOM": if(typeof window.toggleMute === "function") window.toggleMute("mutar"); falarAssistente("Som silenciado."); break;
        case "VOLTAR": if(window.history.length > 1) window.history.back(); else window.mudarTela('index.html'); falarAssistente("Voltando."); break;
        case "ABRIR_TABELA": if(typeof window.abrirTabelaPeriodica === "function") window.abrirTabelaPeriodica(); falarAssistente("Tabela aberta."); break;
        case "ABRIR_CONQUISTAS": if(typeof window.abrirConquistas === "function") window.abrirConquistas(); falarAssistente("Conquistas abertas."); break;
        case "ABRIR_CHAT": if(typeof window.abrirQuimiChat === "function") window.abrirQuimiChat(); else if(typeof window.abrirChat === "function") window.abrirChat(); falarAssistente("Chat aberto."); break;
        
        case "ABRIR_TUTORIAL":
        case "IR_TUTORIAL":
            if(typeof window.abrirNovoTutorial === "function") { window.abrirNovoTutorial(); falarAssistente("Abrindo o tutorial."); } 
            else if (typeof window.abrirTutorialManual === "function") { window.abrirTutorialManual(); falarAssistente("Abrindo o tutorial."); } 
            else { falarAssistente("Tutorial não disponível nesta tela."); }
            break;

        case "COMANDO_ADM":
            let inputChat = document.getElementById("quimichat-input") || document.getElementById("chat-input");
            if (inputChat) {
               inputChat.value = detalhe;
               if (typeof processarChat === "function") { processarChat({key: "Enter"}); falarAssistente("Comando administrador executado no chat."); }
               else if (typeof enviarPerguntaQuimiChatInput === "function") { enviarPerguntaQuimiChatInput(); falarAssistente("Comando enviado."); }
            } else { falarAssistente("Abra o chat antes de executar comandos de administrador."); }
            break;

        case "DIMINUIR_MUSICA": if(typeof window.volumeMusica === "function") window.volumeMusica((musica ? musica.volume : 1) - 0.2); falarAssistente("Volume reduzido."); break;
        case "DIMINUIR_EFEITOS": if(typeof window.volumeEfeitos === "function") window.volumeEfeitos((clickAudio ? clickAudio.volume : 1) - 0.2); falarAssistente("Efeitos reduzidos."); break;
        case "DESLIGAR_VISUAIS": if(typeof window.toggleEfeitos === "function") window.toggleEfeitos("desativar"); falarAssistente("Efeitos desativados."); break;
        case "LIGAR_VISUAIS": if(typeof window.toggleEfeitos === "function") window.toggleEfeitos("ativar"); falarAssistente("Efeitos ativados."); break;
        case "TEMA_CLARO": if (document.body.classList.contains("dark") && typeof window.toggleModo === "function") window.toggleModo("claro"); falarAssistente("Modo claro."); break;
        case "TEMA_ESCURO": if (!document.body.classList.contains("dark") && typeof window.toggleModo === "function") window.toggleModo("escuro"); falarAssistente("Modo escuro."); break;

        case "IR_MODOS": if(typeof window.mudarTela==="function") window.mudarTela('modos.html'); falarAssistente("Abrindo os modos."); break;
        
        case "STATUS_VIDAS": if (typeof vidasRestantes !== 'undefined') falarAssistente(`Você tem ${vidasRestantes} corações.`); break;
        case "STATUS_ESTRELAS": if (typeof estrelasGanhas !== 'undefined') falarAssistente(`Você conseguiu ${estrelasGanhas} estrelas.`); break;
        case "STATUS_TEMPO": if (typeof tempoRestante !== "undefined" && typeof intervaloCronometro !== "undefined" && intervaloCronometro !== null) { let m = Math.floor(tempoRestante / 60); let s = tempoRestante % 60; falarAssistente(`Faltam ${m} minuto${m!==1?'s':''} e ${s} segundo${s!==1?'s':''}.`); } break;

        case "LER_TELA": if(typeof lerTelaInteira === "function") lerTelaInteira(); break;
        case "LER_ALTERNATIVAS": if(typeof lerOpcoesGlob === "function") lerOpcoesGlob(); break;
        case "LER_ENUNCIADO": { let seletores =[".hud-pergunta", "#nome-desafio-atual", ".enunciado", ".descricao"]; let achou = false; for (let s of seletores) { let el = document.querySelector(s); if (el && el.innerText.trim() !== "" && !el.innerText.includes("💡")) { falarAssistente("A tarefa é: " + el.innerText); achou = true; break; } } if (!achou) falarAssistente("Não achei um enunciado."); } break;
        case "LER_TUTORIAL":
           let tutText = document.getElementById("tutorial-genshin-texto");
           let modalOverlay = document.getElementById("tutorial-genshin-overlay");
           if (tutText && tutText.innerText.trim().length > 0 && modalOverlay && window.getComputedStyle(modalOverlay).display !== "none") {
               falarAssistente("Lendo o tutorial: " + tutText.innerText);
           } else { falarAssistente("Não há nenhum tutorial aberto no momento. Diga abrir tutorial para eu mostrá-lo."); }
           break;
        case "LER_ATOMOS_DISPONIVEIS":
            let atomosUI = document.querySelectorAll('#lista-atomos .atomo');
            if(atomosUI.length === 0) { falarAssistente("Nenhum átomo disponível nesta tela."); break; }
            let nomesAt = Array.from(atomosUI).map(a => window.obterNomeElemento(a.dataset.sigla).nome);
            falarAssistente(`Neste nível você pode usar ligações simples, duplas e triplas. E os átomos de: ${nomesAt.join(", ")}.`);
            break;
        case "LER_CATALOGO":
            let cDesb = JSON.parse(localStorage.getItem("catalogoDesbloqueado")) ||[];
            if(cDesb.length === 0) { falarAssistente("Você ainda não catalogou nenhuma molécula."); break; }
            if (typeof dbCatalogo !== "undefined") {
                let nomesCat = cDesb.map(id => { let m = dbCatalogo.find(x=>x.id===id); return m ? m.nome : ""; }).filter(Boolean);
                falarAssistente(`Você já catalogou ${cDesb.length} de 20 moléculas no modo livre. São elas: ${nomesCat.join(", ")}.`);
            } else { falarAssistente("Abra a tela do catálogo primeiro para eu poder ler as moléculas."); }
            break;
        case "LER_CONQUISTAS":
            let cqDesb = JSON.parse(localStorage.getItem("conquistasDesbloqueadas")) ||[];
            if (typeof listaDeConquistas !== "undefined") {
                if (cqDesb.length === 0) return falarAssistente("Você ainda não desbloqueou nenhuma conquista. Jogue os desafios para ganhar troféus.");
                falarAssistente(`Você tem ${cqDesb.length} conquistas desbloqueadas de um total de ${listaDeConquistas.length}. Diga abrir conquistas para ver o painel.`);
            } else { falarAssistente("Abra a tela de conquistas primeiro para eu ler os detalhes."); }
            break;

        case "CONSULTAR_TABELA_VOZ":
            let ptsTb = detalhe.split("|"); let nomeEl = ptsTb[0]; let tipoInfo = ptsTb[1];
            let elInfo = window.obterNomeElemento(nomeEl);
            if (typeof elementosTabela !== "undefined") {
                let t = elementosTabela.find(x => normalizarVozNum(x.s) === normalizarVozNum(elInfo.sigla) || normalizarVozNum(x.nome) === normalizarVozNum(elInfo.nome));
                if (t) {
                    if (tipoInfo === "ligacoes") falarAssistente(`O ${t.nome} faz ${t.l} ligações.`);
                    else if (tipoInfo === "massa") falarAssistente(`A massa atômica do ${t.nome} é ${t.m} u.`);
                    else if (tipoInfo === "numero") falarAssistente(`O número atômico do ${t.nome} é ${t.n}.`);
                } else { falarAssistente(`Não achei o ${nomeEl} na tabela.`); }
            } else { falarAssistente("Tabela periódica não encontrada nesta tela."); }
            break;
            
        case "JOGAR_ESTRUTURANDO":
            let d = normalizarVozNum(detalhe);
            d = d.includes("facil") ? "facil" : d.includes("medio") ? "medio" : d.includes("dificil") ? "dificil" : d.includes("impossivel") ? "impossivel" : "livre";
            localStorage.setItem("modoAtual", d === "livre" ? "livre" : d); falarAssistente(`Iniciando o modo ${d}.`);
            if(typeof window.mudarTela === "function") window.mudarTela('estruturando.html'); break;

        case "JOGAR_INCLUSIVO":
            let i = normalizarVozNum(detalhe);
            i = i.includes("reconhecer") ? "reconhecer" : i.includes("relacionar") ? "relacionar" : i.includes("interpretar") ? "interpretar" : "reconhecer";
            localStorage.setItem("modoAtual", `inclusao-${i}`); falarAssistente(`Iniciando inclusivo ${i}.`);
            if(typeof window.mudarTela === "function") window.mudarTela('inclusao.html'); break;

        case "VERIFICAR_ESTRUTURA": if(typeof window.verificarMoleculaDesafio === "function") { falarAssistente("Verificando..."); window.verificarMoleculaDesafio(); } break;
        case "CONFIRMAR_CLASSIFICACAO": if(typeof window.verificarClassificacao === "function") { falarAssistente("Confirmando opções..."); window.verificarClassificacao(); } break;

        case "DICA_DESAFIO": if(typeof window.mostrarDicaDesafio === "function") window.mostrarDicaDesafio(); break;
        case "TIRAR_FOTO": if(typeof window.tirarFoto === "function") window.tirarFoto(); break;
        case "DESFAZER_ACAO": if(typeof window.desfazerAcao === "function") window.desfazerAcao(); if(typeof window.desfazerPintura === "function") window.desfazerPintura(); falarAssistente("Ação desfeita."); break;
        case "GIRAR_MOLECULAS": if(typeof window.girarMoleculas === "function") window.girarMoleculas(); falarAssistente("Quadro rotacionado."); break;
        case "ZOOM_MAIS": if(typeof window.mudarZoom === "function") window.mudarZoom(0.1); if(typeof window.mudarZoomPintura === "function") window.mudarZoomPintura(0.1); falarAssistente("Zoom aumentado."); break;
        case "ZOOM_MENOS": if(typeof window.mudarZoom === "function") window.mudarZoom(-0.1); if(typeof window.mudarZoomPintura === "function") window.mudarZoomPintura(-0.1); falarAssistente("Zoom diminuído."); break;
        case "ZOOM_RESET": if(typeof window.resetarVisao === "function") window.resetarVisao(); falarAssistente("Visão centralizada."); break;
        case "ABRIR_CATALOGO": if(typeof window.abrirCatalogo === "function") window.abrirCatalogo(); falarAssistente("Catálogo aberto."); break;
        
        case "INFO_INCLUSIVA": if(typeof window.mostrarInformacaoQuimica === "function") window.mostrarInformacaoQuimica(); break;
        case "CONCLUIR_PINTURA": if(typeof window.concluirFasePintura === "function") window.concluirFasePintura(); break;
        case "COR_BORRACHA": if(typeof window.mudarCor === "function") window.mudarCor('transparent', true); falarAssistente("Borracha ativada."); break;
        case "COR_VERMELHA": if(typeof window.mudarCor === "function") window.mudarCor('#ef4444', false); falarAssistente("Lápis vermelho."); break;
        case "COR_AZUL": if(typeof window.mudarCor === "function") window.mudarCor('#3b82f6', false); falarAssistente("Lápis azul."); break;
        case "COR_AMARELA": if(typeof window.mudarCor === "function") window.mudarCor('#eab308', false); falarAssistente("Lápis amarelo."); break;
        case "COR_PRETA": if(typeof window.mudarCor === "function") window.mudarCor('#333333', false); falarAssistente("Lápis preto."); break;
        case "COR_VERDE": if(typeof window.mudarCor === "function") window.mudarCor('#22c55e', false); falarAssistente("Lápis verde."); break;
        case "COR_CINZA": if(typeof window.mudarCor === "function") window.mudarCor('#9ca3af', false); falarAssistente("Lápis cinza."); break;

        case "CRIAR_ATOMO": if(typeof window.adicionarAtomoVoz === "function") window.adicionarAtomoVoz(detalhe); break;
        case "CRIAR_LIGACAO": if(typeof window.adicionarLigacaoVoz === "function") window.adicionarLigacaoVoz(detalhe); break;
        
        case "ADICIONAR_LIGACAO_ATOMO":
            let ptsDir = detalhe.split("|");
            if(ptsDir.length >= 2 && typeof window.adicionarLigacaoEmAtomoVoz === "function") { window.adicionarLigacaoEmAtomoVoz(ptsDir[0], ptsDir[1], ptsDir[2] || "direita"); }
            break;

        case "LIGAR_ATOMOS":
            let pL = detalhe.split("|");
            if(pL.length >= 2 && typeof window.ligarAtomosVoz === "function") window.ligarAtomosVoz(pL[0], pL[1], pL[2] || "simples", pL[3] || ""); break;
        
        case "COMPLETAR_VALENCIA": if(typeof window.acaoPecaVoz === "function") window.acaoPecaVoz(detalhe, "completar"); break;
        case "DESVINCULAR_PECA": if(typeof window.acaoPecaVoz === "function") window.acaoPecaVoz(detalhe, "desvincular"); break;
        case "EXCLUIR_PECA": if(typeof window.acaoPecaVoz === "function") window.acaoPecaVoz(detalhe, "excluir"); break;
        case "LIMPAR_QUADRO": if(typeof window.limparQuadro === "function") { window.limparQuadro(); falarAssistente("Quadro limpo."); } break;
        case "LER_QUADRO": if(typeof window.lerQuadroVoz === "function") window.lerQuadroVoz(); break;
        
        default: falarAssistente(`Eu ouvi: "${comandoFalado}". Mas não tem essa opção.`); break;
    }
}

// ==========================================
// 7. FÍSICA E AUTO-CRIAÇÃO AVANÇADA
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
    window.atualizarTagsDeVoz(); 
    let q = document.getElementById("quadro-inner"); if(!q) return null;
    let p = normalizarVozNum(nome); if(!p.match(/\d+/)) p += " 1"; 
    let ats = Array.from(q.querySelectorAll('.peca-draggable.atomo'));
    return ats.find(a => normalizarVozNum(a.dataset.idVoz || "") === p);
}

function checarEspacoLivre(atomo, custoLigs) {
    let max = parseInt(atomo.dataset.valencia || 0);
    let uso = parseInt(atomo.dataset.valUso || 0);
    return (max - uso) >= custoLigs;
}

window.adicionarAtomoVoz = function(nome, silencioso = false) {
    if (window.checagemBloqueioTela()) { if(!silencioso) falarAssistente("Feche a janela primeiro para mexer no quadro."); return false; }
    let q = document.getElementById("quadro-inner"); let l = document.getElementById("lista-atomos");
    if(!q || !l) { if(!silencioso) falarAssistente("Você precisa estar no modo Estruturando."); return false; }
    let i = window.obterNomeElemento(nome);
    let base = Array.from(l.querySelectorAll('.atomo')).find(a => a.dataset.sigla.toLowerCase() === i.sigla.toLowerCase());
    if(!base) { if(!silencioso) falarAssistente(`O átomo de ${i.nome} não existe neste nível.`); return false; }
    
    let novo = base.cloneNode(true); novo.classList.add("no-quadro"); novo.dataset.id = Date.now() + "_" + Math.floor(Math.random() * 1000); novo.dataset.noQuadro = "true"; novo.style.position = "absolute"; novo.style.zIndex = 10;
    let r = q.getBoundingClientRect(); let off = Math.floor(Math.random() * 40) - 20;
    novo.style.left = (r.width/2 - 20 + off) + "px"; novo.style.top = (r.height/2 - 20 + off) + "px";
    
    q.appendChild(novo); window.atualizarTagsDeVoz();
    if(typeof window.verificarLigacoesQuimicas === "function") window.verificarLigacoesQuimicas();
    if(typeof window.atualizarContadores === "function") window.atualizarContadores();
    if(!silencioso) falarAssistente(`Adicionei o ${novo.dataset.idVoz} no quadro.`);
    return true;
}

window.adicionarLigacaoVoz = function(tipo) {
    if (window.checagemBloqueioTela()) return falarAssistente("Feche a janela atual primeiro.");
    let q = document.getElementById("quadro-inner");
    if(!q) return falarAssistente("Entre no modo Estruturando primeiro.");
    let cl = "lig-simples"; let vl = 1; let ht = '<div class="linha"></div>';
    if(tipo.includes("dupla")) { cl = "lig-dupla"; vl = 2; ht = '<div class="linha"></div><div class="linha"></div>'; }
    if(tipo.includes("tripla")) { cl = "lig-tripla"; vl = 3; ht = '<div class="linha"></div><div class="linha"></div><div class="linha"></div>'; }
    
    let lig = document.createElement("div"); lig.className = `peca-draggable ligacao ${cl} no-quadro`; lig.dataset.tipo = "ligacao"; lig.dataset.val = vl; lig.dataset.id = Date.now() + "_" + Math.floor(Math.random() * 1000); lig.dataset.noQuadro = "true"; lig.style.position = "absolute"; lig.style.zIndex = 9; lig.innerHTML = ht;
    
    let r = q.getBoundingClientRect(); let off = Math.floor(Math.random() * 40) - 20;
    lig.style.left = (r.width/2 - 20 + off) + "px"; lig.style.top = (r.height/2 + off) + "px";
    
    q.appendChild(lig);
    if(typeof window.verificarLigacoesQuimicas === "function") window.verificarLigacoesQuimicas();
    falarAssistente(`Adicionei uma ligação ${tipo} solta no quadro.`);
}

function obterPortaLivre(atomo, pref) {
    let pts = { "direita": "occR", "esquerda": "occL", "cima": "occT", "baixo": "occB" };
    if (!atomo.dataset[pts[pref]]) return pref; 
    for (let d in pts) { if (!atomo.dataset[pts[d]]) return d; } 
    return null; 
}

function getSnapPointsLocal(peca) {
    let isV = peca.classList.contains("lig-vertical"); let type = peca.dataset.tipo;
    let x = parseFloat(peca.style.left) || 0, y = parseFloat(peca.style.top) || 0; let pts =[];
    if (type === "atomo") {
        pts.push({ x: x+40, y: y+20, dir: 'H', id: 'R' }); pts.push({ x: x+0,  y: y+20, dir: 'H', id: 'L' });
        pts.push({ x: x+20, y: y+0,  dir: 'V', id: 'T' }); pts.push({ x: x+20, y: y+40, dir: 'V', id: 'B' });
    } else {
        if (!isV) { pts.push({ x: x+40, y: y+10, dir: 'H', id: 'R' }); pts.push({ x: x+0,  y: y+10, dir: 'H', id: 'L' }); } 
        else { pts.push({ x: x+10, y: y+40, dir: 'V', id: 'B' }); pts.push({ x: x+10, y: y+0,  dir: 'V', id: 'T' }); }
    }
    return pts;
}

function getPontaLivreDeLigacao(pA) {
    let allBonds = Array.from(document.querySelectorAll('.ligacao.no-quadro'));
    let allAtoms = Array.from(document.querySelectorAll('.atomo.no-quadro'));
    let ptsA = getSnapPointsLocal(pA); 
    for (let bond of allBonds) {
        let ptsBond = getSnapPointsLocal(bond);
        let ptBondTouchingA = null; let ptBondOther = null;
        for (let pb of ptsBond) {
            if (ptsA.some(pa => Math.hypot(pa.x - pb.x, pa.y - pb.y) < 15)) ptBondTouchingA = pb;
            else ptBondOther = pb;
        }
        if (ptBondTouchingA && ptBondOther) {
            let touchesOtherAtom = allAtoms.some(otherA => {
                if (otherA === pA) return false;
                let ptsOther = getSnapPointsLocal(otherA);
                return ptsOther.some(po => Math.hypot(po.x - ptBondOther.x, po.y - ptBondOther.y) < 15);
            });
            if (!touchesOtherAtom) return { bond: bond, freePt: ptBondOther };
        }
    }
    return null;
}

window.adicionarLigacaoEmAtomoVoz = function(nomeAtomo, tipo, dirDesejada) {
    if (window.checagemBloqueioTela()) return falarAssistente("Feche a janela atual primeiro.");
    let pA = window.encontrarPecaVoz(nomeAtomo);
    if(!pA) return falarAssistente(`Não encontrei o ${nomeAtomo} no quadro.`);

    let vl = tipo.includes("tripla") ? 3 : tipo.includes("dupla") ? 2 : 1;
    if (!checarEspacoLivre(pA, vl)) return falarAssistente(`Não é possível. O ${pA.dataset.idVoz} já está com as ligações lotadas.`);

    let direcao = obterPortaLivre(pA, dirDesejada);
    if (!direcao) return falarAssistente(`O ${pA.dataset.idVoz} está com todos os lados ocupados!`);

    let cl = "lig-simples"; let ht = '<div class="linha"></div>';
    if(vl===2) { cl = "lig-dupla"; ht = '<div class="linha"></div><div class="linha"></div>'; }
    if(vl===3) { cl = "lig-tripla"; ht = '<div class="linha"></div><div class="linha"></div><div class="linha"></div>'; }

    let lig = document.createElement("div"); 
    lig.className = `peca-draggable ligacao ${cl} no-quadro`; 
    lig.dataset.tipo = "ligacao"; lig.dataset.val = vl; 
    lig.dataset.id = Date.now() + "_" + Math.floor(Math.random() * 1000); 
    lig.dataset.noQuadro = "true"; lig.style.position = "absolute"; lig.style.zIndex = 9; lig.innerHTML = ht;

    let xA = parseFloat(pA.style.left) || 0; let yA = parseFloat(pA.style.top) || 0;

    if (direcao === "esquerda") { lig.style.left = (xA - 40) + "px"; lig.style.top = (yA + 10) + "px"; } 
    else if (direcao === "cima") { lig.classList.add("lig-vertical"); lig.style.left = (xA + 10) + "px"; lig.style.top = (yA - 40) + "px"; } 
    else if (direcao === "baixo") { lig.classList.add("lig-vertical"); lig.style.left = (xA + 10) + "px"; lig.style.top = (yA + 40) + "px"; } 
    else { lig.style.left = (xA + 40) + "px"; lig.style.top = (yA + 10) + "px"; }

    document.getElementById("quadro-inner").appendChild(lig);
    if(typeof window.verificarLigacoesQuimicas === "function") window.verificarLigacoesQuimicas();
    if(typeof window.atualizarContadores === "function") window.atualizarContadores();
    
    let aviso = direcao !== dirDesejada ? ` A ${dirDesejada} estava ocupada, coloquei na ${direcao}.` : "";
    falarAssistente(`Pronto. Coloquei uma ligação ${tipo} na ${direcao} do ${pA.dataset.idVoz}.${aviso}`);
}

window.ligarAtomosVoz = function(nA, nB, tipo, dirDesejada) {
    if (window.checagemBloqueioTela()) return falarAssistente("Feche a janela atual primeiro.");
    
    let pA = window.encontrarPecaVoz(nA);
    let pB = window.encontrarPecaVoz(nB);

    let hasNumA = nA.match(/\d+/) !== null;
    let hasNumB = nB.match(/\d+/) !== null;
    
    if ( (pB && !pA) || (!hasNumA && hasNumB) ) {
        let tempP = pA; pA = pB; pB = tempP;
        let tempN = nA; nA = nB; nB = tempN;
    }

    if (!pA) { 
        let nomeA = window.obterNomeElemento(nA).nome;
        if (!window.adicionarAtomoVoz(nomeA, true)) {
            falarAssistente(`Não posso ligar porque o átomo de ${nomeA} não existe neste nível.`);
            return;
        }
        let ats = Array.from(document.querySelectorAll('#quadro-inner .peca-draggable.atomo'));
        pA = ats.filter(a => window.obterNomeElemento(a.dataset.sigla).nome.toLowerCase() === nomeA.toLowerCase()).pop(); 
    }
    
    if (!pB || pA === pB) { 
        let nomeB = window.obterNomeElemento(nB).nome;
        if (!window.adicionarAtomoVoz(nomeB, true)) {
            falarAssistente(`Não posso ligar porque o átomo de ${nomeB} não existe neste nível.`);
            return;
        }
        let ats = Array.from(document.querySelectorAll('#quadro-inner .peca-draggable.atomo'));
        pB = ats.filter(a => window.obterNomeElemento(a.dataset.sigla).nome.toLowerCase() === nomeB.toLowerCase()).pop(); 
    }

    if(!pA || !pB || pA === pB) return falarAssistente("Ocorreu um erro e não consegui montar a molécula.");

    let vl = tipo.includes("tripla") ? 3 : tipo.includes("dupla") ? 2 : 1;
    if (!checarEspacoLivre(pA, vl)) return falarAssistente(`O ${pA.dataset.idVoz} não tem mais ligações livres.`);
    if (!checarEspacoLivre(pB, vl)) return falarAssistente(`O ${pB.dataset.idVoz} não tem mais ligações livres.`);

    let pontaExistente = getPontaLivreDeLigacao(pA);

    if (pontaExistente && !dirDesejada) { 
        let cl = "lig-simples"; let ht = '<div class="linha"></div>';
        if(vl===2) { cl = "lig-dupla"; ht = '<div class="linha"></div><div class="linha"></div>'; }
        if(vl===3) { cl = "lig-tripla"; ht = '<div class="linha"></div><div class="linha"></div><div class="linha"></div>'; }
        
        pontaExistente.bond.className = `peca-draggable ligacao ${cl} no-quadro`;
        if(pontaExistente.bond.style.transform.includes("rotate") || pontaExistente.bond.classList.contains("lig-vertical")) pontaExistente.bond.classList.add("lig-vertical");
        pontaExistente.bond.dataset.val = vl;
        pontaExistente.bond.innerHTML = ht;

        let targetX = pontaExistente.freePt.x; let targetY = pontaExistente.freePt.y;
        let isBondVert = pontaExistente.bond.classList.contains("lig-vertical");
        let bLeft, bTop;
        if (!isBondVert) { if (pontaExistente.freePt.id === 'R') { bLeft = targetX; bTop = targetY - 20; } else { bLeft = targetX - 40; bTop = targetY - 20; } } 
        else { if (pontaExistente.freePt.id === 'B') { bLeft = targetX - 20; bTop = targetY; } else { bLeft = targetX - 20; bTop = targetY - 40; } }

        moverPecaEGrupoVoz(pB, bLeft, bTop);
        falarAssistente(`Liguei o ${pA.dataset.idVoz} ao ${pB.dataset.idVoz} usando a ligação já existente.`);
    } else {
        let dirA = obterPortaLivre(pA, dirDesejada || "direita");
        if(!dirA) return falarAssistente(`O ${pA.dataset.idVoz} está com todos os lados ocupados.`);

        let cl = "lig-simples"; let ht = '<div class="linha"></div>';
        if(vl===2) { cl = "lig-dupla"; ht = '<div class="linha"></div><div class="linha"></div>'; }
        if(vl===3) { cl = "lig-tripla"; ht = '<div class="linha"></div><div class="linha"></div><div class="linha"></div>'; }
        
        let lig = document.createElement("div"); lig.className = `peca-draggable ligacao ${cl} no-quadro`; lig.dataset.tipo = "ligacao"; lig.dataset.val = vl; lig.dataset.id = Date.now() + "_" + Math.floor(Math.random() * 1000); lig.dataset.noQuadro = "true"; lig.style.position = "absolute"; lig.style.zIndex = 9; lig.innerHTML = ht;
        
        let xA = parseFloat(pA.style.left) || 0; let yA = parseFloat(pA.style.top) || 0;
        let bondX, bondY;

        if (dirA === "esquerda") { lig.style.left = (xA - 40) + "px"; lig.style.top = (yA + 10) + "px"; bondX = xA - 40; bondY = yA + 10; } 
        else if (dirA === "cima") { lig.classList.add("lig-vertical"); lig.style.left = (xA + 10) + "px"; lig.style.top = (yA - 40) + "px"; bondX = xA + 10; bondY = yA - 40; } 
        else if (dirA === "baixo") { lig.classList.add("lig-vertical"); lig.style.left = (xA + 10) + "px"; lig.style.top = (yA + 40) + "px"; bondX = xA + 10; bondY = yA + 40; } 
        else { lig.style.left = (xA + 40) + "px"; lig.style.top = (yA + 10) + "px"; bondX = xA + 40; bondY = yA + 10; }

        document.getElementById("quadro-inner").appendChild(lig);

        let connectX, connectY;
        if(dirA === "direita") { connectX = bondX + 40; connectY = bondY - 10; }
        else if(dirA === "esquerda") { connectX = bondX - 40; connectY = bondY - 10; }
        else if(dirA === "cima") { connectX = bondX - 10; connectY = bondY - 40; }
        else if(dirA === "baixo") { connectX = bondX - 10; connectY = bondY + 40; }

        moverPecaEGrupoVoz(pB, connectX, connectY);
        falarAssistente(`Liguei o ${pB.dataset.idVoz} na ${dirA} do ${pA.dataset.idVoz}.`);
    }

    if(typeof window.verificarLigacoesQuimicas === "function") window.verificarLigacoesQuimicas();
    if(typeof window.atualizarContadores === "function") window.atualizarContadores();
}

function moverPecaEGrupoVoz(peca, newLeft, newTop) {
    let curX = parseFloat(peca.style.left) || 0; let curY = parseFloat(peca.style.top) || 0;
    let diffX = newLeft - curX; let diffY = newTop - curY;
    let gId = peca.dataset.grupo;
    let pGroup = gId ? Array.from(document.querySelectorAll(`[data-grupo="${gId}"]`)) : [peca];
    pGroup.forEach(g => { g.style.left = (parseFloat(g.style.left||0) + diffX) + "px"; g.style.top = (parseFloat(g.style.top||0) + diffY) + "px"; });
}

window.acaoPecaVoz = function(nome, acao) {
    if (window.checagemBloqueioTela()) return falarAssistente("Feche a janela atual primeiro.");
    let peca = window.encontrarPecaVoz(nome);
    if(!peca) return falarAssistente(`Não achei o ${nome}.`);
    
    window.pecaAlvoMenu = peca; 
    if (acao === "completar") { 
        if(typeof window.cmCompletar === "function") { window.cmCompletar(); if(typeof window.atualizarContadores === "function") window.atualizarContadores(); }
        falarAssistente(`Valência do ${peca.dataset.idVoz} completada.`); 
    } 
    else if (acao === "excluir") { 
        let n = peca.dataset.idVoz; 
        if(typeof window.cmExcluir === "function") { window.cmExcluir(); if(typeof window.atualizarContadores === "function") window.atualizarContadores(); }
        falarAssistente(`O ${n} foi excluído.`); 
    }
    else if (acao === "desvincular") { 
        if(typeof window.cmDesvincular === "function") { window.cmDesvincular(); if(typeof window.atualizarContadores === "function") window.atualizarContadores(); }
        falarAssistente(`O ${peca.dataset.idVoz} foi desvinculado.`); 
    }
    window.pecaAlvoMenu = null; 
}

window.lerQuadroVoz = function() {
    let q = document.getElementById("quadro-inner");
    if(!q) return falarAssistente("Não estamos no modo de construção.");
    let ats = Array.from(q.querySelectorAll('.peca-draggable.atomo'));
    if(ats.length === 0) return falarAssistente("O quadro branco está vazio.");
    let l = `Você tem ${ats.length} átomos. `;
    ats.forEach(a => {
        let hid = parseInt(a.dataset.hExtras || 0); let st = "";
        if (a.classList.contains("atomo-erro")) st = "Atenção: Valência excedida!";
        else if (a.classList.contains("atomo-sucesso")) st = "Valência completa e correta.";
        else st = "Valência incompleta.";
        let th = hid > 0 ? `Completado com ${hid} hidrogênios.` : "";
        let tl = a.dataset.grupo ? "Conectado." : "Solto no quadro.";
        l += `${a.dataset.idVoz}: ${tl} ${th} ${st} `;
    });
    falarAssistente(l);
}