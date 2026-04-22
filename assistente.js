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
    vozAssistente = vozes.find(v => v.lang.includes('pt-BR') && (v.name.includes('Online') || v.name.includes('Google') || v.name.includes('Neural') || v.name.includes('Feminina')));
    if(!vozAssistente) { vozAssistente = vozes.find(v => v.lang.includes('pt-BR')); }
}
if (speechSynthesis.onvoiceschanged !== undefined) { speechSynthesis.onvoiceschanged = carregarVozes; }

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    assistenteReconhecimento = new SpeechRecognition();
    assistenteReconhecimento.lang = 'pt-BR';
    assistenteReconhecimento.continuous = true; 
    assistenteReconhecimento.interimResults = false;

    assistenteReconhecimento.onstart = function() {
        assistenteAtivo = true;
        localStorage.setItem("assistenteAtivo", "true");
        let btn = document.getElementById("btnAssistente");
        if(btn) btn.classList.add("mic-ouvindo");
    };

    assistenteReconhecimento.onresult = function(event) {
        if(typeof isNavegando !== 'undefined' && isNavegando) return;
        let comando = event.results[event.results.length - 1][0].transcript.trim();
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
        if (assistenteAtivo && !(typeof isNavegando !== 'undefined' && isNavegando) && !assistenteSintese.speaking) {
            try { assistenteReconhecimento.start(); } catch(e){}
        } else {
            let btn = document.getElementById("btnAssistente"); if(btn) btn.classList.remove("mic-ouvindo");
        }
    };
}

assistenteSintese.onstart = function() { if(assistenteReconhecimento) assistenteReconhecimento.stop(); }
assistenteSintese.onend = function() { if(assistenteAtivo && !(typeof isNavegando !== 'undefined' && isNavegando)) { try { assistenteReconhecimento.start(); } catch(e){} } }

window.falarAssistente = function(texto) {
    if(assistenteSintese.speaking) assistenteSintese.cancel(); 
    if(!vozAssistente) carregarVozes();
    let fala = new SpeechSynthesisUtterance(texto);
    fala.lang = "pt-BR";
    if(vozAssistente) fala.voice = vozAssistente;
    fala.rate = 1.0; fala.pitch = 1.2; 
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
        assistenteAtivo = false; contextoAssistente = null; localStorage.setItem("assistenteAtivo", "false"); assistenteReconhecimento.stop();
        if(!silencioso) { falarAssistente("Assistente desativada."); }
    } else {
        try {
            assistenteAtivo = true; contextoAssistente = null; localStorage.setItem("assistenteAtivo", "true"); assistenteReconhecimento.start();
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
    let elementos = document.querySelectorAll("h1, h2, h3, p:not(.escondido), .descricao, .sugestao, .enunciado");
    elementos.forEach(el => {
        if(el.offsetParent !== null && el.innerText.trim().length > 0) { textos.push(el.innerText); }
    });
    if(textos.length > 0) { falarAssistente("Na tela diz o seguinte: " + textos.join(". ")); } 
    else { falarAssistente("Não encontrei nenhum texto principal nesta tela para ler."); }
}

async function processarComandoVoz(comandoOriginal) {
    let comando = normalizar(comandoOriginal.replace(/[.,!?]/g, "").trim());
    
    if (comando.length < 2) return; 

    const contem = (...palavras) => palavras.some(p => comando.includes(normalizar(p)));

    // Checagem de Memória de Fases
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

    // QuimiChat
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

    // Tabela Periódica (Curiosidades)
    if (contem("numero atomico", "massa", "peso", "ligacoes", "valencia") && typeof elementosTabela !== 'undefined') {
        let elementoEncontrado = elementosTabela.find(el => comando.includes(normalizar(el.nome)));
        if (elementoEncontrado) {
            if (contem("numero atomico", "atomico", "protons")) { return falarAssistente(`O número atômico do ${elementoEncontrado.nome} é ${elementoEncontrado.n}.`); } 
            else if (contem("massa", "peso")) { return falarAssistente(`A massa atômica do ${elementoEncontrado.nome} é ${elementoEncontrado.m}.`); } 
            else { return falarAssistente(`Seguindo a regra geral, o ${elementoEncontrado.nome} faz ${elementoEncontrado.l} ligações.`); }
        }
    }

    // Peneira Local de Comandos Padrão
    if (contem("cancelar", "esquece", "deixa pra la")) { falarAssistente("Tudo bem, cancelando."); return; }
    
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
    
    if (contem("quantas vidas", "minhas vidas", "coracoes", "vida tenho")) return executarIntencaoDaAssistente({acao: "STATUS_VIDAS"});
    if (contem("quantas estrelas", "minhas estrelas", "estrelas tenho")) return executarIntencaoDaAssistente({acao: "STATUS_ESTRELAS"});

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

    // MANDAR PARA O CÉREBRO (Para montar Moléculas ou Gírias)
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

// ==========================================
// EXECUTOR DE AÇÕES PRINCIPAL
// ==========================================
function executarIntencaoDaAssistente(intencao) {
    let acao = intencao.acao || intencao.ação || intencao.Acao || intencao.Ação || "DESCONHECIDO";
    acao = acao.toUpperCase(); 
    
    let detalhe = intencao.detalhe || intencao.Detalhe || "";
    detalhe = detalhe.toLowerCase(); 

    console.log("🤖 INTENÇÃO IDENTIFICADA -> AÇÃO:", acao, "| DETALHE:", detalhe);

    switch (acao) {
        // ... (Controles básicos) ...
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
        
        // Leituras e Informações
        case "STATUS_VIDAS":
            if (typeof vidas !== 'undefined') { falarAssistente(`Você tem ${vidas} corações restantes.`); } 
            else {
                let coracoes = document.querySelectorAll(".coracao:not(.vazio), .vida:not(.perdida)");
                if (coracoes.length > 0) falarAssistente(`Você tem ${coracoes.length} corações intactos.`);
                else falarAssistente("Para ver suas vidas, olhe para os ícones de coração na tela.");
            } break;
        case "STATUS_ESTRELAS":
            if (typeof estrelas !== 'undefined') { falarAssistente(`Você já conseguiu ${estrelas} estrelas.`); } 
            else falarAssistente("Sua quantidade de estrelas está no painel de pontuação no canto da tela."); break;
        case "LER_TELA": lerTelaInteira(); break;
        case "LER_ENUNCIADO":
            { 
              let seletores =[".enunciado", "#enunciado", ".sugestao", "#sugestao", ".descricao", "#descricao", "#nome-molecula", ".comando-fase", ".hud-pergunta", "h2", "h3"];
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
        
        // Modos de Jogo
        case "JOGAR_ESTRUTURANDO":
            if (detalhe === "perguntar" || detalhe === "") { contextoAssistente = "escolher_submodo_estruturando"; falarAssistente("Você quer jogar o modo Livre ou o modo Desafio?"); }
            else if (detalhe === "livre") { contextoAssistente = null; falarAssistente("Entrando no modo estruturando livre."); localStorage.setItem("modoAtual", "livre"); if(typeof mudarTela==="function") mudarTela('estruturando.html'); }
            else { contextoAssistente = null; falarAssistente(`Iniciando o desafio nível ${detalhe}. Boa sorte!`); localStorage.setItem("modoAtual", "desafio"); localStorage.setItem("nivel", detalhe); if(typeof mudarTela==="function") mudarTela('estruturando.html'); } break;
        case "JOGAR_INCLUSIVO":
            if (detalhe === "perguntar" || detalhe === "") { contextoAssistente = "escolher_modo_inclusivo"; falarAssistente("Entrar em qual nível inclusivo? Reconhecer, Relacionar ou Interpretar?"); }
            else { contextoAssistente = null; falarAssistente(`Entrando no modo inclusivo, nível ${detalhe}.`); localStorage.setItem("modoAtual", `inclusao-${detalhe}`); if(typeof mudarTela==="function") mudarTela('inclusao.html'); } break;

        // ==========================================
        // 🧪 CONTROLES DE CONSTRUÇÃO POR VOZ (O Lego Químico)
        // ==========================================
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
            falarAssistente("Não entendi muito bem. Pode repetir?");
            break;
    }
}

// ==========================================
// 🛠️ FUNÇÕES INTERNAS DE ACESSIBILIDADE DO QUADRO
// ==========================================

// Traduz 'C' para 'Carbono' e vice-versa usando a Tabela
function obterNomeElemento(siglaOuNome) {
    let termo = normalizar(siglaOuNome);
    if(typeof elementosTabela !== "undefined") {
        let el = elementosTabela.find(e => normalizar(e.s) === termo || normalizar(e.nome) === termo);
        if(el) return { sigla: el.s, nome: el.nome };
    }
    // Fallback rápido
    const m = { "c":"Carbono", "o":"Oxigênio", "h":"Hidrogênio", "n":"Nitrogênio", "s":"Enxofre", "p":"Fósforo", "cl":"Cloro", "f":"Flúor", "br":"Bromo", "i":"Iodo" };
    if(m[siglaOuNome.toLowerCase()]) return { sigla: siglaOuNome.toUpperCase(), nome: m[siglaOuNome.toLowerCase()] };
    return { sigla: siglaOuNome, nome: siglaOuNome };
}

// Cria a numeração dos átomos na tela (Carbono 1, Carbono 2)
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

            // Criar tag visual pra quem enxerga pouco
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
    
    // Se a pessoa só falar "Carbono", a gente assume que é o "Carbono 1"
    let nomeProcurado = normalizar(nomeDitado);
    if(!nomeProcurado.match(/\d+/)) nomeProcurado += " 1"; 

    let atomos = Array.from(quadroInner.querySelectorAll('.peca-draggable.atomo'));
    return atomos.find(a => normalizar(a.dataset.idVoz || "") === nomeProcurado);
}

// ADICIONA O ÁTOMO
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
    // Joga meio pro centro com uma pequena folga aleatória pra não cair perfeitamente em cima do outro
    let offset = Math.floor(Math.random() * 40) - 20;
    novo.style.left = (qRect.width/2 - 20 + offset) + "px";
    novo.style.top = (qRect.height/2 - 20 + offset) + "px";
    
    quadroInner.appendChild(novo);
    atualizarTagsDeVoz();
    
    if(typeof verificarLigacoesQuimicas === "function") verificarLigacoesQuimicas();
    if(typeof atualizarContadores === "function") atualizarContadores();

    falarAssistente(`Adicionei o ${novo.dataset.idVoz} no quadro para você.`);
}

// LIGA OS ÁTOMOS
function ligarAtomosVoz(nomeA, nomeB, tipoLigacao) {
    let pA = encontrarPecaVoz(nomeA);
    let pB = encontrarPecaVoz(nomeB);
    
    if(!pA || !pB) return falarAssistente("Não encontrei um desses átomos no quadro. Diga o nome e o número exato, como Carbono 1.");
    if(pA === pB) return falarAssistente("Você não pode ligar um átomo nele mesmo.");

    let classeLig = "lig-simples"; let valLig = 1;
    if(tipoLigacao.includes("dupla")) { classeLig = "lig-dupla"; valLig = 2; }
    if(tipoLigacao.includes("tripla")) { classeLig = "lig-tripla"; valLig = 3; }

    let lig = document.createElement("div");
    lig.className = `peca-draggable ligacao ${classeLig} no-quadro`;
    lig.dataset.tipo = "ligacao";
    lig.dataset.val = valLig;
    lig.dataset.id = Date.now();
    lig.style.position = "absolute";
    lig.style.zIndex = 9;

    let xA = parseFloat(pA.style.left) || 0;
    let yA = parseFloat(pA.style.top) || 0;
    
    // Matemática pura: Coloca a ligação na direita do Atomo A
    lig.style.left = (xA + 40) + "px";
    lig.style.top = (yA + 10) + "px";
    
    // Coloca o Atomo B colado na direita da ligação
    pB.style.left = (xA + 80) + "px";
    pB.style.top = yA + "px";

    document.getElementById("quadro-inner").appendChild(lig);

    if(typeof verificarLigacoesQuimicas === "function") verificarLigacoesQuimicas();
    if(typeof atualizarContadores === "function") atualizarContadores();

    falarAssistente(`Pronto. Liguei o ${pA.dataset.idVoz} ao ${pB.dataset.idVoz} com uma ligação ${tipoLigacao}.`);
}

// AÇÕES DO BOTÃO DIREITO
function acaoPecaVoz(nomeDitado, acao) {
    let peca = encontrarPecaVoz(nomeDitado);
    if(!peca) return falarAssistente(`Não achei a peça ${nomeDitado} no quadro.`);

    // O truque: Nós forçamos o alvo do menu do estruturando.js a ser essa peça
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
    
    window.pecaAlvoMenu = null; // Limpa o alvo fantasma
}

// OLHOS DA ASSISTENTE
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