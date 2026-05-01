// ==========================================
// ASSISTENTE DE VOZ ADÔMINES - VERSÃO DEFINITIVA (MICROFONE IMORTAL + PUSH-TO-TALK)
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
// 1. CONFIGURAÇÃO DA VOZ
// ==========================================
function carregarVozes() {
    let vozes = assistenteSintese.getVoices();
    if(vozes.length === 0) return;
    let vozesBR = vozes.filter(v => v.lang === 'pt-BR' || v.lang === 'pt_BR' || v.lang.includes('pt-BR'));
    vozAssistente = vozesBR.length > 0 ? (vozesBR.find(v => v.name.includes('Online') || v.name.includes('Google') || v.name.includes('Neural')) || vozesBR[0]) : vozes[0];
}
if (speechSynthesis.onvoiceschanged !== undefined) { speechSynthesis.onvoiceschanged = carregarVozes; }

// ==========================================
// 2. O MICROFONE IMORTAL (Recria a si mesmo se o Chrome travar)
// ==========================================
function criarMicrofone() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (assistenteReconhecimento) {
        try { assistenteReconhecimento.abort(); } catch(e){}
    }

    assistenteReconhecimento = new SpeechRecognition();
    assistenteReconhecimento.lang = 'pt-BR'; 
    assistenteReconhecimento.continuous = false; // Modo tiro rápido pro PTT
    assistenteReconhecimento.interimResults = false;

    assistenteReconhecimento.onstart = function() {
        let btn = document.getElementById("btnAssistente");
        if(btn) btn.classList.add("mic-ouvindo");
    };

    assistenteReconhecimento.onresult = function(event) {
        let comandoOriginal = event.results[event.results.length - 1][0].transcript.trim();
        let c = comandoOriginal.toLowerCase();

        // 1. MOSTRA NA TELA O QUE ELA OUVIU (O Feedback de segurança)
        if (comandoOriginal.length >= 1 && typeof mostrarMensagemGlob === "function") {
            mostrarMensagemGlob('🎤 Eu ouvi: "' + comandoOriginal + '"');
        }

        if(!assistenteAtivo || estouFalando || comandoOriginal.length < 2) return;
        
        processarComandoVoz(c, comandoOriginal);
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
        
        // Se ainda estiver apertando a barra de espaço, liga de volta
        if (assistenteAtivo && espacoPressionado && !estouFalando) {
            ligarMicrofone();
        }
    };
}

function ligarMicrofone() {
    if (!assistenteAtivo || estouFalando) return;
    if (!assistenteReconhecimento) criarMicrofone();
    
    try {
        assistenteReconhecimento.start();
    } catch (e) {
        // A MÁGICA: O Chrome travou? Destrói tudo e cria um novo em 1 milissegundo!
        console.log("Chrome travou o microfone. Recriando...");
        criarMicrofone();
        try { assistenteReconhecimento.start(); } catch(err){}
    }
}

// Inicia o microfone pela primeira vez
criarMicrofone();

// ==========================================
// 3. FUNÇÃO DE FALA (BLINDADA CONTRA ECO)
// ==========================================
window.falarAssistente = function(texto) {
    if(assistenteSintese.speaking) assistenteSintese.cancel(); 
    if(!vozAssistente) carregarVozes();
    
    estouFalando = true; 
    
    // Mata o microfone na força pra não dar eco da própria voz
    if(assistenteReconhecimento) { try { assistenteReconhecimento.abort(); } catch(e){} }
    
    window.falaAtual = new SpeechSynthesisUtterance(texto);
    window.falaAtual.lang = "pt-BR"; 
    if(vozAssistente) window.falaAtual.voice = vozAssistente;
    window.falaAtual.rate = 1.0; 
    window.falaAtual.pitch = 1.1; 
    
    window.falaAtual.onend = function() { estouFalando = false; };
    window.falaAtual.onerror = function() { estouFalando = false; };

    clearTimeout(window.travaFalha);
    window.travaFalha = setTimeout(() => { estouFalando = false; }, Math.max(3000, (texto.length / 10) * 1000));

    if(typeof mostrarMensagemGlob === "function") mostrarMensagemGlob('🤖 Adômines: "' + texto + '"');
    assistenteSintese.speak(window.falaAtual);
}

window.toggleAssistenteVoz = function(silencioso = false) {
    if(!silencioso && typeof tocarSomClick === "function") tocarSomClick();
    
    if (assistenteAtivo) {
        assistenteAtivo = false; contextoAssistente = null; estouFalando = false; 
        try { assistenteReconhecimento.abort(); } catch(e){} 
        let btn = document.getElementById("btnAssistente"); if(btn) btn.classList.remove("mic-ouvindo");
        if(!silencioso) falarAssistente("Assistente desativada.");
    } else {
        assistenteAtivo = true; contextoAssistente = null; estouFalando = false;
        if(!silencioso) falarAssistente("Assistente ativada. Segure a tecla Espaço para falar.");
    }
}

// ==========================================
// 4. CONTROLE DO BOTÃO ESPAÇO E BOAS-VINDAS
// ==========================================
function dispararBoasVindas() {
    if (!anuncioBoasVindasFeito) {
        anuncioBoasVindasFeito = true;
        if (assistenteSintese) assistenteSintese.resume();
        if(typeof musica !== 'undefined' && musica && musica.paused && !mutado) musica.play().catch(()=>{});
        
        falarAssistente("Olá! O jogo possui uma assistente. Caso você precise ou queira usar, pressione e segure a tecla espaço e fale. Quando você soltar, eu processo o comando. Um clique rápido no Espaço desliga ou liga a assistente.");
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
        ligarMicrofone(); // Usa a nossa função segura que nunca trava!
    }
});

document.addEventListener("keyup", (e) => {
    if(e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;

    if (e.code === "Space") { 
        e.preventDefault(); 
        espacoPressionado = false;
        
        let tempoSegurado = Date.now() - tempoPressaoEspaco;
        
        if (tempoSegurado < 350) {
            // CLIQUE RÁPIDO -> DESLIGA / LIGA
            try { assistenteReconhecimento.abort(); } catch(err){}
            toggleAssistenteVoz();
        } else {
            // SOLTOU DEPOIS DE FALAR -> PROCESSA A VOZ
            if (assistenteAtivo && assistenteReconhecimento) {
                try { assistenteReconhecimento.stop(); } catch(err){}
            }
        }
    }
});

// ==========================================
// 5. O OLHO BIÔNICO (Lê enunciados automaticamente)
// ==========================================
const observadorAutomatico = new MutationObserver(() => {
    if (!assistenteAtivo || estouFalando) return;

    // A) Tutorial
    let modalTut = document.getElementById("tutorial-genshin-overlay");
    if (modalTut && window.getComputedStyle(modalTut).display !== "none" && !modalTut.dataset.lido) {
        modalTut.dataset.lido = "true";
        let txt = document.getElementById("tutorial-genshin-texto") ? document.getElementById("tutorial-genshin-texto").innerText : "";
        falarAssistente("Tutorial na tela. " + txt + " Diga prosseguir ou concluir.");
        return;
    }

    // B) Questionário do Impossível
    let modalClass = document.getElementById("modal-classificacao");
    if (modalClass && window.getComputedStyle(modalClass).display !== "none" && !modalClass.dataset.lido) {
        modalClass.dataset.lido = "true";
        falarAssistente("A estrutura está correta! Agora, classifique a molécula para ganhar a estrela. Diga qual marcar para Cadeia, Disposição, Saturação e Natureza. Depois diga Confirmar.");
        return;
    }

    // C) Nova Fase / Enunciado
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
// 6. CÉREBRO LOCAL (LÓGICA BLINDADA)
// ==========================================
const normalizarVoz = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

async function processarComandoVoz(c, comandoOriginal) {
    let limpo = normalizarVoz(c).replace(/[.,!?]/g, ""); 
    const tem = (...palavras) => palavras.some(p => limpo.includes(p));

    // AÇÕES DE FECHAR
    if (tem("fecha", "sai", "esconde", "oculta")) {
        if (tem("config", "ajuste")) return executarIntencao({acao: "FECHAR_CONFIG"});
        if (tem("tabela", "elemento")) return executarIntencao({acao: "FECHAR_TABELA"});
        if (tem("conquista", "trofeu", "medalha")) return executarIntencao({acao: "FECHAR_CONQUISTAS"});
        if (tem("chat", "conversa", "adm")) return executarIntencao({acao: "FECHAR_CHAT"});
        if (tem("tudo", "janela", "modal", "tutorial")) return executarIntencao({acao: "FECHAR_TUDO"});
    }

    // AÇÕES DE TUTORIAL
    let modalTut = document.getElementById("tutorial-genshin-overlay");
    if (modalTut && window.getComputedStyle(modalTut).display !== "none") {
        if (tem("prossegui", "avanca", "proximo", "continua", "passa", "seguir")) {
            if(typeof window.avancarTutorialGenshin === "function") { window.avancarTutorialGenshin(); return falarAssistente("Avançando."); }
        }
        if (tem("conclui", "fecha", "termina", "pronto", "entendi", "pular", "sair")) {
            if(typeof window.fecharTutorialGenshin === "function") { window.fecharTutorialGenshin(); return falarAssistente("Tutorial concluído. Boa sorte no jogo!"); }
        }
    }

    // CONSTRUÇÃO (LEGO)
    let regexPeca = /(carbono|oxigenio|oxigênio|hidrogenio|hidrogênio|nitrogenio|nitrogênio|enxofre|fosforo|fósforo|cloro|fluor|flúor|bromo|iodo)\s*(\d+)?/gi;
    let matchesPeca =[...comandoOriginal.matchAll(regexPeca)];

    if (tem("liga", "conecta", "junta") && matchesPeca.length >= 2) {
        let pA = matchesPeca[0][0]; let pB = matchesPeca[1][0];
        let t = "simples"; if(tem("dupla", "duas")) t="dupla"; if(tem("tripla", "tres", "três")) t="tripla";
        return executarIntencao({acao: "LIGAR_ATOMOS", detalhe: `${pA}|${pB}|${t}`});
    }
    if (tem("completa", "hidrogenio", "encher", "preenche") && matchesPeca.length >= 1 && !tem("cria", "coloca")) {
        return executarIntencao({acao: "COMPLETAR_VALENCIA", detalhe: matchesPeca[0][0]});
    }
    if (tem("desvincula", "separa", "solta", "desconecta") && matchesPeca.length >= 1) {
        return executarIntencao({acao: "DESVINCULAR_PECA", detalhe: matchesPeca[0][0]});
    }
    if (tem("exclui", "apaga", "deleta", "remove", "tira") && matchesPeca.length >= 1) {
        return executarIntencao({acao: "EXCLUIR_PECA", detalhe: matchesPeca[0][0]});
    }
    if (tem("coloca", "cria", "adiciona", "bota", "pega", "inser") && matchesPeca.length >= 1) {
        return executarIntencao({acao: "CRIAR_ATOMO", detalhe: matchesPeca[0][1]}); 
    }
    
    // FERRAMENTAS DO JOGO
    if (tem("limpa quadro", "limpar quadro", "apaga tudo", "recomecar")) return executarIntencao({acao: "LIMPAR_QUADRO"});
    if (tem("o que tem", "ler quadro", "minhas pecas", "minha estrutura")) return executarIntencao({acao: "LER_QUADRO"});
    if (tem("dica", "ajuda na fase", "me ajuda", "o que eu faco")) return executarIntencao({acao: "DICA_DESAFIO"});
    if (tem("foto", "fotografa", "captura")) return executarIntencao({acao: "TIRAR_FOTO"});
    if (tem("desfazer", "desfaz", "volta acao", "apagar ultimo")) return executarIntencao({acao: "DESFAZER_ACAO"});
    if (tem("girar tudo", "gira molecula", "girar molecula", "rotacionar")) return executarIntencao({acao: "GIRAR_MOLECULAS"});
    if (tem("aproximar", "zoom in", "mais zoom", "aumentar visao", "chegar perto")) return executarIntencao({acao: "ZOOM_MAIS"});
    if (tem("afastar", "zoom out", "menos zoom", "diminuir visao", "ficar longe")) return executarIntencao({acao: "ZOOM_MENOS"});
    if (tem("centralizar", "centro", "resetar visao", "normalizar tela")) return executarIntencao({acao: "ZOOM_RESET"});
    if (tem("catalogo", "pokedex", "descobertas")) return executarIntencao({acao: "ABRIR_CATALOGO"});

    // PINTURA (INCLUSIVO)
    if (tem("curiosidade", "informacao quimica")) return executarIntencao({acao: "INFO_INCLUSIVA"});
    if (tem("borracha", "apagar traco")) return executarIntencao({acao: "COR_BORRACHA"});
    if (tem("vermelh", "pinta de vermelho")) return executarIntencao({acao: "COR_VERMELHA"});
    if (tem("azul", "pinta de azul")) return executarIntencao({acao: "COR_AZUL"});
    if (tem("amarel", "pinta de amarelo")) return executarIntencao({acao: "COR_AMARELA"});
    if (tem("preto", "preta", "pinta de preto", "lapis")) return executarIntencao({acao: "COR_PRETA"});
    if (tem("verde", "pinta de verde")) return executarIntencao({acao: "COR_VERDE"});
    if (tem("cinza", "pinta de cinza")) return executarIntencao({acao: "COR_CINZA"});
    if (tem("pronto pintura", "terminei a pintura", "terminei o desenho")) return executarIntencao({acao: "CONCLUIR_PINTURA"});

    // QUESTIONÁRIO IMPOSSÍVEL AUTOMATIZADO
    let modalClass = document.getElementById("modal-classificacao");
    if (modalClass && window.getComputedStyle(modalClass).display !== "none") {
        if (tem("confirma", "verifica", "completa", "envia", "terminei", "finaliza")) return executarIntencao({acao: "CONFIRMAR_CLASSIFICACAO"});
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

    // MEMÓRIA DE MODOS
    if (contextoAssistente === "escolher_submodo_estruturando") {
        if (tem("livre")) { contextoAssistente = null; return executarIntencao({acao: "JOGAR_ESTRUTURANDO", detalhe: "livre"}); }
        if (tem("facil")) { contextoAssistente = null; return executarIntencao({acao: "JOGAR_ESTRUTURANDO", detalhe: "facil"}); }
        if (tem("medio", "media")) { contextoAssistente = null; return executarIntencao({acao: "JOGAR_ESTRUTURANDO", detalhe: "medio"}); }
        if (tem("dificil")) { contextoAssistente = null; return executarIntencao({acao: "JOGAR_ESTRUTURANDO", detalhe: "dificil"}); }
        if (tem("impossivel")) { contextoAssistente = null; return executarIntencao({acao: "JOGAR_ESTRUTURANDO", detalhe: "impossivel"}); }
        if (tem("desafio")) return falarAssistente("Certo. Qual nível do desafio? Fácil, Médio, Difícil ou Impossível?"); 
        if (tem("cancela", "esquece", "sair", "para")) { contextoAssistente = null; return falarAssistente("Cancelado."); }
    }
    if (contextoAssistente === "escolher_modo_inclusivo") {
        if (tem("reconhece")) { contextoAssistente = null; return executarIntencao({acao: "JOGAR_INCLUSIVO", detalhe: "reconhecer"}); }
        if (tem("relaciona")) { contextoAssistente = null; return executarIntencao({acao: "JOGAR_INCLUSIVO", detalhe: "relacionar"}); }
        if (tem("interpreta")) { contextoAssistente = null; return executarIntencao({acao: "JOGAR_INCLUSIVO", detalhe: "interpretar"}); }
        if (tem("cancela", "esquece", "sair", "para")) { contextoAssistente = null; return falarAssistente("Cancelado."); }
    }

    // ADÔMINES (QUIMICHAT)
    let ativadorRegex = /^(adomines|a dominis|a domines|adominis|as dominis|aldomines|o dominis|ad homens|aos dominis|adomini|adomin|domines|dominis)\b/i;
    if (ativadorRegex.test(limpo)) {
        let pergunta = comandoOriginal.replace(/^(Ad[ôo]mines|A dominis|A domines|Adominis|As dominis|Aldomines|O dominis|Ad homens|Aos dominis|Adomini|Adomin|Domines|Dominis)\s*/i, "").trim(); 
        if (pergunta.length > 2) {
            if(typeof window.abrirQuimiChat === "function") window.abrirQuimiChat(); 
            if(typeof window.enviarPerguntaQuimiChat === "function") window.enviarPerguntaQuimiChat(pergunta, true); 
        } else falarAssistente("Pode fazer sua pergunta de química.");
        return;
    }

    // CANCELAMENTOS GERAIS
    if (tem("cancela", "esquece", "deixa pra la")) return falarAssistente("Cancelado."); 
    if (tem("verifica", "checa", "terminei a molecula", "terminei a estrutura", "veja se ta certo", "corrigir estrutura")) return executarIntencao({acao: "VERIFICAR_ESTRUTURA"});
    if (tem("quanto tempo", "tempo restante", "tempo falta", "relogio", "cronometro")) return executarIntencao({acao: "STATUS_TEMPO"});
    if (tem("quantas vidas", "minhas vidas", "coracoes", "vida tenho", "vidas restam")) return executarIntencao({acao: "STATUS_VIDAS"});
    if (tem("quantas estrelas", "minhas estrelas", "estrelas tenho")) return executarIntencao({acao: "STATUS_ESTRELAS"});

    // SOM E MUDO (A CORREÇÃO EXATA DO PROBLEMA DE MUTAR/DESMUTAR)
    if (tem("desmuta", "com som", "liga som", "ativa som", "volta som", "tira mudo", "tirar mudo", "desativar mudo")) return executarIntencao({acao: "DESMUTAR_SOM"});
    if (tem("muta", "mudo", "tira som", "tirar som", "silencio", "sem som", "desliga som")) return executarIntencao({acao: "MUTAR_SOM"});
    
    if (tem("abaixa", "diminui", "reduz", "menos") && tem("musica", "som", "volume")) return executarIntencao({acao: "DIMINUIR_MUSICA"});
    if (tem("abaixa", "diminui", "reduz", "menos") && tem("efeito")) return executarIntencao({acao: "DIMINUIR_EFEITOS"});
    if (tem("desliga", "tira", "desativa") && tem("efeito", "visuais", "visual")) return executarIntencao({acao: "DESLIGAR_VISUAIS"});
    if (tem("liga", "coloca", "ativa") && tem("efeito", "visuais", "visual")) return executarIntencao({acao: "LIGAR_VISUAIS"});
    if (tem("modo claro", "tema claro", "dia")) return executarIntencao({acao: "TEMA_CLARO"});
    if (tem("modo escuro", "tema escuro", "noturno")) return executarIntencao({acao: "TEMA_ESCURO"});
    if (tem("volta", "retorna", "anterior", "voltar")) return executarIntencao({acao: "VOLTAR"});
    
    // ABRIR PAINÉIS
    if (tem("configura", "ajuste", "opcao", "opcoes")) return executarIntencao({acao: "ABRIR_CONFIG"});
    if (tem("tabela periodica", "tabela", "elementos")) return executarIntencao({acao: "ABRIR_TABELA"});
    if (tem("conquista", "trofeu", "medalha")) return executarIntencao({acao: "ABRIR_CONQUISTAS"});
    if (tem("quimichat", "chat", "conversa", "painel adm", "administrador")) return executarIntencao({acao: "ABRIR_CHAT"});
    
    // LEITURAS
    if (tem("ler", "leia", "lê") && tem("tela", "tudo")) return executarIntencao({acao: "LER_TELA"});
    if (tem("ler", "leia", "lê") && tem("enunciado", "pergunta", "questao", "tarefa", "fazer")) return executarIntencao({acao: "LER_ENUNCIADO"});
    if (tem("ler", "leia", "lê") && tem("alternativa", "item", "opcoes", "resposta")) return executarIntencao({acao: "LER_ALTERNATIVAS"});

    // ENTRAR NOS MODOS (A CORREÇÃO DO "PERGUNTAR QUAL NÍVEL DO DESAFIO")
    if (tem("estrutur") || tem("desafio") || (tem("modo") && tem("livre"))) {
        let det = "perguntar";
        if (tem("livre")) det = "livre";
        else if (tem("facil", "fácil")) det = "facil";
        else if (tem("medio", "médio", "media")) det = "medio";
        else if (tem("dificil", "difícil")) det = "dificil";
        else if (tem("impossivel", "impossível")) det = "impossivel";
        
        if (det === "perguntar") {
            contextoAssistente = "escolher_submodo_estruturando"; 
            return falarAssistente("Você quer jogar o modo Livre ou o Desafio? Diga qual o nível do desafio: fácil, médio, difícil ou impossível.");
        }
        return executarIntencao({acao: "JOGAR_ESTRUTURANDO", detalhe: det});
    }

    if (tem("inclusiv")) {
        let det = "perguntar";
        if (tem("reconhece")) det = "reconhecer";
        else if (tem("relaciona")) det = "relacionar";
        else if (tem("interpreta")) det = "interpretar";
        
        if (det === "perguntar") {
            contextoAssistente = "escolher_modo_inclusivo"; 
            return falarAssistente("Entrar em qual nível inclusivo? Reconhecer, Relacionar ou Interpretar?");
        }
        return executarIntencao({acao: "JOGAR_INCLUSIVO", detalhe: det});
    }

    // INICIAR
    if (tem("inicia", "entra", "joga", "bora", "vamo", "start", "comeca", "partiu")) {
        return executarIntencao({acao: "IR_MODOS"});
    }

    // SE NADA FUNCIONOU, ENVIE PARA A IA DA VERCEL
    try {
        const respostaApi = await fetch(`/api/assistente`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fraseJogador: comandoOriginal })
        });
        if (!respostaApi.ok) throw new Error("Falha na API.");
        const intencao = await respostaApi.json();
        executarIntencao(intencao, comandoOriginal);
    } catch (erro) {
        falarAssistente(`Eu escutei: "${comandoOriginal}". Mas não consegui conectar à internet para traduzir o que isso significa.`);
    }
}

// ==========================================
// 7. O MOTOR EXECUTOR DE AÇÕES
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
        case "MUTAR_SOM": if(typeof window.toggleMute === "function") window.toggleMute("mutar"); falarAssistente("Som mutado."); break;
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
                falarAssistente("Indo para modos."); if(typeof window.mudarTela==="function") window.mudarTela('modos.html'); 
            } else falarAssistente("Você já está na área de modos."); break;
        case "IR_TUTORIAL": falarAssistente("Indo para o tutorial."); if(typeof window.mudarTela==="function") window.mudarTela('tutorial.html'); break;
        
        case "STATUS_VIDAS": if (typeof vidasRestantes !== 'undefined') falarAssistente(`Você tem ${vidasRestantes} corações.`); break;
        case "STATUS_ESTRELAS": if (typeof estrelasGanhas !== 'undefined') falarAssistente(`Você já conseguiu ${estrelasGanhas} estrelas.`); break;
        case "STATUS_TEMPO": if (typeof tempoRestante !== "undefined" && typeof intervaloCronometro !== "undefined" && intervaloCronometro !== null) { let m = Math.floor(tempoRestante / 60); let s = tempoRestante % 60; falarAssistente(`Faltam ${m} minuto${m!==1?'s':''} e ${s} segundo${s!==1?'s':''}.`); } break;

        case "LER_TELA": lerTelaInteira(); break;
        case "LER_ENUNCIADO": { let seletores =[".hud-pergunta", "#nome-desafio-atual", ".enunciado", "#enunciado", ".sugestao", ".descricao", "#nome-molecula", ".comando-fase", "h2", "h3"]; let achou = false; for (let s of seletores) { let el = document.querySelector(s); if (el && el.innerText.trim() !== "" && !el.innerText.includes("💡")) { falarAssistente("A tarefa é: " + el.innerText); achou = true; break; } } if (!achou) falarAssistente("Não achei um enunciado."); } break;
        case "LER_TUTORIAL": { let els = document.querySelectorAll(".tutorial-conteudo, #tutorial, .tutorial, .texto-tutorial, #tutorial-genshin-texto"); let txt = ""; els.forEach(e => { if (e.offsetParent !== null) txt += e.innerText + ". "; }); if(txt.length > 0) falarAssistente(txt); else falarAssistente("Não achei tutorial."); } break;
            
        case "JOGAR_ESTRUTURANDO":
            let d = normalizarVoz(detalhe); 
            d = d.includes("facil") ? "facil" : d.includes("medio") ? "medio" : d.includes("dificil") ? "dificil" : d.includes("impossivel") ? "impossivel" : "livre";
            falarAssistente(`Iniciando nível ${d}.`);
            localStorage.setItem("modoAtual", d);
            if(typeof window.mudarTela === "function") window.mudarTela('estruturando.html'); break;

        case "JOGAR_INCLUSIVO":
            let i = normalizarVoz(detalhe);
            i = i.includes("reconhecer") ? "reconhecer" : i.includes("relacionar") ? "relacionar" : i.includes("interpretar") ? "interpretar" : "reconhecer";
            falarAssistente(`Iniciando inclusivo ${i}.`);
            localStorage.setItem("modoAtual", `inclusao-${i}`);
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
        case "LIGAR_ATOMOS": let p = detalhe.split("|"); if(p.length >= 2 && typeof window.ligarAtomosVoz === "function") window.ligarAtomosVoz(p[0], p[1], p[2] || "simples"); break;
        case "COMPLETAR_VALENCIA": if(typeof window.acaoPecaVoz === "function") window.acaoPecaVoz(detalhe, "completar"); break;
        case "DESVINCULAR_PECA": if(typeof window.acaoPecaVoz === "function") window.acaoPecaVoz(detalhe, "desvincular"); break;
        case "EXCLUIR_PECA": if(typeof window.acaoPecaVoz === "function") window.acaoPecaVoz(detalhe, "excluir"); break;
        case "LIMPAR_QUADRO": if(typeof window.limparQuadro === "function") { window.limparQuadro(); falarAssistente("Quadro limpo."); } break;
        case "LER_QUADRO": if(typeof window.lerQuadroVoz === "function") window.lerQuadroVoz(); break;
        
        case "DESCONHECIDO": 
        default: 
            falarAssistente(`Eu ouvi: "${comandoFalado}". Mas não tem essa opção na tela.`); 
            break;
    }
}

// ==========================================
// 8. FUNÇÕES DO LEGO QUÍMICO E VOZ DO QUADRO
// ==========================================
window.obterNomeElemento = function(sigla) {
    let t = normalizarVoz(sigla).replace("atomo de ", "").replace("átomo de ", "").trim();
    if(typeof elementosTabela !== "undefined") { let e = elementosTabela.find(x => normalizarVoz(x.s) === t || normalizarVoz(x.nome) === t); if(e) return { sigla: e.s, nome: e.nome }; }
    const m = { "c":"Carbono", "o":"Oxigênio", "h":"Hidrogênio", "n":"Nitrogênio", "s":"Enxofre", "p":"Fósforo", "cl":"Cloro", "f":"Flúor", "br":"Bromo", "i":"Iodo" };
    if(m[t]) return { sigla: m[t], nome: t };
    return { sigla: sigla, nome: sigla };
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
    let p = normalizarVoz(nome); if(!p.match(/\d+/)) p += " 1"; 
    let ats = Array.from(q.querySelectorAll('.peca-draggable.atomo'));
    return ats.find(a => normalizarVoz(a.dataset.idVoz || "") === p);
}

window.adicionarAtomoVoz = function(nome) {
    let q = document.getElementById("quadro-inner"); let l = document.getElementById("lista-atomos");
    if(!q || !l) return falarAssistente("Você precisa estar no modo Estruturando.");
    let i = window.obterNomeElemento(nome);
    let base = Array.from(l.querySelectorAll('.atomo')).find(a => a.dataset.sigla.toLowerCase() === i.sigla.toLowerCase());
    if(!base) return falarAssistente(`O ${i.nome} não está disponível nesta fase.`);
    let novo = base.cloneNode(true); novo.classList.add("no-quadro"); novo.dataset.id = Date.now(); novo.dataset.recemCriada = "true"; novo.style.position = "absolute"; novo.style.zIndex = 10;
    let r = q.getBoundingClientRect(); let off = Math.floor(Math.random() * 40) - 20;
    novo.style.left = (r.width/2 - 20 + off) + "px"; novo.style.top = (r.height/2 - 20 + off) + "px";
    q.appendChild(novo); window.atualizarTagsDeVoz();
    if(typeof window.verificarLigacoesQuimicas === "function") window.verificarLigacoesQuimicas();
    if(typeof window.atualizarContadores === "function") window.atualizarContadores();
    falarAssistente(`Adicionei o ${novo.dataset.idVoz} no quadro.`);
}

window.ligarAtomosVoz = function(nA, nB, tipo) {
    let pA = window.encontrarPecaVoz(nA); let pB = window.encontrarPecaVoz(nB);
    if(!pA || !pB) return falarAssistente("Não encontrei um desses átomos no quadro.");
    if(pA === pB) return falarAssistente("Você não pode ligar um átomo nele mesmo.");
    let cl = "lig-simples"; let vl = 1; let ht = '<div class="linha"></div>';
    if(tipo.includes("dupla")) { cl = "lig-dupla"; vl = 2; ht = '<div class="linha"></div><div class="linha"></div>'; }
    if(tipo.includes("tripla")) { cl = "lig-tripla"; vl = 3; ht = '<div class="linha"></div><div class="linha"></div><div class="linha"></div>'; }
    let lig = document.createElement("div"); lig.className = `peca-draggable ligacao ${cl} no-quadro`; lig.dataset.tipo = "ligacao"; lig.dataset.val = vl; lig.dataset.id = Date.now(); lig.style.position = "absolute"; lig.style.zIndex = 9; lig.innerHTML = ht;
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
        if (a.classList.contains("atomo-erro")) st = "Valência excedida.";
        else if (a.classList.contains("atomo-sucesso")) st = "Valência correta.";
        else st = "Valência incompleta.";
        let th = hid > 0 ? `Completado com ${hid} hidrogênios.` : "";
        let tl = a.dataset.grupo ? "Conectado." : "Solto no quadro.";
        l += `${a.dataset.idVoz}: ${tl} ${th} ${st} `;
    });
    falarAssistente(l);
}