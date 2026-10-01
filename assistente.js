// ==========================================
// ASSISTENTE DE VOZ ADÔMINES (100% LOCAL - ZERO DELAY)
// ==========================================
let assistenteAtivo = sessionStorage.getItem("assistenteAtiva") === "true"; 
let assistenteReconhecimento = null;
let assistenteSintese = window.speechSynthesis;
let vozAssistente = null;
let contextoAssistente = null; 

let estouFalando = false; 
let espacoPressionado = false;
let tempoPressaoEspaco = 0;
window.falaAtual = null;

window.atualizarIconeMic = function() {
    let btn = document.getElementById("btnAssistente");
    if (!btn) return;
    let barra = btn.querySelector('.barra-vermelha-mic');
    if (assistenteAtivo) {
        if(barra) barra.remove();
    } else {
        if(!barra) {
            btn.style.position = "relative";
            let novaBarra = document.createElement("div");
            novaBarra.className = "barra-vermelha-mic";
            novaBarra.style.cssText = "position:absolute; top:50%; left:15%; width:70%; height:3px; background-color:#ef4444; transform:rotate(45deg); z-index:10; pointer-events:none; border-radius:2px;";
            btn.appendChild(novaBarra);
        }
    }
};

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
            assistenteAtivo = false; sessionStorage.setItem("assistenteAtiva", "false");
            window.atualizarIconeMic();
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
};

window.toggleAssistenteVoz = function(silencioso = false) {
    if(!silencioso && typeof tocarSomClick === "function") tocarSomClick();
    if (assistenteAtivo) {
        assistenteAtivo = false; sessionStorage.setItem("assistenteAtiva", "false");
        contextoAssistente = null; 
        try { assistenteReconhecimento.stop(); } catch(e){} 
        window.atualizarIconeMic();
        let btn = document.getElementById("btnAssistente"); if(btn) btn.classList.remove("mic-ouvindo");
        if(!silencioso) falarAssistente("Assistente desativada.");
    } else {
        assistenteAtivo = true; sessionStorage.setItem("assistenteAtiva", "true");
        contextoAssistente = null; 
        window.atualizarIconeMic();
        if(!silencioso) falarAssistente("Assistente ativada. Segure a tecla Espaço para falar.");
    }
};

function inicializarVozSilenciosamente() {
    if (!sessionStorage.getItem("audioLiberado")) {
        sessionStorage.setItem("audioLiberado", "true");
        if (assistenteSintese) assistenteSintese.resume();
        if(typeof musica !== 'undefined' && musica && musica.paused && !mutado) musica.play().catch(()=>{});
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
    for(let m of modais) { if (window.getComputedStyle(m).display !== "none") return true; }
    return false;
};

const normalizarVozNum = (str) => {
    if (!str) return "";
    let t = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return t.replace(/\bum\b/g, "1").replace(/\bdois\b/g, "2").replace(/\btres\b/g, "3").replace(/\bquatro\b/g, "4").replace(/\bcinco\b/g, "5")
            .replace(/\bseis\b/g, "6").replace(/\bsete\b/g, "7").replace(/\boito\b/g, "8").replace(/\bnove\b/g, "9").replace(/\bdez\b/g, "10").replace(/[.,!?]/g, "");
};

// ==========================================
// PROCESSAMENTO 100% LOCAL (SEM CHAVES, SEM API EXTERNA)
// ==========================================
function processarComandoVoz(comandoOriginal) {
    let limpo = normalizarVozNum(comandoOriginal); 
    const tem = (...palavras) => palavras.some(p => {
        let pNorm = normalizarVozNum(p);
        return new RegExp('\\b' + pNorm + '\\b', 'i').test(limpo);
    });

    // 1. Contextos de Diálogo Ativo
    if (contextoAssistente) {
        if (tem("cancela", "cancelar", "esquece", "sair", "parar")) { 
            contextoAssistente = null; 
            return falarAssistente("Cancelado."); 
        }
        
        if (contextoAssistente === "escolher_modo_estruturando_base") {
            if (tem("livre")) { contextoAssistente = null; return executarIntencao({acao: "JOGAR_ESTRUTURANDO", detalhe: "livre"}); }
            if (tem("desafio")) { contextoAssistente = "escolher_submodo_estruturando"; return falarAssistente("Escolha o nível: fácil, médio, difícil ou impossível."); }
            return falarAssistente("Diga livre ou desafio.");
        }
        if (contextoAssistente === "escolher_submodo_estruturando") {
            if (tem("facil")) { contextoAssistente = null; return executarIntencao({acao: "JOGAR_ESTRUTURANDO", detalhe: "facil"}); }
            if (tem("medio")) { contextoAssistente = null; return executarIntencao({acao: "JOGAR_ESTRUTURANDO", detalhe: "medio"}); }
            if (tem("dificil")) { contextoAssistente = null; return executarIntencao({acao: "JOGAR_ESTRUTURANDO", detalhe: "dificil"}); }
            if (tem("impossivel")) { contextoAssistente = null; return executarIntencao({acao: "JOGAR_ESTRUTURANDO", detalhe: "impossivel"}); }
            return falarAssistente("Diga: fácil, médio, difícil ou impossível.");
        }
        
        if (contextoAssistente === "escolher_modo_balanceando_base") {
            if (tem("facil")) { contextoAssistente = null; return executarIntencao({acao: "JOGAR_BALANCEANDO", detalhe: "balanceando-facil"}); }
            if (tem("medio")) { contextoAssistente = null; return executarIntencao({acao: "JOGAR_BALANCEANDO", detalhe: "balanceando-medio"}); }
            if (tem("dificil")) { contextoAssistente = null; return executarIntencao({acao: "JOGAR_BALANCEANDO", detalhe: "balanceando-dificil"}); }
            if (tem("impossivel")) { contextoAssistente = null; return executarIntencao({acao: "JOGAR_BALANCEANDO", detalhe: "balanceando-impossivel"}); }
            return falarAssistente("Diga o nível do balanceamento: fácil, médio, difícil ou impossível.");
        }

        if (contextoAssistente === "escolher_modo_inclusivo") {
            if (tem("reconhecer")) { contextoAssistente = null; return executarIntencao({acao: "JOGAR_INCLUSIVO", detalhe: "reconhecer"}); }
            if (tem("relacionar")) { contextoAssistente = null; return executarIntencao({acao: "JOGAR_INCLUSIVO", detalhe: "relacionar"}); }
            if (tem("interpretar")) { contextoAssistente = null; return executarIntencao({acao: "JOGAR_INCLUSIVO", detalhe: "interpretar"}); }
            return falarAssistente("Diga: reconhecer, relacionar ou interpretar.");
        }
    }

    // 2. Comandos da Central e Ajuda
    if (tem("comando", "comandos", "ajuda de voz", "o que posso falar", "lista de comandos", "quais comandos")) {
        return executarIntencao({acao: "ABRIR_COMANDOS_VOZ"});
    }

    // 3. Fechamentos
    if (tem("fecha", "fechar", "sai", "sair", "oculta", "ocultar")) {
        if (tem("configuracoes", "ajuste")) return executarIntencao({acao: "FECHAR_CONFIG"});
        if (tem("tabela", "elemento")) return executarIntencao({acao: "FECHAR_TABELA"});
        if (tem("conquista", "trofeu")) return executarIntencao({acao: "FECHAR_CONQUISTAS"});
        if (tem("chat", "conversa", "quimichat")) return executarIntencao({acao: "FECHAR_CHAT"});
        if (tem("comando", "comandos")) return executarIntencao({acao: "FECHAR_COMANDOS_VOZ"});
        return executarIntencao({acao: "FECHAR_TUDO"});
    }

    // 4. QuimiChat e Conversa
    let ativadorQuimi = /\b(ad[oô]mines|quimichat|kimichat)\b/i;
    if (ativadorQuimi.test(limpo)) {
        let pergunta = comandoOriginal.replace(/.*(ad[oô]mines|quimichat|kimichat)\s*/i, "").trim(); 
        if (pergunta.length > 5) {
            if(typeof window.abrirQuimiChat === "function") window.abrirQuimiChat(); 
            if(typeof window.enviarPerguntaQuimiChat === "function") window.enviarPerguntaQuimiChat(pergunta, true); 
            return;
        } else {
            return executarIntencao({acao: "ABRIR_CHAT"});
        }
    }

    // 5. Navegação de Fases (Híbrida entre Estruturando e Balanceando)
    if (tem("voltar fase", "fase anterior", "desafio anterior")) return executarIntencao({acao: "VOLTAR_FASE"});
    if (tem("encerrar desafio", "completar desafio", "finalizar desafio", "concluir desafio")) return executarIntencao({acao: "ENCERRAR_DESAFIO"});
    if (tem("pular fase", "pula a fase", "proximo desafio", "proxima fase", "pular desafio")) return executarIntencao({acao: "PULAR_FASE"});

    // 6. Verificação de Estrutura e Balança
    if (tem("verifica", "verificar", "checa", "checar", "corrigir", "veja se ta certo") || tem("terminei")) {
        if(window.location.pathname.includes('balanceando')) return executarIntencao({acao: "VERIFICAR_BALANCA"});
        if(document.getElementById("modal-classificacao") && window.getComputedStyle(document.getElementById("modal-classificacao")).display !== "none") {
            return executarIntencao({acao: "CONFIRMAR_CLASSIFICACAO"});
        }
        return executarIntencao({acao: "VERIFICAR_ESTRUTURA"});
    }

    // 7. Modais e Telas
    if (tem("ver em 3d", "mostrar em 3d", "modo 3d", "abrir 3d", "tres de", "3d")) return executarIntencao({acao: "VER_3D"});
    if (tem("tutorial", "como jogar")) return executarIntencao({acao: "ABRIR_TUTORIAL"});
    if (tem("configura", "configuracoes", "ajuste")) return executarIntencao({acao: "ABRIR_CONFIG"});
    if (tem("tabela periodica", "tabela")) return executarIntencao({acao: "ABRIR_TABELA"});
    if (tem("conquista", "conquistas", "trofeus")) return executarIntencao({acao: "ABRIR_CONQUISTAS"});
    if (tem("catalogo", "pokedex")) return executarIntencao({acao: "ABRIR_CATALOGO"});
    if (tem("adm", "administrador")) return executarIntencao({acao: "ABRIR_ADM"});

    // 8. Leitura em Voz Alta
    if (tem("ler", "leia", "le") && tem("tutorial")) return executarIntencao({acao: "LER_TUTORIAL"});
    if (tem("ler", "leia", "le") && tem("enunciado", "pergunta", "tarefa")) return executarIntencao({acao: "LER_ENUNCIADO"});
    if (tem("quantas vidas", "minhas vidas", "coracoes")) return executarIntencao({acao: "STATUS_VIDAS"});
    if (tem("quantas estrelas", "minhas estrelas")) return executarIntencao({acao: "STATUS_ESTRELAS"});
    if (tem("quanto tempo", "tempo restante", "cronometro")) return executarIntencao({acao: "STATUS_TEMPO"});

    // 9. Montagem Molecular (Modo Estruturando)
    let regexPeca = /(carbono|oxigenio|hidrogenio|nitrogenio|enxofre|fosforo|cloro|fluor|bromo|iodo)\s*(\d+)?/gi;
    let matchesPeca = [...limpo.matchAll(regexPeca)]; 

    if (tem("completa", "completar", "hidrogenio", "encher", "preenche") && !tem("cria", "coloca")) {
        if (tem("todos", "tudo")) return executarIntencao({acao: "COMPLETAR_VALENCIA", detalhe: "todos"});
        if (matchesPeca.length >= 1) return executarIntencao({acao: "COMPLETAR_VALENCIA", detalhe: matchesPeca[0][0]});
    }

    if (tem("limpa quadro", "limpar quadro", "apaga tudo", "recomecar")) return executarIntencao({acao: "LIMPAR_QUADRO"});
    if (tem("gira", "girar", "rotaciona") && tem("molecula", "quadro")) return executarIntencao({acao: "GIRAR_MOLECULAS"});
    if (tem("desfazer", "desfaz", "voltar acao")) return executarIntencao({acao: "DESFAZER_ACAO"});
    if (tem("foto", "print", "fotografia")) return executarIntencao({acao: "TIRAR_FOTO"});
    if (tem("dica")) return executarIntencao({acao: "DICA_DESAFIO"});

    if (tem("coloca", "colocar", "cria", "criar", "adiciona", "bota") && tem("ligacao")) {
        let t = "simples"; if(tem("dupla")) t="dupla"; if(tem("tripla")) t="tripla";
        return executarIntencao({acao: "CRIAR_LIGACAO", detalhe: t});
    }
    if (tem("coloca", "colocar", "cria", "criar", "adiciona", "bota") && matchesPeca.length >= 1) {
        return executarIntencao({acao: "CRIAR_ATOMO", detalhe: matchesPeca[0][1] || matchesPeca[0][0]}); 
    }

    // 10. Configurações de Sistema
    if (tem("modo escuro", "tema escuro", "noturno")) return executarIntencao({acao: "TEMA_ESCURO"});
    if (tem("modo claro", "tema claro", "dia")) return executarIntencao({acao: "TEMA_CLARO"});
    if (tem("desmuta", "liga som", "ativar som", "com som")) return executarIntencao({acao: "DESMUTAR_SOM"});
    if (tem("muta", "mutar", "mudo", "tira som", "sem som")) return executarIntencao({acao: "MUTAR_SOM"});

    // 11. Entradas em Modos
    if (tem("balancear", "balanceando", "balanca")) {
        contextoAssistente = "escolher_modo_balanceando_base";
        return falarAssistente("Escolha a dificuldade do Balanceando: fácil, médio, difícil ou impossível.");
    }
    if (tem("estruturando") || (tem("jogar", "iniciar") && tem("livre", "desafio"))) {
        contextoAssistente = "escolher_modo_estruturando_base";
        return falarAssistente("Você quer jogar o modo livre ou o modo desafio?");
    }
    if (tem("inclusivo", "inclusao", "acessivel")) {
        contextoAssistente = "escolher_modo_inclusivo"; 
        return falarAssistente("Entrar em qual nível? Reconhecer, Relacionar ou Interpretar?");
    }

    if (tem("inicia", "iniciar", "entra", "entrar", "joga", "jogar", "bora", "comecar")) {
        return executarIntencao({acao: "IR_MODOS"});
    }

    if (tem("volta", "voltar", "retorna", "retornar", "sair")) {
        return executarIntencao({acao: "VOLTAR"});
    }

    // Resposta padrão imediata para comandos não catalogados
    falarAssistente(`Eu ouvi "${comandoOriginal}". Diga "comandos" para ver o que posso fazer.`);
}

// ==========================================
// EXECUTOR DETERMINÍSTICO DE INTENÇÕES
// ==========================================
function executarIntencao(intencao) {
    let acao = (intencao.acao || "DESCONHECIDO").toUpperCase();
    let detalhe = (intencao.detalhe || "").toLowerCase();

    switch (acao) {
        case "ABRIR_COMANDOS_VOZ": 
            if(typeof window.abrirComandosVoz === "function") window.abrirComandosVoz(); 
            falarAssistente("Abrindo a lista de comandos na tela."); 
            break;
        case "FECHAR_COMANDOS_VOZ": 
            if(typeof window.fecharComandosVoz === "function") window.fecharComandosVoz(); 
            falarAssistente("Fechado."); 
            break;

        case "VERIFICAR_BALANCA":
            if(typeof window.verificarBalanceamento === "function") {
                falarAssistente("Verificando a balança...");
                window.verificarBalanceamento();
            } else {
                falarAssistente("A verificação da balança não está disponível nesta tela.");
            }
            break;

        case "VERIFICAR_ESTRUTURA": 
            if(typeof window.verificarMoleculaDesafio === "function") { 
                falarAssistente("Verificando estrutura..."); 
                window.verificarMoleculaDesafio(); 
            } break;

        case "CONFIRMAR_CLASSIFICACAO": 
            if(typeof window.verificarClassificacao === "function") { 
                falarAssistente("Confirmando opções..."); 
                window.verificarClassificacao(); 
            } break;

        case "PULAR_FASE": 
            if(typeof window.pularFaseBalanceando === "function") { window.pularFaseBalanceando(); falarAssistente("Fase pulada."); }
            else if(typeof window.pularFaseDesafio === "function") { window.pularFaseDesafio(); }
            else { falarAssistente("Não é possível pular fase aqui."); }
            break;

        case "VOLTAR_FASE": 
            if(typeof window.voltarFaseBalanceando === "function") { window.voltarFaseBalanceando(); falarAssistente("Voltando fase."); }
            else if(typeof window.voltarFaseDesafio === "function") { window.voltarFaseDesafio(); }
            else { falarAssistente("Não é possível voltar fase aqui."); }
            break;

        case "ENCERRAR_DESAFIO": 
            if(typeof window.encerrarDesafioBalanceando === "function") { window.encerrarDesafioBalanceando(); }
            else if(typeof window.encerrarDesafioCedo === "function") { window.encerrarDesafioCedo(); }
            else { falarAssistente("Não há desafio para encerrar nesta tela."); }
            break;

        case "FECHAR_CONFIG": let mConf = document.getElementById("menu"); if(mConf) mConf.style.display = "none"; falarAssistente("Fechado."); break;
        case "FECHAR_TABELA": if(typeof window.fecharTabelaPeriodica === "function") window.fecharTabelaPeriodica(); falarAssistente("Fechado."); break;
        case "FECHAR_CONQUISTAS": if(typeof window.fecharConquistasBtn === "function") window.fecharConquistasBtn(); falarAssistente("Fechado."); break;
        case "FECHAR_CHAT": if(typeof window.fecharChatBtn === "function") window.fecharChatBtn(); if(typeof window.fecharQuimiChat === "function") window.fecharQuimiChat(); falarAssistente("Fechado."); break;
        case "FECHAR_TUDO": 
            document.querySelectorAll('.modal-overlay').forEach(el => el.style.display = "none"); 
            document.body.style.overflow = "auto";
            if(typeof window.limparCena3D === "function") window.limparCena3D();
            falarAssistente("Fechado."); 
            break;

        case "ABRIR_CONFIG": if(typeof window.toggleMenu === "function") window.toggleMenu(new Event('click')); break;
        case "DESMUTAR_SOM": if(typeof window.toggleMute === "function") window.toggleMute("desmutar"); falarAssistente("Som ativado."); break;
        case "MUTAR_SOM": if(typeof window.toggleMute === "function") window.toggleMute("mutar"); falarAssistente("Som silenciado."); break;
        case "VOLTAR": if(window.history.length > 1) window.history.back(); else window.mudarTela('index.html'); falarAssistente("Voltando."); break;
        case "ABRIR_TABELA": if(typeof window.abrirTabelaPeriodica === "function") window.abrirTabelaPeriodica(); falarAssistente("Tabela aberta."); break;
        case "ABRIR_CONQUISTAS": if(typeof window.abrirConquistas === "function") window.abrirConquistas(); falarAssistente("Conquistas abertas."); break;
        case "ABRIR_CHAT": if(typeof window.abrirQuimiChat === "function") window.abrirQuimiChat(); falarAssistente("QuimiChat aberto."); break;
        case "ABRIR_ADM": if(typeof window.abrirChat === "function") window.abrirChat(); falarAssistente("Painel administrador aberto."); break;
        case "ABRIR_CATALOGO": if(typeof window.abrirCatalogo === "function") window.abrirCatalogo(); falarAssistente("Catálogo aberto."); break;
        case "VER_3D":
            if(typeof window.abrirVisualizador3D === "function") {
                window.abrirVisualizador3D(); 
                falarAssistente("Abrindo modelo 3D.");
            } else { falarAssistente("O modo 3D não está disponível nesta tela."); }
            break;

        case "TEMA_CLARO": if (document.body.classList.contains("dark") && typeof window.toggleModo === "function") window.toggleModo("claro"); falarAssistente("Modo claro."); break;
        case "TEMA_ESCURO": if (!document.body.classList.contains("dark") && typeof window.toggleModo === "function") window.toggleModo("escuro"); falarAssistente("Modo escuro."); break;

        case "IR_MODOS": if(typeof window.mudarTela==="function") window.mudarTela('modos.html'); falarAssistente("Abrindo os modos."); break;
        case "STATUS_VIDAS": if (typeof vidasRestantes !== 'undefined') falarAssistente(`Você tem ${vidasRestantes} corações.`); break;
        case "STATUS_ESTRELAS": if (typeof estrelasGanhas !== 'undefined') falarAssistente(`Você conseguiu ${estrelasGanhas} estrelas.`); break;
        case "STATUS_TEMPO": 
            if (typeof tempoRestante !== "undefined") { 
                let m = Math.floor(tempoRestante / 60); 
                let s = tempoRestante % 60; 
                falarAssistente(`Faltam ${m} minuto${m!==1?'s':''} e ${s} segundo${s!==1?'s':''}.`); 
            } break;

        case "JOGAR_ESTRUTURANDO":
            localStorage.setItem("modoAtual", detalhe); 
            falarAssistente(`Iniciando o modo ${detalhe}.`);
            if(typeof window.mudarTela === "function") window.mudarTela('estruturando.html'); 
            break;

        case "JOGAR_BALANCEANDO":
            localStorage.setItem("modoAtual", detalhe); 
            falarAssistente("Iniciando o modo Balanceando.");
            if(typeof window.mudarTela === "function") window.mudarTela('balanceando.html'); 
            break;

        case "JOGAR_INCLUSIVO":
            localStorage.setItem("modoAtual", `inclusao-${detalhe}`); 
            falarAssistente(`Iniciando inclusivo ${detalhe}.`);
            if(typeof window.mudarTela === "function") window.mudarTela('inclusao.html'); 
            break;

        case "CRIAR_ATOMO": if(typeof window.adicionarAtomoVoz === "function") window.adicionarAtomoVoz(detalhe); break;
        case "CRIAR_LIGACAO": if(typeof window.adicionarLigacaoVoz === "function") window.adicionarLigacaoVoz(detalhe); break;
        case "COMPLETAR_VALENCIA": if(typeof window.acaoPecaVoz === "function") window.acaoPecaVoz(detalhe, "completar"); break;
        case "LIMPAR_QUADRO": if(typeof window.limparQuadro === "function") { window.limparQuadro(); falarAssistente("Quadro limpo."); } break;
        case "DESFAZER_ACAO": if(typeof window.desfazerAcao === "function") window.desfazerAcao(); falarAssistente("Ação desfeita."); break;
        case "GIRAR_MOLECULAS": if(typeof window.girarMoleculas === "function") window.girarMoleculas(); falarAssistente("Rotacionado."); break;
        case "TIRAR_FOTO": if(typeof window.tirarFoto === "function") window.tirarFoto(); break;
        case "DICA_DESAFIO": if(typeof window.mostrarDicaDesafio === "function") window.mostrarDicaDesafio(); break;

        default: falarAssistente("Não reconheci esse comando. Diga 'comandos' para ajuda."); break;
    }
}