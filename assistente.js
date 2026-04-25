// ==========================================
// ASSISTENTE DE VOZ (CÉREBRO HÍBRIDO + ACESSIBILIDADE DE QUADRO)
// ==========================================
let assistenteAtivo = false;
let assistenteReconhecimento = null;
let assistenteSintese = window.speechSynthesis;
let vozAssistente = null;
let contextoAssistente = null; 

function carregarVozes() {
    let vozes = assistenteSintese.getVoices();
    if(vozes.length === 0) return;
    let vozesBR = vozes.filter(v => v.lang === 'pt-BR' || v.lang === 'pt_BR' || v.lang.includes('pt-BR'));
    if (vozesBR.length > 0) {
        vozAssistente = vozesBR.find(v => v.name.includes('Online') || v.name.includes('Google') || v.name.includes('Neural')) || vozesBR[0];
    } else {
        vozAssistente = vozes[0]; 
    }
}
if (speechSynthesis.onvoiceschanged !== undefined) { speechSynthesis.onvoiceschanged = carregarVozes; }

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    assistenteReconhecimento = new SpeechRecognition();
    assistenteReconhecimento.lang = 'pt-BR'; 
    assistenteReconhecimento.continuous = true; 
    assistenteReconhecimento.interimResults = false;

    assistenteReconhecimento.onstart = function() {
        if(!assistenteAtivo) return; 
        let btn = document.getElementById("btnAssistente");
        if(btn) btn.classList.add("mic-ouvindo");
    };

    assistenteReconhecimento.onresult = function(event) {
        if(!assistenteAtivo) return; 
        if(typeof isNavegando !== 'undefined' && isNavegando) return;
        
        // BLOQUEIO ABSOLUTO DO ECO: Ignora qualquer coisa que o microfone ouviu se ela estiver falando
        if(assistenteSintese.speaking) return;
        
        let comando = event.results[event.results.length - 1][0].transcript.trim();
        if (comando.length < 4) return; 

        if(typeof mostrarMensagemGlob === "function") mostrarMensagemGlob('🎤 Você: "' + comando + '"');
        processarComandoVoz(comando);
    };

    assistenteReconhecimento.onerror = function(event) {
        if(event.error === 'not-allowed') {
            if(typeof mostrarMensagemGlob === "function") mostrarMensagemGlob("Permissão do microfone negada.");
            assistenteAtivo = false; localStorage.setItem("assistenteAtivo", "false");
            let btn = document.getElementById("btnAssistente"); if(btn) btn.classList.remove("mic-ouvindo");
        }
    };

    assistenteReconhecimento.onend = function() {
        if (!assistenteAtivo) {
            let btn = document.getElementById("btnAssistente"); if(btn) btn.classList.remove("mic-ouvindo");
            return; 
        }
        if (!(typeof isNavegando !== 'undefined' && isNavegando) && !assistenteSintese.speaking) {
            try { assistenteReconhecimento.start(); } catch(e){}
        }
    };
}

assistenteSintese.onstart = function() { 
    if(assistenteReconhecimento && assistenteAtivo) { try { assistenteReconhecimento.abort(); } catch(e){} } 
}
assistenteSintese.onend = function() { 
    if(assistenteAtivo && !(typeof isNavegando !== 'undefined' && isNavegando)) { try { assistenteReconhecimento.start(); } catch(e){} } 
}

window.falarAssistente = function(texto) {
    if(assistenteSintese.speaking) assistenteSintese.cancel(); 
    if(!vozAssistente) carregarVozes();
    let fala = new SpeechSynthesisUtterance(texto);
    fala.lang = "pt-BR"; 
    if(vozAssistente) fala.voice = vozAssistente;
    fala.rate = 1.0; fala.pitch = 1.1; 
    if(typeof mostrarMensagemGlob === "function") mostrarMensagemGlob('🤖 Adômines: "' + texto + '"');
    assistenteSintese.speak(fala);
}

window.toggleAssistenteVoz = function(silencioso = false) {
    if(!silencioso && typeof tocarSomClick === "function") tocarSomClick();
    if (!assistenteReconhecimento) {
        if(typeof mostrarMensagemGlob === "function") mostrarMensagemGlob("Seu navegador não suporta a Assistente.");
        falarAssistente("Desculpe, seu navegador não suporta o assistente de voz."); return;
    }
    
    if (assistenteAtivo) {
        assistenteAtivo = false; 
        contextoAssistente = null; 
        localStorage.setItem("assistenteAtivo", "false"); 
        try { assistenteReconhecimento.abort(); } catch(e){} 
        let btn = document.getElementById("btnAssistente"); if(btn) btn.classList.remove("mic-ouvindo");
        if(!silencioso) { falarAssistente("Assistente desativada."); }
    } else {
        try {
            assistenteAtivo = true; 
            contextoAssistente = null; 
            localStorage.setItem("assistenteAtivo", "true"); 
            assistenteReconhecimento.start();
            if(!silencioso) { falarAssistente("Assistente ativada. Pode falar!"); }
        } catch(e) { }
    }
}

document.addEventListener("keydown", (e) => {
    if(e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
    if (e.code === "Space") { e.preventDefault(); toggleAssistenteVoz(); }
});

const normalizar = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function lerTelaInteira() {
    let textos =[];
    
    // Leitura especial se a tela de Classificação estiver aberta
    let modalClass = document.getElementById("modal-classificacao");
    if(modalClass && modalClass.style.display === "flex") {
        falarAssistente("Você precisa classificar a molécula. Diga as opções corretas. As categorias são: Cadeia: Aberta ou Fechada. Disposição: Normal ou Ramificada. Saturação: Saturada ou Insaturada. Natureza: Homogênea ou Heterogênea.");
        return;
    }

    let elementos = document.querySelectorAll("h1, h2, h3, p:not(.escondido), .descricao, .sugestao, .enunciado, .hud-pergunta");
    elementos.forEach(el => {
        if(el.offsetParent !== null && el.innerText.trim().length > 0 && !el.innerText.includes("💡")) { textos.push(el.innerText); }
    });
    if(textos.length > 0) { falarAssistente("Na tela diz o seguinte: " + textos.join(". ")); } 
    else { falarAssistente("Não encontrei nenhum texto principal nesta tela para ler."); }
}

async function processarComandoVoz(comandoOriginal) {
    let comando = normalizar(comandoOriginal.replace(/[.,!?]/g, "").trim());
    
    // Mais um bloqueio para não ouvir enquanto ela fala
    if (assistenteSintese.speaking) return;
    if (comando.length < 4) return; 

    const contem = (...palavras) => palavras.some(p => comando.includes(normalizar(p)));

    // =====================================
    // ATENDIMENTO RÁPIDO DO QUESTIONÁRIO (Nível Impossível)
    // Múltiplas opções podem ser marcadas de uma vez só!
    // =====================================
    let modalClass = document.getElementById("modal-classificacao");
    if (modalClass && modalClass.style.display === "flex") {
        if (contem("confirmar", "verificar", "completar", "enviar", "terminei", "finalizar")) {
            return executarIntencaoDaAssistente({acao: "CONFIRMAR_CLASSIFICACAO"});
        }
        let opMap = { "aberta": "Aberta", "fechada": "Fechada", "normal": "Normal", "ramificada": "Ramificada", "saturada": "Saturada", "insaturada": "Insaturada", "homogenea": "Homogênea", "heterogenea": "Heterogênea" };
        let marcadas =[];
        for (let key in opMap) {
            if (contem(key)) {
                let radio = document.querySelector(`input[value="${opMap[key]}"]`);
                if(radio) { radio.checked = true; marcadas.push(opMap[key]); }
            }
        }
        if (marcadas.length > 0) { return falarAssistente(`Marcadas: ${marcadas.join(", ")}.`); }
    }

    // Memória de Modos
    if (contextoAssistente === "escolher_submodo_estruturando") {
        if (contem("livre")) { contextoAssistente = null; return executarIntencaoDaAssistente({acao: "JOGAR_ESTRUTURANDO", detalhe: "livre"}); }
        if (contem("facil", "fácil")) { contextoAssistente = null; return executarIntencaoDaAssistente({acao: "JOGAR_ESTRUTURANDO", detalhe: "facil"}); }
        if (contem("medio", "media", "médio")) { contextoAssistente = null; return executarIntencaoDaAssistente({acao: "JOGAR_ESTRUTURANDO", detalhe: "medio"}); }
        if (contem("dificil", "difícil")) { contextoAssistente = null; return executarIntencaoDaAssistente({acao: "JOGAR_ESTRUTURANDO", detalhe: "dificil"}); }
        if (contem("impossivel", "impossível")) { contextoAssistente = null; return executarIntencaoDaAssistente({acao: "JOGAR_ESTRUTURANDO", detalhe: "impossivel"}); }
        if (contem("cancelar", "esquece", "sair")) { contextoAssistente = null; return falarAssistente("Tudo bem, modo cancelado."); }
    }
    if (contextoAssistente === "escolher_modo_inclusivo") {
        if (contem("reconhecer")) { contextoAssistente = null; return executarIntencaoDaAssistente({acao: "JOGAR_INCLUSIVO", detalhe: "reconhecer"}); }
        if (contem("relacionar")) { contextoAssistente = null; return executarIntencaoDaAssistente({acao: "JOGAR_INCLUSIVO", detalhe: "relacionar"}); }
        if (contem("interpretar")) { contextoAssistente = null; return executarIntencaoDaAssistente({acao: "JOGAR_INCLUSIVO", detalhe: "interpretar"}); }
        if (contem("cancelar", "esquece", "sair")) { contextoAssistente = null; return falarAssistente("Tudo bem, modo cancelado."); }
    }

    let ativadorRegex = /^(adomines|a dominis|a domines|adominis|as dominis|aldomines|o dominis|ad homens|aos dominis|adomini|adomin|domines|dominis)\b/i;
    if (ativadorRegex.test(comando)) {
        let pergunta = comandoOriginal.replace(/^(Ad[ôo]mines|A dominis|A domines|Adominis|As dominis|Aldomines|O dominis|Ad homens|Aos dominis|Adomini|Adomin|Domines|Dominis)\s*/i, "").trim(); 
        if (pergunta.length > 2) {
            if(typeof abrirQuimiChat === "function") abrirQuimiChat(); 
            if(typeof enviarPerguntaQuimiChat === "function") enviarPerguntaQuimiChat(pergunta, true); 
        } else {
            falarAssistente("Estou ouvindo. Pode fazer sua pergunta de química.");
        }
        return;
    }

    if (contem("numero atomico", "massa", "peso", "ligacoes", "valencia") && typeof elementosTabela !== 'undefined') {
        let elementoEncontrado = elementosTabela.find(el => comando.includes(normalizar(el.nome)));
        if (elementoEncontrado) {
            if (contem("numero atomico", "atomico", "protons")) { return falarAssistente(`O número atômico do ${elementoEncontrado.nome} é ${elementoEncontrado.n}.`); } 
            else if (contem("massa", "peso")) { return falarAssistente(`A massa atômica do ${elementoEncontrado.nome} é ${elementoEncontrado.m}.`); } 
            else { return falarAssistente(`Seguindo a regra geral, o ${elementoEncontrado.nome} faz ${elementoEncontrado.l} ligações.`); }
        }
    }

    if (contem("cancelar", "esquece", "deixa pra la")) { falarAssistente("Tudo bem, cancelando."); return; }
    
    // Verificações Visuais e Status
    if (contem("verificar", "checar", "terminei") && contem("estrutura", "molecula", "fase", "quadro")) return executarIntencaoDaAssistente({acao: "VERIFICAR_ESTRUTURA"});
    if (contem("quanto tempo", "tempo restante", "tempo falta", "relogio", "cronometro")) return executarIntencaoDaAssistente({acao: "STATUS_TEMPO"});
    if (contem("quantas vidas", "minhas vidas", "coracoes", "vida tenho", "vidas restam")) return executarIntencaoDaAssistente({acao: "STATUS_VIDAS"});
    if (contem("quantas estrelas", "minhas estrelas", "estrelas tenho")) return executarIntencaoDaAssistente({acao: "STATUS_ESTRELAS"});

    if (contem("desmutar", "com som", "ligar som", "ativar som", "voltar som")) return executarIntencaoDaAssistente({acao: "DESMUTAR_SOM"});
    if (contem("mutar", "mudo", "tirar som", "silencio", "sem som", "desligar som")) return executarIntencaoDaAssistente({acao: "MUTAR_SOM"});
    if (contem("abaixar", "diminuir", "reduzir") && contem("musica", "som", "volume")) return executarIntencaoDaAssistente({acao: "DIMINUIR_MUSICA"});
    if (contem("abaixar", "diminuir", "reduzir") && contem("efeito")) return executarIntencaoDaAssistente({acao: "DIMINUIR_EFEITOS"});
    if (contem("desligar", "tirar", "desativar") && contem("efeito", "visuais", "visual")) return executarIntencaoDaAssistente({acao: "DESLIGAR_VISUAIS"});
    if (contem("ligar", "colocar", "ativar") && contem("efeito", "visuais", "visual")) return executarIntencaoDaAssistente({acao: "LIGAR_VISUAIS"});
    if (contem("modo claro", "tema claro", "dia")) return executarIntencaoDaAssistente({acao: "TEMA_CLARO"});
    if (contem("modo escuro", "tema escuro", "noturno")) return executarIntencaoDaAssistente({acao: "TEMA_ESCURO"});
    if (contem("voltar", "retornar", "tela anterior")) return executarIntencaoDaAssistente({acao: "VOLTAR"});
    if (contem("desligar", "parar") && contem("assistente")) return executarIntencaoDaAssistente({acao: "DESLIGAR_ASSISTENTE"});
    
    if (contem("configuracoes", "configuracao", "ajustes")) return executarIntencaoDaAssistente({acao: "ABRIR_CONFIG"});
    if (contem("tabela periodica", "tabela", "elementos")) return executarIntencaoDaAssistente({acao: "ABRIR_TABELA"});
    if (contem("conquistas", "trofeus")) return executarIntencaoDaAssistente({acao: "ABRIR_CONQUISTAS"});
    if (contem("quimichat", "chat")) return executarIntencaoDaAssistente({acao: "ABRIR_CHAT"});
    
    if (contem("ler", "leia") && contem("tela", "tudo")) return executarIntencaoDaAssistente({acao: "LER_TELA"});
    if (contem("ler", "leia") && contem("enunciado", "pergunta", "questao", "tarefa", "fazer")) return executarIntencaoDaAssistente({acao: "LER_ENUNCIADO"});
    if (contem("ler", "leia") && contem("alternativa", "item", "opcoes")) return executarIntencaoDaAssistente({acao: "LER_ALTERNATIVAS"});
    if (contem("ler", "leia") && contem("tutorial")) return executarIntencaoDaAssistente({acao: "LER_TUTORIAL"});
    
    if (contem("estruturando")) {
        let det = "";
        if (contem("livre")) det = "livre";
        else if (contem("facil")) det = "facil";
        else if (contem("medio", "media")) det = "medio";
        else if (contem("dificil")) det = "dificil";
        else if (contem("impossivel")) det = "impossivel";
        else det = "perguntar";
        return executarIntencaoDaAssistente({acao: "JOGAR_ESTRUTURANDO", detalhe: det});
    }

    if (contem("inclusivo", "inclusao")) {
        let det = "";
        if (contem("reconhecer")) det = "reconhecer";
        else if (contem("relacionar")) det = "relacionar";
        else if (contem("interpretar")) det = "interpretar";
        else det = "perguntar";
        return executarIntencaoDaAssistente({acao: "JOGAR_INCLUSIVO", detalhe: det});
    }

    if (comando === "iniciar" || comando === "entrar" || comando === "jogar" || contem("iniciar jogo", "entrar no jogo", "jogar", "bora", "vamos", "start")) {
        return executarIntencaoDaAssistente({acao: "IR_MODOS"});
    }

    try {
        const respostaApi = await fetch(`/api/assistente`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fraseJogador: comandoOriginal })
        });

        if (!respostaApi.ok) throw new Error("Falha na comunicação com o cérebro.");

        const intencao = await respostaApi.json();
        executarIntencaoDaAssistente(intencao);

    } catch (erro) {
        console.error("Erro na API Assistente:", erro);
        falarAssistente("Não entendi muito bem. Pode falar de outra forma?");
    }
}

function executarIntencaoDaAssistente(intencao) {
    let acao = intencao.acao || intencao.ação || intencao.Acao || intencao.Ação || "DESCONHECIDO";
    acao = acao.toUpperCase(); 
    
    let detalhe = intencao.detalhe || intencao.Detalhe || "";
    detalhe = detalhe.toLowerCase(); 

    console.log("🤖 INTENÇÃO IDENTIFICADA -> AÇÃO:", acao, "| DETALHE:", detalhe);

    switch (acao) {
        case "DIMINUIR_MUSICA": if(typeof volumeMusica === "function") volumeMusica((musica ? musica.volume : 1) - 0.2); falarAssistente("Volume da música reduzido."); break;
        case "DIMINUIR_EFEITOS": if(typeof volumeEfeitos === "function") volumeEfeitos((clickAudio ? clickAudio.volume : 1) - 0.2); falarAssistente("Volume dos efeitos reduzido."); break;
        case "DESLIGAR_VISUAIS": if(typeof toggleEfeitos === "function") toggleEfeitos("desativar"); falarAssistente("Efeitos visuais desativados."); break;
        case "LIGAR_VISUAIS": if(typeof toggleEfeitos === "function") toggleEfeitos("ativar"); falarAssistente("Efeitos visuais ativados."); break;
        case "TEMA_CLARO": if (document.body.classList.contains("dark") && typeof toggleModo === "function") toggleModo("claro"); falarAssistente("Modo claro ativado."); break;
        case "TEMA_ESCURO": if (!document.body.classList.contains("dark") && typeof toggleModo === "function") toggleModo("escuro"); falarAssistente("Modo escuro ativado."); break;
        case "MUTAR_SOM": if (typeof mutado !== 'undefined' && !mutado && typeof toggleMute === "function") toggleMute("mutar"); falarAssistente("Som silenciado."); break;
        case "DESMUTAR_SOM": if (typeof mutado !== 'undefined' && mutado && typeof toggleMute === "function") toggleMute("desmutar"); falarAssistente("Som ativado."); break;
        case "IR_MODOS": let u = window.location.pathname; if (!u.includes('modos') && !u.includes('estruturando') && !u.includes('inclusao')) { falarAssistente("Indo para o menu de modos."); if(typeof mudarTela==="function") mudarTela('modos.html'); } else falarAssistente("Você já está na área de modos."); break;
        case "IR_TUTORIAL": falarAssistente("Indo para o tutorial."); if (typeof mudarTela === "function") mudarTela('tutorial.html'); break;
        case "VOLTAR": falarAssistente("Voltando."); if (window.history.length > 1 && document.referrer.includes(window.location.host)) { window.history.back(); } else if(typeof mudarTela==="function") mudarTela('index.html'); break;
        case "ABRIR_TABELA": falarAssistente("Abrindo a Tabela Periódica."); if(typeof abrirTabelaPeriodica === "function") abrirTabelaPeriodica(); break;
        case "ABRIR_CONFIG": falarAssistente("Abrindo menu de configurações."); if(typeof toggleMenu === "function") toggleMenu(); break;
        case "ABRIR_CONQUISTAS": falarAssistente("Abrindo o painel de Conquistas."); if(typeof abrirConquistas === "function") abrirConquistas(); break;
        case "ABRIR_CHAT": falarAssistente("Abrindo o QuimiChat."); if(typeof abrirQuimiChat === "function") abrirQuimiChat(); break;
        case "ABRIR_ADM": falarAssistente("Abrindo o painel de administrador."); if(typeof abrirChat === "function") abrirChat(); break;
        
        case "STATUS_VIDAS":
            if (typeof vidasRestantes !== 'undefined') { falarAssistente(`Você tem ${vidasRestantes} corações restantes.`); } 
            else { falarAssistente("Para ver suas vidas, olhe para os ícones de coração na tela."); } break;
            
        case "STATUS_ESTRELAS":
            if (typeof estrelasGanhas !== 'undefined') { falarAssistente(`Você já conseguiu ${estrelasGanhas} estrelas.`); } 
            else falarAssistente("Sua quantidade de estrelas está no painel de pontuação no canto da tela."); break;

        case "STATUS_TEMPO":
            if (typeof tempoRestante !== "undefined" && typeof intervaloCronometro !== "undefined" && intervaloCronometro !== null) {
                let m = Math.floor(tempoRestante / 60); let s = tempoRestante % 60;
                falarAssistente(`Faltam ${m} minuto${m!==1?'s':''} e ${s} segundo${s!==1?'s':''}.`);
            } else { falarAssistente("Não há tempo correndo no momento."); } break;

        case "LER_TELA": lerTelaInteira(); break;
        case "LER_ENUNCIADO":
            { 
              let seletores =[".hud-pergunta", "#nome-desafio-atual", ".enunciado", "#enunciado", ".sugestao", "#sugestao", ".descricao", "#descricao", "#nome-molecula", ".comando-fase", "h2", "h3"];
              let encontrou = false;
              for (let sel of seletores) { let el = document.querySelector(sel); if (el && el.innerText.trim().length > 0) { falarAssistente("Na tela está escrito: " + el.innerText); encontrou = true; break; } }
              if (!encontrou) falarAssistente("Não consegui identificar a tarefa principal nesta tela.");
            } break;
        case "LER_ALTERNATIVAS":
            { let items =["item-a", "item-b", "item-c", "item-d"]; let lidos = 0; items.forEach(id => { let e = document.getElementById(id) || document.querySelector("."+id); if(e) { falarAssistente(e.innerText); lidos++; } }); if(lidos===0) falarAssistente("Não encontrei alternativas aqui."); } break;
        case "LER_TUTORIAL":
            { let els = document.querySelectorAll(".tutorial-conteudo, #tutorial, .tutorial, .texto-tutorial"); if(els.length > 0) { falarAssistente(Array.from(els).map(e => e.innerText).join(". ")); } else falarAssistente("Não achei o tutorial na tela."); } break;
        case "DESLIGAR_ASSISTENTE": toggleAssistenteVoz(); break;
        case "STATUS_TROFEUS":
        case "STATUS_CONQUISTAS":
            { let concluidas = JSON.parse(localStorage.getItem("conquistasDesbloqueadas")) ||[]; if (detalhe === "ganhas") falarAssistente(`Você já desbloqueou ${concluidas.length} conquistas.`); else if (detalhe === "faltam") falarAssistente(`Faltam ${7 - concluidas.length} conquistas para você platinar.`); else falarAssistente(`Você já tem ${concluidas.length} de 7 conquistas.`); } break;
        case "STATUS_CATALOGO":
            { let cat = JSON.parse(localStorage.getItem("catalogoDesbloqueado")) ||[]; if (detalhe === "faltam") falarAssistente(`Faltam ${20 - cat.length} moléculas.`); else { if (cat.length === 0) falarAssistente("Você não catalogou nenhuma molécula."); else falarAssistente(`Você catalogou ${cat.length} moléculas.`); } } break;
        
        case "JOGAR_ESTRUTURANDO":
            if (detalhe === "perguntar" || detalhe === "") { contextoAssistente = "escolher_submodo_estruturando"; falarAssistente("Você quer jogar o modo Livre ou o modo Desafio?"); }
            else if (detalhe === "livre") { contextoAssistente = null; falarAssistente("Entrando no modo estruturando livre."); localStorage.setItem("modoAtual", "livre"); if(typeof mudarTela==="function") mudarTela('estruturando.html'); }
            else { contextoAssistente = null; falarAssistente(`Iniciando o desafio nível ${detalhe}. Boa sorte!`); localStorage.setItem("modoAtual", "desafio"); localStorage.setItem("nivel", detalhe); if(typeof mudarTela==="function") mudarTela('estruturando.html'); } break;
        case "JOGAR_INCLUSIVO":
            if (detalhe === "perguntar" || detalhe === "") { contextoAssistente = "escolher_modo_inclusivo"; falarAssistente("Entrar em qual nível inclusivo? Reconhecer, Relacionar ou Interpretar?"); }
            else { contextoAssistente = null; falarAssistente(`Entrando no modo inclusivo, nível ${detalhe}.`); localStorage.setItem("modoAtual", `inclusao-${detalhe}`); if(typeof mudarTela==="function") mudarTela('inclusao.html'); } break;

        // ==========================================
        // 🧪 CONTROLES DE CONSTRUÇÃO POR VOZ E DESAFIOS
        // ==========================================
        case "VERIFICAR_ESTRUTURA":
            if(typeof verificarMoleculaDesafio === "function") { falarAssistente("Verificando..."); verificarMoleculaDesafio(); } else falarAssistente("Não há estrutura para verificar aqui."); break;
            
        case "MARCAR_CLASSIFICACAO":
            let opMap = { "aberta": "Aberta", "fechada": "Fechada", "normal": "Normal", "ramificada": "Ramificada", "saturada": "Saturada", "insaturada": "Insaturada", "homogenea": "Homogênea", "heterogenea": "Heterogênea" };
            let valorReal = opMap[normalizar(detalhe)];
            if(valorReal) {
                let radio = document.querySelector(`input[value="${valorReal}"]`);
                if(radio) { radio.checked = true; falarAssistente(`${valorReal} marcada.`); }
            } else { falarAssistente(`Não encontrei a opção ${detalhe}.`); }
            break;

        case "CONFIRMAR_CLASSIFICACAO":
            if(typeof verificarClassificacao === "function") { falarAssistente("Confirmando opções..."); verificarClassificacao(); } break;

        case "CRIAR_ATOMO":
            adicionarAtomoVoz(detalhe); break;
            
        case "LIGAR_ATOMOS":
            let partes = detalhe.split("|");
            if(partes.length >= 2) ligarAtomosVoz(partes[0].trim(), partes[1].trim(), (partes[2] || "simples").trim());
            else falarAssistente("Não consegui entender quais átomos você quer ligar. Diga algo como: Ligue o Carbono 1 ao Oxigênio 1.");
            break;
            
        case "COMPLETAR_VALENCIA":
            acaoPecaVoz(detalhe, "completar"); break;
            
        case "DESVINCULAR_PECA":
            acaoPecaVoz(detalhe, "desvincular"); break;
            
        case "EXCLUIR_PECA":
            acaoPecaVoz(detalhe, "excluir"); break;
            
        case "LIMPAR_QUADRO":
            if(typeof limparQuadro === "function") { limparQuadro(); falarAssistente("Quadro limpo."); } else falarAssistente("Você não está no quadro."); break;
            
        case "LER_QUADRO":
            lerQuadroVoz(); break;

        case "COMANDO_ADM":
            let inputAdm = document.getElementById("chat-input"); if (inputAdm) { inputAdm.value = detalhe.startsWith("\\") ? detalhe : "\\" + detalhe; if(typeof processarChat==="function") processarChat({ key: 'Enter' }); falarAssistente(`Acionando código de administrador: ${detalhe}`); } else falarAssistente("Você precisa abrir o painel ADM primeiro."); break;
            
        case "DESCONHECIDO":
        default:
            falarAssistente("Não entendi muito bem o que você quis dizer. Pode repetir?");
            break;
    }
}

// ==========================================
// 🛠️ FUNÇÕES INTERNAS DE ACESSIBILIDADE DO QUADRO
// ==========================================

function obterNomeElemento(siglaOuNome) {
    let termo = normalizar(siglaOuNome);
    if(typeof elementosTabela !== "undefined") {
        let el = elementosTabela.find(e => normalizar(e.s) === termo || normalizar(e.nome) === termo);
        if(el) return { sigla: el.s, nome: el.nome };
    }
    const m = { "c":"Carbono", "o":"Oxigênio", "h":"Hidrogênio", "n":"Nitrogênio", "s":"Enxofre", "p":"Fósforo", "cl":"Cloro", "f":"Flúor", "br":"Bromo", "i":"Iodo" };
    if(m[siglaOuNome.toLowerCase()]) return { sigla: siglaOuNome.toUpperCase(), nome: m[siglaOuNome.toLowerCase()] };
    return { sigla: siglaOuNome, nome: siglaOuNome };
}

function atualizarTagsDeVoz() {
    let quadroInner = document.getElementById("quadro-inner");
    if(!quadroInner) return;

    let atomosNoQuadro = Array.from(quadroInner.querySelectorAll('.peca-draggable.atomo'));
    let contagens = {};

    atomosNoQuadro.forEach(atomo => {
        let info = obterNomeElemento(atomo.dataset.sigla);
        let nomeBase = info.nome;

        if (!atomo.dataset.idVoz) {
            contagens[nomeBase] = (contagens[nomeBase] || 0) + 1;
            let idVoz = `${nomeBase} ${contagens[nomeBase]}`;
            atomo.dataset.idVoz = idVoz;

            let span = document.createElement("div");
            span.className = "voz-tag";
            span.style.cssText = "position:absolute; top:-10px; right:-10px; background:#1e293b; color:white; border-radius:50%; width:18px; height:18px; font-size:10px; display:flex; justify-content:center; align-items:center; z-index:99; box-shadow:0 0 5px rgba(0,0,0,0.5);";
            span.innerText = contagens[nomeBase];
            atomo.appendChild(span);
        } else {
            let n = parseInt(atomo.dataset.idVoz.replace(/\D/g, ''));
            if(n > (contagens[nomeBase] || 0)) contagens[nomeBase] = n;
        }
    });
}

function encontrarPecaVoz(nomeDitado) {
    let quadroInner = document.getElementById("quadro-inner");
    if(!quadroInner) return null;
    
    let nomeProcurado = normalizar(nomeDitado);
    if(!nomeProcurado.match(/\d+/)) nomeProcurado += " 1"; 

    let atomos = Array.from(quadroInner.querySelectorAll('.peca-draggable.atomo'));
    return atomos.find(a => normalizar(a.dataset.idVoz || "") === nomeProcurado);
}

function adicionarAtomoVoz(nomeDitado) {
    let quadroInner = document.getElementById("quadro-inner");
    let listaAtomos = document.getElementById("lista-atomos");
    if(!quadroInner || !listaAtomos) return falarAssistente("Você precisa estar no modo Estruturando para adicionar peças.");

    let info = obterNomeElemento(nomeDitado);
    let atomoBase = Array.from(listaAtomos.querySelectorAll('.atomo')).find(a => a.dataset.sigla.toLowerCase() === info.sigla.toLowerCase());
    
    if(!atomoBase) return falarAssistente(`Desculpe, o átomo de ${info.nome} não está disponível nas peças desta fase.`);

    let novo = atomoBase.cloneNode(true);
    novo.classList.add("no-quadro");
    novo.dataset.id = Date.now();
    novo.dataset.recemCriada = "true";
    novo.style.position = "absolute";
    novo.style.zIndex = 10;
    
    let qRect = quadroInner.getBoundingClientRect();
    let offset = Math.floor(Math.random() * 40) - 20;
    novo.style.left = (qRect.width/2 - 20 + offset) + "px";
    novo.style.top = (qRect.height/2 - 20 + offset) + "px";
    
    quadroInner.appendChild(novo);
    atualizarTagsDeVoz();
    
    if(typeof verificarLigacoesQuimicas === "function") verificarLigacoesQuimicas();
    if(typeof atualizarContadores === "function") atualizarContadores();

    falarAssistente(`Adicionei o ${novo.dataset.idVoz} no quadro para você.`);
}

function ligarAtomosVoz(nomeA, nomeB, tipoLigacao) {
    let pA = encontrarPecaVoz(nomeA);
    let pB = encontrarPecaVoz(nomeB);
    
    if(!pA || !pB) return falarAssistente("Não encontrei um desses átomos no quadro. Diga o nome e o número exato, como Carbono 1.");
    if(pA === pB) return falarAssistente("Você não pode ligar um átomo nele mesmo.");

    let classeLig = "lig-simples"; let valLig = 1; let htmlLinhas = '<div class="linha"></div>';
    if(tipoLigacao.includes("dupla")) { classeLig = "lig-dupla"; valLig = 2; htmlLinhas = '<div class="linha"></div><div class="linha"></div>'; }
    if(tipoLigacao.includes("tripla")) { classeLig = "lig-tripla"; valLig = 3; htmlLinhas = '<div class="linha"></div><div class="linha"></div><div class="linha"></div>'; }

    let lig = document.createElement("div");
    lig.className = `peca-draggable ligacao ${classeLig} no-quadro`;
    lig.dataset.tipo = "ligacao";
    lig.dataset.val = valLig;
    lig.dataset.id = Date.now();
    lig.style.position = "absolute";
    lig.style.zIndex = 9;
    
    // O FIX MÁGICO: Agora a ligação ganha os tracinhos físicos para aparecer na tela!
    lig.innerHTML = htmlLinhas;

    let xA = parseFloat(pA.style.left) || 0;
    let yA = parseFloat(pA.style.top) || 0;
    
    lig.style.left = (xA + 40) + "px";
    lig.style.top = (yA + 10) + "px";
    
    pB.style.left = (xA + 80) + "px";
    pB.style.top = yA + "px";

    document.getElementById("quadro-inner").appendChild(lig);

    if(typeof verificarLigacoesQuimicas === "function") verificarLigacoesQuimicas();
    if(typeof atualizarContadores === "function") atualizarContadores();

    falarAssistente(`Pronto. Liguei o ${pA.dataset.idVoz} ao ${pB.dataset.idVoz} com uma ligação ${tipoLigacao}.`);
}

function acaoPecaVoz(nomeDitado, acao) {
    let peca = encontrarPecaVoz(nomeDitado);
    if(!peca) return falarAssistente(`Não achei a peça ${nomeDitado} no quadro.`);

    window.pecaAlvoMenu = peca; 

    if (acao === "completar") {
        if(typeof window.cmCompletar === "function") window.cmCompletar();
        falarAssistente(`Valência do ${peca.dataset.idVoz} completada com Hidrogênios.`);
    } 
    else if (acao === "excluir") {
        let nomeBackup = peca.dataset.idVoz;
        if(typeof window.cmExcluir === "function") window.cmExcluir();
        falarAssistente(`O ${nomeBackup} foi excluído do quadro.`);
    }
    else if (acao === "desvincular") {
        if(typeof window.cmDesvincular === "function") window.cmDesvincular();
        falarAssistente(`O ${peca.dataset.idVoz} foi desvinculado e separado da estrutura.`);
    }
    
    window.pecaAlvoMenu = null; 
}

function lerQuadroVoz() {
    let quadroInner = document.getElementById("quadro-inner");
    if(!quadroInner) return falarAssistente("Não estamos no modo de construção.");

    let atomos = Array.from(quadroInner.querySelectorAll('.peca-draggable.atomo'));
    if(atomos.length === 0) return falarAssistente("O quadro branco está totalmente vazio.");

    let leitura = `Você tem ${atomos.length} átomos no quadro. `;
    
    atomos.forEach(a => {
        let nome = a.dataset.idVoz;
        let hid = parseInt(a.dataset.hExtras || 0);
        let status = "";
        
        if (a.classList.contains("atomo-erro")) status = "Atenção: A valência dele está excedida e errada!";
        else if (a.classList.contains("atomo-sucesso")) status = "A valência dele está completa e correta.";
        else status = "A valência dele ainda está incompleta.";

        let textoHid = hid > 0 ? `Ele está completado com ${hid} hidrogênio${hid>1?'s':''}.` : "";
        let textoLigado = a.dataset.grupo ? "Ele está conectado à molécula principal." : "Ele está solto no quadro.";

        leitura += `${nome}: ${textoLigado} ${textoHid} ${status} `;
    });

    falarAssistente(leitura);
}