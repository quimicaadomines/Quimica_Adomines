// ==========================================
// ASSISTENTE DE VOZ ADÔMINES (SISTEMA DE CONTEXTO E DICIONÁRIO ATUALIZADOS)
// ==========================================
let assistenteAtivo = true; 
let assistenteReconhecimento = null;
let assistenteSintese = window.speechSynthesis;
let vozAssistente = null;
let contextoAssistente = null; 

let estouFalando = false; 
let espacoPressionado = false;
let tempoPressaoEspaco = 0;
let anuncioBoasVindasFeito = false;
window.falaAtual = null;

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
        
        if(typeof mostrarMensagemGlob === "function" && comandoOriginal.length > 1) {
            mostrarMensagemGlob('🎤 Eu ouvi: "' + comandoOriginal + '"');
        }

        if(!assistenteAtivo || estouFalando || comandoOriginal.length < 2) return;
        
        processarComandoVoz(comandoOriginal);
    };

    assistenteReconhecimento.onerror = function(event) {
        if(event.error === 'not-allowed') {
            if(typeof mostrarMensagemGlob === "function") mostrarMensagemGlob("Permissão do microfone negada.");
            assistenteAtivo = false; 
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
// 2. FUNÇÃO DE FALA
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
    
    window.falaAtual.onend = function() { 
        estouFalando = false; 
        if(typeof ocultarMensagemGlob === "function") ocultarMensagemGlob();
    };
    window.falaAtual.onerror = function() { 
        estouFalando = false; 
        if(typeof ocultarMensagemGlob === "function") ocultarMensagemGlob();
    };

    if(typeof mostrarMensagemGlob === "function") mostrarMensagemGlob('🤖 Adômines: "' + texto + '"');
    assistenteSintese.speak(window.falaAtual);
}

window.toggleAssistenteVoz = function(silencioso = false) {
    if(!silencioso && typeof tocarSomClick === "function") tocarSomClick();
    
    if (assistenteAtivo) {
        assistenteAtivo = false; contextoAssistente = null; 
        try { assistenteReconhecimento.stop(); } catch(e){} 
        let btn = document.getElementById("btnAssistente"); if(btn) btn.classList.remove("mic-ouvindo");
        if(!silencioso) falarAssistente("Assistente desativada.");
    } else {
        assistenteAtivo = true; contextoAssistente = null; 
        if(!silencioso) falarAssistente("Assistente ativada. Segure a tecla Espaço para falar.");
    }
}

// ==========================================
// 3. CONTROLE DA BARRA DE ESPAÇO E BOAS-VINDAS
// ==========================================
function dispararBoasVindas() {
    if (!sessionStorage.getItem("boasVindasLidas")) {
        sessionStorage.setItem("boasVindasLidas", "true");
        if (assistenteSintese) assistenteSintese.resume();
        if(typeof musica !== 'undefined' && musica && musica.paused && !mutado) musica.play().catch(()=>{});
        falarAssistente("Olá! O jogo possui uma assistente de voz. Caso queira usar, pressione e segure a tecla espaço e fale. Quando soltar, eu processo o comando. Para ativar a assistente, dê um clique rápido na tecla espaço. Para desativar, faça o mesmo.");
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
            }
        }
    }
});

// ==========================================
// 4. OLHO BIÔNICO
// ==========================================
const observadorAutomatico = new MutationObserver(() => {
    if (!assistenteAtivo || estouFalando) return;

    let modalTut = document.getElementById("tutorial-genshin-overlay");
    if (modalTut && window.getComputedStyle(modalTut).display !== "none" && !modalTut.dataset.lido) {
        modalTut.dataset.lido = "true";
        let txt = document.getElementById("tutorial-genshin-texto") ? document.getElementById("tutorial-genshin-texto").innerText : "";
        falarAssistente("Tutorial na tela. " + txt + " Diga prosseguir ou concluir.");
        return;
    }

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
    
    setTimeout(() => {
        if (!assistenteAtivo) return;
        let modalTut = document.getElementById("tutorial-genshin-overlay");
        if (modalTut && window.getComputedStyle(modalTut).display !== "none") {
            modalTut.dataset.lido = "true";
            let txt = document.getElementById("tutorial-genshin-texto") ? document.getElementById("tutorial-genshin-texto").innerText : "";
            return falarAssistente("Tutorial na tela. " + txt + " Diga prosseguir ou concluir.");
        }
        let enunciado = document.querySelector(".hud-pergunta") || document.getElementById("texto-enunciado");
        if (enunciado && enunciado.innerText.trim().length > 5) {
            enunciado.dataset.ultimoLido = enunciado.innerText;
            falarAssistente("A tarefa é: " + enunciado.innerText.replace("💡", ""));
        }
    }, 1200);
});

// ==========================================
// 5. CÉREBRO LOCAL 
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
            if (tem("desafio")) { 
                contextoAssistente = "escolher_submodo_estruturando"; 
                return falarAssistente("O modo desafio contém os seguintes níveis: fácil, médio, difícil e impossível. Qual você quer jogar?"); 
            }
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

    let modalTut = document.getElementById("tutorial-genshin-overlay");
    if (modalTut && window.getComputedStyle(modalTut).display !== "none") {
        if (tem("prossegue", "prosseguir", "avanca", "avancar", "proximo", "continua", "continuar", "passa", "passar", "seguir")) {
            if(typeof window.avancarTutorialGenshin === "function") { window.avancarTutorialGenshin(); return falarAssistente("Avançando."); }
        }
        if (tem("conclui", "concluir", "fecha", "fechar", "termina", "terminar", "pronto", "entendi", "pular", "sair")) {
            if(typeof window.fecharTutorialGenshin === "function") { window.fecharTutorialGenshin(); return falarAssistente("Tutorial concluído. Boa sorte no jogo!"); }
        }
    }

    let regexPeca = /(carbono|oxigenio|hidrogenio|nitrogenio|enxofre|fosforo|cloro|fluor|bromo|iodo)\s*(\d+)?/gi;
    let matchesPeca =[...limpo.matchAll(regexPeca)]; 

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

    let ativadorRegex = /^(adomines|a dominis|a domines|adominis|as dominis|aldomines|o dominis|ad homens|aos dominis|adomini|adomin|domines|dominis)\b/i;
    if (ativadorRegex.test(limpo)) {
        let pergunta = comandoOriginal.replace(/^(Ad[ôo]mines|A dominis|A domines|Adominis|As dominis|Aldomines|O dominis|Ad homens|Aos dominis|Adomini|Adomin|Domines|Dominis)\s*/i, "").trim(); 
        if (pergunta.length > 2) {
            if(typeof window.abrirQuimiChat === "function") window.abrirQuimiChat(); 
            if(typeof window.enviarPerguntaQuimiChat === "function") window.enviarPerguntaQuimiChat(pergunta, true); 
        } else falarAssistente("Pode fazer sua pergunta de química.");
        return;
    }

    if (tem("cancela", "cancelar", "esquece", "esquecer", "deixa pra la")) return falarAssistente("Cancelado."); 
    if (tem("verifica", "verificar", "checa", "checar", "terminei a molecula", "terminei a estrutura", "veja se ta certo", "corrigir estrutura")) return executarIntencao({acao: "VERIFICAR_ESTRUTURA"});
    if (tem("quanto tempo", "tempo restante", "tempo falta", "relogio", "cronometro")) return executarIntencao({acao: "STATUS_TEMPO"});
    if (tem("quantas vidas", "minhas vidas", "coracoes", "vida tenho", "vidas restam")) return executarIntencao({acao: "STATUS_VIDAS"});
    if (tem("quantas estrelas", "minhas estrelas", "estrelas tenho")) return executarIntencao({acao: "STATUS_ESTRELAS"});

    if (tem("desmuta", "desmutar", "com som", "liga som", "ativa som", "volta som", "tira mudo", "tirar mudo", "desativar mudo")) return executarIntencao({acao: "DESMUTAR_SOM"});
    if (tem("muta", "mutar", "mudo", "tira som", "tirar som", "silencio", "sem som", "desliga som", "desligar som")) return executarIntencao({acao: "MUTAR_SOM"});
    
    if (tem("abaixa", "abaixar", "diminui", "diminuir", "reduz", "reduzir", "menos") && tem("musica", "som", "volume")) return executarIntencao({acao: "DIMINUIR_MUSICA"});
    if (tem("abaixa", "abaixar", "diminui", "diminuir", "reduz", "reduzir", "menos") && tem("efeito", "efeitos")) return executarIntencao({acao: "DIMINUIR_EFEITOS"});
    if (tem("desliga", "desligar", "tira", "tirar", "desativa", "desativar") && tem("efeito", "efeitos", "visuais", "visual")) return executarIntencao({acao: "DESLIGAR_VISUAIS"});
    if (tem("liga", "ligar", "coloca", "colocar", "ativa", "ativar") && tem("efeito", "efeitos", "visuais", "visual")) return executarIntencao({acao: "LIGAR_VISUAIS"});
    if (tem("modo claro", "tema claro", "dia", "claro")) return executarIntencao({acao: "TEMA_CLARO"});
    if (tem("modo escuro", "tema escuro", "noturno", "escuro")) return executarIntencao({acao: "TEMA_ESCURO"});
    
    if (tem("volta", "voltar", "retorna", "retornar", "anterior")) return executarIntencao({acao: "VOLTAR"});
    if (tem("desliga", "desligar", "para", "parar", "desativa", "desativar") && tem("assistente", "voz")) return executarIntencao({acao: "DESLIGAR_ASSISTENTE"});
    
    if (tem("configura", "configuracoes", "configurar", "ajuste", "ajustes", "opcao", "opcoes")) return executarIntencao({acao: "ABRIR_CONFIG"});
    if (tem("tabela periodica", "tabela", "elementos")) return executarIntencao({acao: "ABRIR_TABELA"});
    if (tem("conquista", "conquistas", "trofeu", "medalha")) return executarIntencao({acao: "ABRIR_CONQUISTAS"});
    if (tem("quimichat", "chat", "conversa", "painel adm", "administrador")) return executarIntencao({acao: "ABRIR_CHAT"});
    
    if (tem("ler", "leia") && tem("tela", "tudo")) return executarIntencao({acao: "LER_TELA"});
    if (tem("ler", "leia") && tem("enunciado", "pergunta", "questao", "tarefa", "fazer")) return executarIntencao({acao: "LER_ENUNCIADO"});
    if (tem("ler", "leia") && tem("alternativa", "alternativas", "item", "opcoes", "resposta")) return executarIntencao({acao: "LER_ALTERNATIVAS"});

    if (tem("estrutura", "estruturando") || (tem("inicia", "iniciar", "jogar") && tem("livre", "desafio"))) {
        contextoAssistente = "escolher_modo_estruturando_base";
        return falarAssistente("Você quer jogar o modo livre ou o modo desafio?");
    }

    if (tem("inclusivo", "inclusao", "inclusiva")) {
        contextoAssistente = "escolher_modo_inclusivo"; 
        return falarAssistente("Entrar em qual nível inclusivo? Reconhecer, Relacionar ou Interpretar?");
    }

    if (tem("inicia", "iniciar", "entra", "entrar", "joga", "jogar", "bora", "vamo", "start", "comeca", "comecar", "partiu")) {
        return executarIntencao({acao: "IR_MODOS"});
    }

    if(typeof mostrarMensagemGlob === "function") mostrarMensagemGlob("🧠 Consultando IA...");
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
        case "FECHAR_TABELA": if(typeof window.fecharTabelaPeriodica === "function") window.fecharTabelaPeriodica(); falarAssistente("Fechado."); break;
        case "FECHAR_CONQUISTAS": if(typeof window.fecharConquistasBtn === "function") window.fecharConquistasBtn(); falarAssistente("Fechado."); break;
        case "FECHAR_CHAT": if(typeof window.fecharChatBtn === "function") window.fecharChatBtn(); if(typeof window.fecharQuimiChat === "function") window.fecharQuimiChat(); falarAssistente("Fechado."); break;
        case "FECHAR_TUDO": document.querySelectorAll('.modal-overlay').forEach(el => el.style.display = "none"); falarAssistente("Fechado."); break;

        case "ABRIR_CONFIG": if(typeof window.toggleMenu === "function") window.toggleMenu(new Event('click')); break;
        case "DESMUTAR_SOM": if(typeof window.toggleMute === "function") window.toggleMute("desmutar"); falarAssistente("Som ativado."); break;
        case "MUTAR_SOM": if(typeof window.toggleMute === "function") window.toggleMute("mutar"); falarAssistente("Som silenciado."); break;
        case "VOLTAR": if(window.history.length > 1) window.history.back(); else window.mudarTela('index.html'); falarAssistente("Voltando."); break;
        case "ABRIR_TABELA": if(typeof window.abrirTabelaPeriodica === "function") window.abrirTabelaPeriodica(); break;
        case "ABRIR_CONQUISTAS": if(typeof window.abrirConquistas === "function") window.abrirConquistas(); break;
        case "ABRIR_CHAT": if(typeof window.abrirQuimiChat === "function") window.abrirQuimiChat(); else if(typeof window.abrirChat === "function") window.abrirChat(); break;
        
        case "DIMINUIR_MUSICA": if(typeof window.volumeMusica === "function") window.volumeMusica((musica ? musica.volume : 1) - 0.2); falarAssistente("Volume reduzido."); break;
        case "DIMINUIR_EFEITOS": if(typeof window.volumeEfeitos === "function") window.volumeEfeitos((clickAudio ? clickAudio.volume : 1) - 0.2); falarAssistente("Efeitos reduzidos."); break;
        case "DESLIGAR_VISUAIS": if(typeof window.toggleEfeitos === "function") window.toggleEfeitos("desativar"); falarAssistente("Efeitos desativados."); break;
        case "LIGAR_VISUAIS": if(typeof window.toggleEfeitos === "function") window.toggleEfeitos("ativar"); falarAssistente("Efeitos ativados."); break;
        case "TEMA_CLARO": if (document.body.classList.contains("dark") && typeof window.toggleModo === "function") window.toggleModo("claro"); falarAssistente("Modo claro."); break;
        case "TEMA_ESCURO": if (!document.body.classList.contains("dark") && typeof window.toggleModo === "function") window.toggleModo("escuro"); falarAssistente("Modo escuro."); break;

        case "IR_MODOS": 
            if (!window.location.pathname.includes('modos') && !window.location.pathname.includes('estruturando') && !window.location.pathname.includes('inclusao')) { 
                falarAssistente("Abrindo os modos de jogo."); if(typeof window.mudarTela==="function") window.mudarTela('modos.html'); 
            } else falarAssistente("Você já está na área de modos."); break;
        case "IR_TUTORIAL": falarAssistente("Indo para o tutorial."); if(typeof window.mudarTela==="function") window.mudarTela('tutorial.html'); break;
        
        case "STATUS_VIDAS": if (typeof vidasRestantes !== 'undefined') falarAssistente(`Você tem ${vidasRestantes} corações.`); break;
        case "STATUS_ESTRELAS": if (typeof estrelasGanhas !== 'undefined') falarAssistente(`Você já conseguiu ${estrelasGanhas} estrelas.`); break;
        case "STATUS_TEMPO": if (typeof tempoRestante !== "undefined" && typeof intervaloCronometro !== "undefined" && intervaloCronometro !== null) { let m = Math.floor(tempoRestante / 60); let s = tempoRestante % 60; falarAssistente(`Faltam ${m} minuto${m!==1?'s':''} e ${s} segundo${s!==1?'s':''}.`); } break;

        case "LER_TELA": lerTelaInteira(); break;
        case "LER_ENUNCIADO": { let seletores =[".hud-pergunta", "#nome-desafio-atual", ".enunciado", ".descricao", ".comando-fase"]; let achou = false; for (let s of seletores) { let el = document.querySelector(s); if (el && el.innerText.trim() !== "" && !el.innerText.includes("💡")) { falarAssistente("A tarefa é: " + el.innerText); achou = true; break; } } if (!achou) falarAssistente("Não achei um enunciado."); } break;
        case "LER_TUTORIAL": { let els = document.querySelectorAll(".tutorial-conteudo, #tutorial, .tutorial, .texto-tutorial, #tutorial-genshin-texto"); let txt = ""; els.forEach(e => { if (e.offsetParent !== null) txt += e.innerText + ". "; }); if(txt.length > 0) falarAssistente(txt); else falarAssistente("Não achei tutorial."); } break;
            
        case "JOGAR_ESTRUTURANDO":
            let d = normalizarVozNum(detalhe);
            d = d.includes("facil") ? "facil" : d.includes("medio") ? "medio" : d.includes("dificil") ? "dificil" : d.includes("impossivel") ? "impossivel" : "livre";
            localStorage.setItem("modoAtual", d === "livre" ? "livre" : d);
            falarAssistente(`Iniciando o modo ${d}.`);
            if(typeof window.mudarTela === "function") window.mudarTela('estruturando.html'); break;

        case "JOGAR_INCLUSIVO":
            let i = normalizarVozNum(detalhe);
            i = i.includes("reconhecer") ? "reconhecer" : i.includes("relacionar") ? "relacionar" : i.includes("interpretar") ? "interpretar" : "reconhecer";
            localStorage.setItem("modoAtual", `inclusao-${i}`);
            falarAssistente(`Iniciando inclusivo ${i}.`);
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
        case "LIGAR_ATOMOS":
            let p = detalhe.split("|");
            if(p.length >= 2 && typeof window.ligarAtomosVoz === "function") window.ligarAtomosVoz(p[0], p[1], p[2] || "simples"); break;
        case "COMPLETAR_VALENCIA": if(typeof window.acaoPecaVoz === "function") window.acaoPecaVoz(detalhe, "completar"); break;
        case "DESVINCULAR_PECA": if(typeof window.acaoPecaVoz === "function") window.acaoPecaVoz(detalhe, "desvincular"); break;
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
    if (acao === "completar") { if(typeof window.cmCompletar === "function") window.cmCompletar(); falarAssistente(`Valência do ${peca.dataset.idVoz} completada.`); } 
    else if (acao === "excluir") { let n = peca.dataset.idVoz; if(typeof window.cmExcluir === "function") window.cmExcluir(); falarAssistente(`O ${n} foi excluído.`); }
    else if (acao === "desvincular") { if(typeof window.cmDesvincular === "function") window.cmDesvincular(); falarAssistente(`O ${peca.dataset.idVoz} foi desvinculado.`); }
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