let musica = document.getElementById("musica");
let clickAudio = document.getElementById("click");
let bubbleAudio = document.getElementById("bubble");
let transicaoAudio = document.getElementById("transicaoSom"); 
let somAplausos = document.getElementById("somAplausos");
let somConquistaGlob = document.getElementById("somConquista"); 

let mutado = false; 
let efeitosVisuaisAtivos = true; 
let musicaIniciada = false;
let isNavegando = false; 
let contextoAssistente = null; 

// ==========================================
// CONFIGURAÇÃO DO QUIMICHAT (IA)
// ==========================================
// ⚠️ AVISO: A sua chave parece ser o ID do Projeto. A chave correta sempre começa com "AIzaSy..."
// Se der erro de conexão, volte no site do Google e copie a Chave de API (API Key) correta.
const API_KEY_GEMINI = "gen-lang-client-0377558002"; 
const MAX_PERGUNTAS = 20;

function gerenciarBateriaQuimiChat() {
    let dados = JSON.parse(localStorage.getItem("quimiChatBateria")) || { dia: new Date().toLocaleDateString(), restantes: MAX_PERGUNTAS };
    if (dados.dia !== new Date().toLocaleDateString()) {
        dados = { dia: new Date().toLocaleDateString(), restantes: MAX_PERGUNTAS };
        localStorage.setItem("quimiChatBateria", JSON.stringify(dados));
    }
    return dados;
}

const listaDeConquistas =[
  { id: "c1", texto: "Complete o nível fácil do modo de jogo estruturando pela primeira vez." },
  { id: "c2", texto: "Complete o nível médio do modo de jogo estruturando pela primeira vez." },
  { id: "c3", texto: "Complete o nível difícil do modo de jogo estruturando pela primeira vez." },
  { id: "c4", texto: "Complete o nível impossível do modo de jogo estruturando pela primeira vez." },
  { id: "c5", texto: "Complete todos os níveis do modo de jogo estruturando pelo menos 5 vezes." },
  { id: "c6", texto: "Conclua o catálogo do modo livre do jogo estruturando." }, 
  { id: "c7", texto: "Complete um nível inclusivo do modo de jogo estruturando." }
];

const nomesCatalogoDemo = [
    "Água", "Gás Carbônico", "Amônia", "Metano", "Monóxido de Carbono", "Ácido Clorídrico", "Cloreto de Sódio", 
    "Etanol", "Ácido Sulfúrico", "Gás Oxigênio", "Gás Nitrogênio", "Gás Hidrogênio", "Ozônio", "Dióxido de Enxofre",
    "Ácido Nítrico", "Benzeno", "Glicose", "Ureia", "Acetona", "Ácido Acético"
];

const enciclopediaMoleculas = {
    "monoxido de carbono": { ligacoes: "No monóxido de carbono, o carbono e o oxigênio compartilham uma ligação tripla, sendo uma delas covalente dativa. Portanto, faz três ligações no total." },
    "agua": { ligacoes: "A água faz duas ligações simples, conectando o oxigênio a dois hidrogênios." },
    "gas carbonico": { ligacoes: "No gás carbônico, o carbono faz quatro ligações, através de duas ligações duplas com os oxigênios." }
};

function carregarConfiguracoes() {
  if (localStorage.getItem("tema") === "escuro") { document.body.classList.add("dark"); let btn = document.getElementById("temaBtn"); if(btn) btn.innerText = "☀️"; }
  if (localStorage.getItem("mutado") === "true") { mutado = true; musica.muted = true; let btn = document.getElementById("muteBtn"); if(btn) btn.innerText = "🔇"; }
  
  let volMusica = localStorage.getItem("volumeMusica");
  if (volMusica !== null) { musica.volume = parseFloat(volMusica); let rg = document.getElementById("rangeMusica"); if(rg) rg.value = volMusica; }
  
  let volEfeitos = localStorage.getItem("volumeEfeitos");
  if (volEfeitos !== null) { clickAudio.volume = parseFloat(volEfeitos); bubbleAudio.volume = parseFloat(volEfeitos); let rg = document.getElementById("rangeEfeitos"); if(rg) rg.value = volEfeitos; }

  if (localStorage.getItem("efeitosVisuais") === "false") { efeitosVisuaisAtivos = false; let chk = document.getElementById("checkEfeitos"); if(chk) chk.checked = true; aplicarEfeitosNaLogo(false); }

  let tempoSalvo = localStorage.getItem("tempoMusica");
  let estavaTocando = localStorage.getItem("musicaTocando"); 
  if (tempoSalvo !== null) { musica.currentTime = parseFloat(tempoSalvo); }
  
  if (estavaTocando === "true" && !mutado) {
    let p = musica.play();
    if (p !== undefined) { p.then(_ => { musicaIniciada = true; }).catch(e => { console.log("Bloqueio de autoplay."); }); }
  }

  renderizarConquistas();
  renderizarTrofeus();
  gerenciarBateriaQuimiChat(); 
  
  // O setTimeout garante que o HTML carregou antes de tentar injetar os botões
  setTimeout(injetarElementosGlobais, 200); 
  
  if (localStorage.getItem("assistenteAtivo") === "true") {
      setTimeout(() => { assistenteAtivo = false; toggleAssistenteVoz(true); }, 1000); 
  }
}
window.onload = carregarConfiguracoes;

window.addEventListener("beforeunload", () => { 
  localStorage.setItem("tempoMusica", musica.currentTime); 
  localStorage.setItem("musicaTocando", !musica.paused);
});

function mudarTela(url) {
  if (isNavegando) return; 
  isNavegando = true;
  if (assistenteReconhecimento) { assistenteReconhecimento.onend = null; assistenteReconhecimento.stop(); }
  if (transicaoAudio) { transicaoAudio.volume = 1.0; transicaoAudio.currentTime = 0; transicaoAudio.play().catch(()=>{}); }
  document.body.classList.add("saindo");
  localStorage.setItem("tempoMusica", musica.currentTime);
  localStorage.setItem("musicaTocando", !musica.paused);
  setTimeout(() => { window.location.href = url; }, 500);
}

document.addEventListener("click", () => { if (!musicaIniciada && !mutado) { musica.play().catch(()=>{}); musicaIniciada = true; } }, { once: true });
function tocarSomClick() { clickAudio.currentTime = 0; clickAudio.play().catch(()=>{}); }

document.addEventListener("click", (e) => {
  let menu = document.getElementById("menu");
  if (menu && menu.style.display === "block" && !menu.contains(e.target)) { menu.style.display = "none"; }
  if (e.target.closest('button') || e.target.tagName === 'INPUT') return;
  if (!efeitosVisuaisAtivos) return;
  bubbleAudio.currentTime = 0; bubbleAudio.play().catch(()=>{});
  let bolha = document.createElement("div"); bolha.classList.add("bolha");
  bolha.style.left = e.clientX + "px"; bolha.style.top = e.clientY + "px";
  document.body.appendChild(bolha); setTimeout(() => bolha.remove(), 600);
});

function toggleModo(forcarModo = null) { 
    tocarSomClick(); 
    if(forcarModo === "escuro") { document.body.classList.add("dark"); }
    else if(forcarModo === "claro") { document.body.classList.remove("dark"); }
    else { document.body.classList.toggle("dark"); }
    
    let isDark = document.body.classList.contains("dark"); 
    let btn = document.getElementById("temaBtn");
    if(btn) btn.innerText = isDark ? "☀️" : "🌙"; 
    localStorage.setItem("tema", isDark ? "escuro" : "claro"); 
}

function toggleMute(forcarEstado = null) { 
    tocarSomClick(); 
    if(forcarEstado === "mutar") mutado = true;
    else if (forcarEstado === "desmutar") mutado = false;
    else mutado = !mutado;
    
    musica.muted = mutado; 
    if (!mutado && !musicaIniciada) { musica.play(); musicaIniciada = true; } 
    let btn = document.getElementById("muteBtn");
    if(btn) btn.innerText = mutado ? "🔇" : "🔊"; 
    localStorage.setItem("mutado", mutado); 
}

function toggleMenu(event) { if (event) event.stopPropagation(); tocarSomClick(); let menu = document.getElementById("menu"); menu.style.display = (menu.style.display === "block") ? "none" : "block"; }

function volumeMusica(v) { 
    v = Math.max(0, Math.min(1, v)); 
    musica.volume = v; 
    localStorage.setItem("volumeMusica", v); 
    let rg = document.getElementById("rangeMusica"); if(rg) rg.value = v;
}

function volumeEfeitos(v) { 
    v = Math.max(0, Math.min(1, v));
    clickAudio.volume = v; bubbleAudio.volume = v; 
    localStorage.setItem("volumeEfeitos", v); 
    let rg = document.getElementById("rangeEfeitos"); if(rg) rg.value = v;
}

function toggleEfeitos(forcarEstado = null) { 
    if(forcarEstado === "ativar") efeitosVisuaisAtivos = true;
    else if(forcarEstado === "desativar") efeitosVisuaisAtivos = false;
    else if(typeof forcarEstado === "object") efeitosVisuaisAtivos = !forcarEstado.checked; 
    
    localStorage.setItem("efeitosVisuais", efeitosVisuaisAtivos); 
    let chk = document.getElementById("checkEfeitos"); if(chk) chk.checked = !efeitosVisuaisAtivos;
    aplicarEfeitosNaLogo(efeitosVisuaisAtivos); 
}

function aplicarEfeitosNaLogo(ativo) { let logo = document.getElementById("logo"); if (logo) { ativo ? logo.classList.remove("logo-sem-efeito") : logo.classList.add("logo-sem-efeito"); logo.style.animation = ativo ? "flutuar 4s ease-in-out infinite" : "none"; } }

function mostrarMensagemGlob(texto) {
    let toast = document.getElementById("toast-mensagem");
    if(toast) { 
        toast.innerText = texto; 
        toast.classList.remove("escondido"); 
        setTimeout(() => { toast.classList.add("escondido"); }, 5000); 
    }
}

// ==========================================
// ASSISTENTE DE VOZ INTELIGENTE E QUIMICHAT
// ==========================================
let assistenteAtivo = false;
let assistenteReconhecimento = null;
let assistenteSintese = window.speechSynthesis;
let vozAssistente = null;

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
        if(isNavegando) return;
        let comando = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
        mostrarMensagemGlob('🎤 Você: "' + comando + '"');
        processarComandoVoz(comando);
    };

    assistenteReconhecimento.onerror = function(event) {
        if(event.error === 'not-allowed') {
            mostrarMensagemGlob("Permissão do microfone negada.");
            assistenteAtivo = false; localStorage.setItem("assistenteAtivo", "false");
            let btn = document.getElementById("btnAssistente"); if(btn) btn.classList.remove("mic-ouvindo");
        }
    };

    assistenteReconhecimento.onend = function() {
        if (assistenteAtivo && !isNavegando && !assistenteSintese.speaking) {
            try { assistenteReconhecimento.start(); } catch(e){}
        } else {
            let btn = document.getElementById("btnAssistente"); if(btn) btn.classList.remove("mic-ouvindo");
        }
    };
}

assistenteSintese.onstart = function() { if(assistenteReconhecimento) assistenteReconhecimento.stop(); }
assistenteSintese.onend = function() { if(assistenteAtivo && !isNavegando) { try { assistenteReconhecimento.start(); } catch(e){} } }

function falarAssistente(texto) {
    if(assistenteSintese.speaking) assistenteSintese.cancel(); 
    if(!vozAssistente) carregarVozes();
    let fala = new SpeechSynthesisUtterance(texto);
    fala.lang = "pt-BR";
    if(vozAssistente) fala.voice = vozAssistente;
    fala.rate = 1.0; fala.pitch = 1.2; 
    mostrarMensagemGlob('🤖 Adômines: "' + texto + '"');
    assistenteSintese.speak(fala);
}

window.toggleAssistenteVoz = function(silencioso = false) {
    if(!silencioso) tocarSomClick();
    if (!assistenteReconhecimento) {
        mostrarMensagemGlob("Seu navegador não suporta a Assistente.");
        falarAssistente("Desculpe, seu navegador não suporta o assistente de voz."); return;
    }
    if (assistenteAtivo) {
        assistenteAtivo = false; contextoAssistente = null;
        localStorage.setItem("assistenteAtivo", "false"); assistenteReconhecimento.stop();
        if(!silencioso) { falarAssistente("Assistente desativada."); }
    } else {
        try {
            assistenteAtivo = true; contextoAssistente = null;
            localStorage.setItem("assistenteAtivo", "true"); assistenteReconhecimento.start();
            if(!silencioso) { 
                falarAssistente("Assistente ativada. Pode falar! Caso queira fazer alguma pergunta sobre a química é só falar Adômines e logo em seguida fazer a pergunta, mas lembre-se, você tem um limite diário de 20 perguntas."); 
            }
        } catch(e) { }
    }
}

document.addEventListener("keydown", (e) => {
    if(e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
    if (e.code === "Space") { e.preventDefault(); toggleAssistenteVoz(); }
});

const normalizar = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function lerTelaInteira() {
    let textos = [];
    let elementos = document.querySelectorAll("h1, h2, h3, p:not(.escondido), .descricao, .sugestao, .enunciado");
    elementos.forEach(el => {
        if(el.offsetParent !== null && el.innerText.trim().length > 0) { textos.push(el.innerText); }
    });
    if(textos.length > 0) { falarAssistente("Na tela diz o seguinte: " + textos.join(". ")); } 
    else { falarAssistente("Não encontrei nenhum texto principal nesta tela para ler."); }
}

function processarComandoVoz(comandoRaw) {
    let comando = normalizar(comandoRaw.replace(/[.,!?]/g, "").trim());
    const contem = (...palavras) => palavras.some(p => comando.includes(normalizar(p)));

    // ==============================================
    // IA QUIMICHAT (NOVIDADE: Reconhecimento Fonético Expandido)
    // ==============================================
    // A IA do microfone escreve os sons que ouve de várias formas diferentes.
    let ativadorRegex = /^(adomines|a dominis|a domines|adominis|as dominis|aldomines|o dominis|ad homens|aos dominis|adomini|adomin)\b/i;
    
    if (ativadorRegex.test(comando)) {
        // Remove a palavra mágica (independente de como o PC escreveu) e pega só a pergunta
        let perguntaRaw = comandoRaw.replace(/^(Ad[ôo]mines|A dominis|A domines|Adominis|As dominis|Aldomines|O dominis|Ad homens|Aos dominis|Adomini|Adomin)\s*/i, "").trim();
        
        if (perguntaRaw.length > 2) {
            abrirQuimiChat();
            enviarPerguntaQuimiChat(perguntaRaw, true); // O "true" indica que vai ler em voz alta
        } else {
            falarAssistente("Estou ouvindo. Pode fazer sua pergunta de química.");
        }
        return;
    }

    // ==============================================
    // 1. CHECAGEM DE MEMÓRIA/CONTEXTO
    // ==============================================
    if (contem("cancelar", "esquece", "deixa pra la")) {
        if(contextoAssistente) { falarAssistente("Tudo bem, cancelando."); contextoAssistente = null; return; }
    }

    if (contextoAssistente === "escolher_modo_inclusivo") {
        if (contem("reconhecer", "primeiro", "um")) {
            falarAssistente("Entrando no modo inclusivo reconhecer."); contextoAssistente = null;
            localStorage.setItem("modoAtual", "inclusao-reconhecer"); mudarTela('inclusao.html'); return;
        } else if (contem("relacionar", "segundo", "dois")) {
            falarAssistente("Entrando no modo inclusivo relacionar."); contextoAssistente = null;
            localStorage.setItem("modoAtual", "inclusao-relacionar"); mudarTela('inclusao.html'); return;
        } else if (contem("interpretar", "terceiro", "tres")) {
            falarAssistente("Entrando no modo inclusivo interpretar."); contextoAssistente = null;
            localStorage.setItem("modoAtual", "inclusao-interpretar"); mudarTela('inclusao.html'); return;
        } else {
            falarAssistente("Por favor, diga Reconhecer, Relacionar ou Interpretar. Ou diga cancelar."); return;
        }
    }

    if (contextoAssistente === "escolher_submodo_estruturando") {
        if (contem("livre", "modo livre")) {
            falarAssistente("Entrando no modo livre."); contextoAssistente = null;
            localStorage.setItem("modoAtual", "livre"); mudarTela('estruturando.html'); return;
        } else if (contem("desafio", "modo desafio")) {
            falarAssistente("Certo. Qual nível do desafio? Fácil, Médio, Difícil ou Impossível?");
            contextoAssistente = "escolher_nivel_desafio"; return;
        } else {
            falarAssistente("Você quer o modo Livre ou Desafio?"); return;
        }
    }

    if (contextoAssistente === "escolher_nivel_desafio") {
        if (contem("facil")) {
            falarAssistente("Iniciando desafio nível fácil. Boa sorte!"); contextoAssistente = null;
            localStorage.setItem("modoAtual", "desafio"); localStorage.setItem("nivel", "facil"); mudarTela('estruturando.html'); return;
        } else if (contem("medio", "media")) {
            falarAssistente("Iniciando desafio nível médio. Boa sorte!"); contextoAssistente = null;
            localStorage.setItem("modoAtual", "desafio"); localStorage.setItem("nivel", "medio"); mudarTela('estruturando.html'); return;
        } else if (contem("dificil")) {
            falarAssistente("Iniciando desafio nível difícil. Boa sorte!"); contextoAssistente = null;
            localStorage.setItem("modoAtual", "desafio"); localStorage.setItem("nivel", "dificil"); mudarTela('estruturando.html'); return;
        } else if (contem("impossivel")) {
            falarAssistente("Iniciando desafio nível impossível! Se prepare!"); contextoAssistente = null;
            localStorage.setItem("modoAtual", "desafio"); localStorage.setItem("nivel", "impossivel"); mudarTela('estruturando.html'); return;
        } else {
            falarAssistente("Por favor, responda com: Fácil, Médio, Difícil ou Impossível."); return;
        }
    }

    // ==============================================
    // 2. FUNÇÕES GLOBAIS E CONFIGURAÇÕES
    // ==============================================
    if (contem("desativar assistente", "desligar assistente", "parar assistente")) { toggleAssistenteVoz(); return; }
    if (contem("voltar pra tela anterior", "voltar para a tela anterior", "retornar", "voltar tela", "voltar")) { 
        falarAssistente("Voltando.");
        if (window.history.length > 1 && document.referrer.includes(window.location.host)) { window.history.back(); } 
        else { mudarTela('index.html'); }
        return; 
    }
    if (contem("ler o que ta na tela", "ler a tela", "leia a tela", "o que tem na tela", "o que diz na tela")) { lerTelaInteira(); return; }
    if (contem("ativar modo escuro", "colocar modo escuro", "tema escuro", "noturno")) { if(!document.body.classList.contains("dark")) toggleModo("escuro"); falarAssistente("Modo escuro ativado."); return; }
    if (contem("ativar modo claro", "colocar modo claro", "tema claro", "dia", "tirar modo escuro")) { if(document.body.classList.contains("dark")) toggleModo("claro"); falarAssistente("Modo claro ativado."); return; }
    if (contem("tirar musica", "mutar", "silencio", "tirar som", "sem som", "desativar som")) { if(!mutado) toggleMute("mutar"); falarAssistente("Som desativado."); return; }
    if (contem("colocar musica", "desmutar", "audio", "colocar som", "com som", "ativar som", "ligar som")) { if(mutado) toggleMute("desmutar"); falarAssistente("Som ativado."); return; }
    if (contem("abaixar", "diminuir", "reduzir") && contem("volume", "musica", "som")) {
        if(contem("efeito", "efeitos")) { volumeEfeitos(clickAudio.volume - 0.2); falarAssistente("Volume dos efeitos reduzido."); }
        else { volumeMusica(musica.volume - 0.2); falarAssistente("Volume da música reduzido."); }
        return;
    }
    if (contem("aumentar", "subir", "mais") && contem("volume", "musica", "som")) {
        if(contem("efeito", "efeitos")) { volumeEfeitos(clickAudio.volume + 0.2); falarAssistente("Volume dos efeitos aumentado."); }
        else { volumeMusica(musica.volume + 0.2); falarAssistente("Volume da música aumentado."); }
        return;
    }
    if (contem("tirar efeitos visuais", "desativar efeitos visuais", "sem efeitos", "remover efeitos")) { toggleEfeitos("desativar"); falarAssistente("Efeitos visuais desativados."); return; }
    if (contem("colocar efeitos visuais", "ativar efeitos visuais", "ligar efeitos visuais", "com efeitos")) { toggleEfeitos("ativar"); falarAssistente("Efeitos visuais ativados."); return; }

    // ==============================================
    // 3. CONSULTAS SOBRE O JOGO E LEITOR DE FASES
    // ==============================================
    if (contem("quais as conquistas", "minhas conquistas", "trofeus")) {
        let concluidas = JSON.parse(localStorage.getItem("conquistasDesbloqueadas")) || [];
        if (concluidas.length === 0) falarAssistente("Você ainda não desbloqueou nenhuma conquista.");
        else falarAssistente(`Você já desbloqueou ${concluidas.length} conquistas. Abra o painel para ver todas.`);
        return;
    }

    if (contem("quais moleculas", "catalogo", "cataloguei", "modo livre")) {
        let cat = JSON.parse(localStorage.getItem("catalogoDesbloqueado")) || [];
        if (cat.length === 0) falarAssistente("Você ainda não catalogou nenhuma molécula.");
        else {
            let texto = `Você catalogou ${cat.length} moléculas. Algumas são: `;
            for(let i=0; i < Math.min(3, cat.length); i++) { texto += nomesCatalogoDemo[cat[i]-1] + ", "; }
            falarAssistente(texto);
        }
        return;
    }

    if (contem("leia", "ler", "repetir", "o que diz", "qual e o", "qual a")) {
        if (contem("enunciado", "pergunta", "questao", "sugestao", "dica")) { 
            let el = document.getElementById("enunciado") || document.querySelector(".enunciado") || document.getElementById("sugestao") || document.querySelector(".sugestao"); 
            if(el) falarAssistente(el.innerText); else falarAssistente("Não encontrei nenhum enunciado ou sugestão na tela."); return; 
        }
        if (contem("item a", "alternativa a")) { let el = document.getElementById("item-a") || document.querySelector(".item-a"); if(el) falarAssistente(el.innerText); else falarAssistente("Não encontrei alternativa A."); return; }
        if (contem("item b", "alternativa b")) { let el = document.getElementById("item-b") || document.querySelector(".item-b"); if(el) falarAssistente(el.innerText); else falarAssistente("Não encontrei alternativa B."); return; }
        if (contem("item c", "alternativa c")) { let el = document.getElementById("item-c") || document.querySelector(".item-c"); if(el) falarAssistente(el.innerText); else falarAssistente("Não encontrei alternativa C."); return; }
        if (contem("item d", "alternativa d")) { let el = document.getElementById("item-d") || document.querySelector(".item-d"); if(el) falarAssistente(el.innerText); else falarAssistente("Não encontrei alternativa D."); return; }
    }

    // Perguntas Locais (Caso não use o "Adômines" no começo)
    if (contem("numero atomico", "massa", "peso", "ligacoes", "valencia")) {
        let elementoEncontrado = elementosTabela.find(el => comando.includes(normalizar(el.nome)));
        if (elementoEncontrado) {
            if (contem("numero atomico", "atomico", "protons")) { falarAssistente(`O número atômico do ${elementoEncontrado.nome} é ${elementoEncontrado.n}.`); } 
            else if (contem("massa", "peso")) { falarAssistente(`A massa atômica do ${elementoEncontrado.nome} é ${elementoEncontrado.m}.`); } 
            else if (contem("ligacoes", "ligacao", "valencia", "familia")) { falarAssistente(`Seguindo a regra geral, o ${elementoEncontrado.nome} faz ${elementoEncontrado.l} ligações.`); }
            return;
        }
    }

    // ==============================================
    // 4. NAVEGAÇÃO COMPLEXA ENTRE MODOS
    // ==============================================
    if (contem("iniciar", "comecar", "jogar", "bora", "vamos", "entrar no modo", "acessar", "entrar")) {
        if (contem("estruturando") || contem("desafio")) {
            if(contem("facil")) { falarAssistente("Indo para o nível Fácil."); localStorage.setItem("modoAtual", "desafio"); localStorage.setItem("nivel", "facil"); mudarTela('estruturando.html'); return; }
            if(contem("medio")) { falarAssistente("Indo para o nível Médio."); localStorage.setItem("modoAtual", "desafio"); localStorage.setItem("nivel", "medio"); mudarTela('estruturando.html'); return; }
            if(contem("dificil")) { falarAssistente("Indo para o nível Difícil."); localStorage.setItem("modoAtual", "desafio"); localStorage.setItem("nivel", "dificil"); mudarTela('estruturando.html'); return; }
            if(contem("impossivel")) { falarAssistente("Indo para o nível Impossível."); localStorage.setItem("modoAtual", "desafio"); localStorage.setItem("nivel", "impossivel"); mudarTela('estruturando.html'); return; }
        }
        if (contem("estruturando", "classico")) { falarAssistente("Modo Estruturando. Você quer o modo Livre ou o modo Desafio?"); contextoAssistente = "escolher_submodo_estruturando"; return; }
        if (contem("inclusivo", "inclusao", "acessibilidade")) { falarAssistente("Entrar em qual modo inclusivo? Reconhecer, Relacionar ou Interpretar?"); contextoAssistente = "escolher_modo_inclusivo"; return; }
        let urlAtual = window.location.pathname;
        if (!urlAtual.includes('modos.html') && !urlAtual.includes('estruturando') && !urlAtual.includes('inclusao')) {
            falarAssistente("Indo para o menu de modos."); if (typeof iniciar === "function") iniciar(); else mudarTela('modos.html'); return;
        } else {
            falarAssistente("Especifique o modo. Diga: Entrar no modo estruturando, ou Entrar no modo inclusivo."); return;
        }
    }

    if (contem("ajuda", "o que fazer", "opcoes", "socorro")) { 
        falarAssistente("Você pode perguntar algo como: Adômines, o que é a regra do octeto? Ou dar comandos como: Entrar no modo estruturando, Ativar modo escuro, Ler o que está na tela."); 
        return; 
    }
}

// ==========================================
// TROFÉUS E CONQUISTAS GLOBAIS
// ==========================================
function desbloquearConquista(id, silencioso=false) {
    let concluidas = JSON.parse(localStorage.getItem("conquistasDesbloqueadas")) ||[];
    if(!concluidas.includes(id)) {
        concluidas.push(id);
        localStorage.setItem("conquistasDesbloqueadas", JSON.stringify(concluidas));
        if(!silencioso) {
            if(somConquistaGlob) { somConquistaGlob.volume = 1.0; somConquistaGlob.currentTime = 0; somConquistaGlob.play().catch(()=>{}); }
            let c = listaDeConquistas.find(x => x.id === id);
            mostrarMensagemGlob(`🏆 CONQUISTA DESBLOQUEADA:\n${c.texto}`);
        }
        renderizarConquistas();
        verificarPlatina();
    }
}

function verificarPlatina() {
    let concluidas = JSON.parse(localStorage.getItem("conquistasDesbloqueadas")) ||[];
    if(concluidas.length === listaDeConquistas.length) {
        if(!localStorage.getItem("platinado")) {
            localStorage.setItem("platinado", "true");
            celebrar('platina');
            mostrarMensagemGlob("🏆 MEUS PARABÉNS! Você completou todas as conquistas do jogo!");
        }
    }
    renderizarTrofeus();
}

window.verificarCatalogador = function() {
    let cat = JSON.parse(localStorage.getItem("catalogoDesbloqueado")) ||[];
    if(cat.length === 20) {
        desbloquearConquista('c6', true); 
        if(!localStorage.getItem("catalogador")) {
            localStorage.setItem("catalogador", "true");
            celebrar('catalogo');
            mostrarMensagemGlob("📚 SENSACIONAL! Você descobriu 100% das moléculas do Catálogo!");
        }
    }
    renderizarTrofeus();
}

function renderizarTrofeus() {
    let cont = document.getElementById("trofeus-globais");
    if(!cont) return;
    cont.innerHTML = "";
    if(localStorage.getItem("platinado") === "true") { cont.innerHTML += `<span class="trofeu-mini" title="Platinado!">🏆</span>`; }
    if(localStorage.getItem("catalogador") === "true") { cont.innerHTML += `<span class="trofeu-mini prata-brilho" title="Catalogador!">🏆</span>`; }
}

function celebrar(tipo) {
    let tela = document.getElementById("tela-comemoracao");
    if(!tela) return;
    let icone = tela.querySelector("#icone-comemoracao");
    let titulo = tela.querySelector("#titulo-comemoracao");

    if(tipo === 'platina') {
        icone.innerText = "🏆"; icone.className = "trofeu-gigante";
        titulo.innerText = "PLATINA ALCANÇADA!"; titulo.style.textShadow = "0 0 10px gold";
    } else {
        icone.innerText = "🏆"; icone.className = "trofeu-gigante prata-brilho";
        titulo.innerText = "MOLÉCULAS CATALOGADAS!"; titulo.style.textShadow = "0 0 10px silver";
    }

    tela.classList.add("ativa");
    if(somAplausos) { somAplausos.currentTime=0; somAplausos.play().catch(()=>{}); }

    for(let i=0; i<60; i++) {
        let conf = document.createElement("div"); conf.className = "confete";
        conf.style.left = Math.random() * 100 + "vw";
        conf.style.backgroundColor =['red','blue','yellow','green','purple','orange'][Math.floor(Math.random()*6)];
        conf.style.animationDuration = (Math.random() * 2 + 2) + "s";
        tela.appendChild(conf);
    }
    setTimeout(() => { tela.classList.remove("ativa"); tela.querySelectorAll(".confete").forEach(c => c.remove()); }, 6000);
}

function abrirChat() { tocarSomClick(); document.getElementById("chat-overlay").style.display = "block"; }
function fecharChatBtn() { tocarSomClick(); document.getElementById("chat-overlay").style.display = "none"; }
function abrirConquistas() { tocarSomClick(); document.getElementById("conquistas-overlay").style.display = "block"; }
function fecharConquistasBtn() { tocarSomClick(); document.getElementById("conquistas-overlay").style.display = "none"; }
function fecharModais(event) { if (event.target.classList.contains("modal-overlay")) { event.target.style.display = "none"; } }

function processarChat(e) {
    if(e.key === 'Enter') {
        let input = document.getElementById("chat-input");
        let div = document.getElementById("chat-mensagens");
        if(!input || !div) return;
        let cmd = input.value.trim().toLowerCase(); input.value = "";
        div.innerHTML += `<div style="margin-bottom:5px;"><b>Você:</b> ${cmd}</div>`;
        
        if(cmd === "\\platinar") {
            listaDeConquistas.forEach(c => desbloquearConquista(c.id, true)); verificarPlatina();
            div.innerHTML += `<div style="color:#16a34a; margin-bottom:5px;"><b>Sistema:</b> Todas as conquistas ativadas!</div>`;
        } else if (cmd === "\\catalogador") {
            let dbIds =[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];
            localStorage.setItem("catalogoDesbloqueado", JSON.stringify(dbIds)); window.verificarCatalogador();
            div.innerHTML += `<div style="color:#16a34a; margin-bottom:5px;"><b>Sistema:</b> Catálogo completo ativado!</div>`;
        } else if (cmd === "\\limpar") {
            localStorage.removeItem("conquistasDesbloqueadas"); localStorage.removeItem("catalogoDesbloqueado");
            localStorage.removeItem("platinado"); localStorage.removeItem("catalogador");
            renderizarTrofeus(); renderizarConquistas();
            div.innerHTML += `<div style="color:#ef4444; margin-bottom:5px;"><b>Sistema:</b> Dados resetados! Recarregue a página.</div>`;
        } else if (cmd === "\\completar") {
            if(typeof window.cheatCompletarFase === "function") { window.cheatCompletarFase(); div.innerHTML += `<div style="color:#16a34a; margin-bottom:5px;"><b>Sistema:</b> Fase completada automaticamente!</div>`; } 
            else { div.innerHTML += `<div style="color:#ef4444; margin-bottom:5px;"><b>Sistema:</b> Você precisa estar dentro de um Modo Desafio!</div>`; }
        } else if (cmd.startsWith("\\estrela")) {
            let num = parseInt(cmd.replace("\\estrela", ""));
            if(num >= 1 && num <= 5) {
                if(typeof window.cheatEstrelas === "function") { window.cheatEstrelas(num); div.innerHTML += `<div style="color:#16a34a; margin-bottom:5px;"><b>Sistema:</b> Você recebeu ${num} estrela(s)!</div>`; } 
                else { div.innerHTML += `<div style="color:#ef4444; margin-bottom:5px;"><b>Sistema:</b> Você precisa estar dentro de um Modo Desafio!</div>`; }
            } else { div.innerHTML += `<div style="color:#ef4444; margin-bottom:5px;"><b>Sistema:</b> Comando inválido. Use \\estrela1 a \\estrela5.</div>`; }
        } else if (cmd === "\\help") { div.innerHTML += `<div style="color:#0284c7; margin-bottom:5px;"><b>Comandos ADM:</b><br>\\platinar<br>\\catalogador<br>\\limpar<br>\\completar<br>\\estrela[1 a 5]<br>\\help</div>`; } 
        else { div.innerHTML += `<div style="color:#64748b; margin-bottom:5px;"><b>Sistema:</b> Comando '${cmd}' não reconhecido. Digite \\help</div>`; }
        div.scrollTop = div.scrollHeight;
    }
}

// ==========================================
// INJEÇÃO GLOBAL (Tabela Periódica, Microfone e QuimiChat)
// ==========================================

const elementosTabela = [
    { n: 1, s: 'H', nome: 'Hidrogênio', l: '1', m: '1.008', c: 1, r: 1 }, { n: 2, s: 'He', nome: 'Hélio', l: '0', m: '4.002', c: 18, r: 1 },
    { n: 3, s: 'Li', nome: 'Lítio', l: '1', m: '6.94', c: 1, r: 2 }, { n: 4, s: 'Be', nome: 'Berílio', l: '2', m: '9.012', c: 2, r: 2 },
    { n: 5, s: 'B', nome: 'Boro', l: '3', m: '10.81', c: 13, r: 2 }, { n: 6, s: 'C', nome: 'Carbono', l: '4', m: '12.011', c: 14, r: 2 },
    { n: 7, s: 'N', nome: 'Nitrogênio', l: '3', m: '14.007', c: 15, r: 2 }, { n: 8, s: 'O', nome: 'Oxigênio', l: '2', m: '15.999', c: 16, r: 2 },
    { n: 9, s: 'F', nome: 'Flúor', l: '1', m: '18.998', c: 17, r: 2 }, { n: 10, s: 'Ne', nome: 'Neônio', l: '0', m: '20.180', c: 18, r: 2 },
    { n: 11, s: 'Na', nome: 'Sódio', l: '1', m: '22.990', c: 1, r: 3 }, { n: 12, s: 'Mg', nome: 'Magnésio', l: '2', m: '24.305', c: 2, r: 3 },
    { n: 13, s: 'Al', nome: 'Alumínio', l: '3', m: '26.982', c: 13, r: 3 }, { n: 14, s: 'Si', nome: 'Silício', l: '4', m: '28.085', c: 14, r: 3 },
    { n: 15, s: 'P', nome: 'Fósforo', l: '3 ou 5', m: '30.974', c: 15, r: 3 }, { n: 16, s: 'S', nome: 'Enxofre', l: '2, 4 ou 6', m: '32.06', c: 16, r: 3 },
    { n: 17, s: 'Cl', nome: 'Cloro', l: '1', m: '35.45', c: 17, r: 3 }, { n: 18, s: 'Ar', nome: 'Argônio', l: '0', m: '39.948', c: 18, r: 3 },
    { n: 19, s: 'K', nome: 'Potássio', l: '1', m: '39.098', c: 1, r: 4 }, { n: 20, s: 'Ca', nome: 'Cálcio', l: '2', m: '40.078', c: 2, r: 4 },
    { n: 21, s: 'Sc', nome: 'Escândio', l: 'Variável', m: '44.956', c: 3, r: 4 }, { n: 22, s: 'Ti', nome: 'Titânio', l: 'Variável', m: '47.867', c: 4, r: 4 },
    { n: 23, s: 'V', nome: 'Vanádio', l: 'Variável', m: '50.942', c: 5, r: 4 }, { n: 24, s: 'Cr', nome: 'Cromo', l: 'Variável', m: '51.996', c: 6, r: 4 },
    { n: 25, s: 'Mn', nome: 'Manganês', l: 'Variável', m: '54.938', c: 7, r: 4 }, { n: 26, s: 'Fe', nome: 'Ferro', l: '2 ou 3', m: '55.845', c: 8, r: 4 },
    { n: 27, s: 'Co', nome: 'Cobalto', l: 'Variável', m: '58.933', c: 9, r: 4 }, { n: 28, s: 'Ni', nome: 'Níquel', l: 'Variável', m: '58.693', c: 10, r: 4 },
    { n: 29, s: 'Cu', nome: 'Cobre', l: '1 ou 2', m: '63.546', c: 11, r: 4 }, { n: 30, s: 'Zn', nome: 'Zinco', l: '2', m: '65.38', c: 12, r: 4 },
    { n: 31, s: 'Ga', nome: 'Gálio', l: '3', m: '69.723', c: 13, r: 4 }, { n: 32, s: 'Ge', nome: 'Germânio', l: '4', m: '72.630', c: 14, r: 4 },
    { n: 33, s: 'As', nome: 'Arsênio', l: '3 ou 5', m: '74.922', c: 15, r: 4 }, { n: 34, s: 'Se', nome: 'Selênio', l: '2', m: '78.971', c: 16, r: 4 },
    { n: 35, s: 'Br', nome: 'Bromo', l: '1', m: '79.904', c: 17, r: 4 }, { n: 36, s: 'Kr', nome: 'Criptônio', l: '0', m: '83.798', c: 18, r: 4 },
    { n: 37, s: 'Rb', nome: 'Rubídio', l: '1', m: '85.468', c: 1, r: 5 }, { n: 38, s: 'Sr', nome: 'Estrôncio', l: '2', m: '87.62', c: 2, r: 5 },
    { n: 39, s: 'Y', nome: 'Ítrio', l: 'Variável', m: '88.906', c: 3, r: 5 }, { n: 40, s: 'Zr', nome: 'Zircônio', l: 'Variável', m: '91.224', c: 4, r: 5 },
    { n: 41, s: 'Nb', nome: 'Nióbio', l: 'Variável', m: '92.906', c: 5, r: 5 }, { n: 42, s: 'Mo', nome: 'Molibdênio', l: 'Variável', m: '95.95', c: 6, r: 5 },
    { n: 43, s: 'Tc', nome: 'Tecnécio', l: 'Variável', m: '[98]', c: 7, r: 5 }, { n: 44, s: 'Ru', nome: 'Rutênio', l: 'Variável', m: '101.07', c: 8, r: 5 },
    { n: 45, s: 'Rh', nome: 'Ródio', l: 'Variável', m: '102.91', c: 9, r: 5 }, { n: 46, s: 'Pd', nome: 'Paládio', l: 'Variável', m: '106.42', c: 10, r: 5 },
    { n: 47, s: 'Ag', nome: 'Prata', l: '1', m: '107.87', c: 11, r: 5 }, { n: 48, s: 'Cd', nome: 'Cádmio', l: '2', m: '112.41', c: 12, r: 5 },
    { n: 49, s: 'In', nome: 'Índio', l: '3', m: '114.82', c: 13, r: 5 }, { n: 50, s: 'Sn', nome: 'Estanho', l: '4', m: '118.71', c: 14, r: 5 },
    { n: 51, s: 'Sb', nome: 'Antimônio', l: '3 ou 5', m: '121.76', c: 15, r: 5 }, { n: 52, s: 'Te', nome: 'Telúrio', l: '2', m: '127.60', c: 16, r: 5 },
    { n: 53, s: 'I', nome: 'Iodo', l: '1', m: '126.90', c: 17, r: 5 }, { n: 54, s: 'Xe', nome: 'Xenônio', l: '0', m: '131.29', c: 18, r: 5 },
    { n: 55, s: 'Cs', nome: 'Césio', l: '1', m: '132.91', c: 1, r: 6 }, { n: 56, s: 'Ba', nome: 'Bário', l: '2', m: '137.33', c: 2, r: 6 },
    { n: 57, s: 'La', nome: 'Lantânio', l: 'Variável', m: '138.91', c: 4, r: 8 }, { n: 58, s: 'Ce', nome: 'Cério', l: 'Variável', m: '140.12', c: 5, r: 8 },
    { n: 59, s: 'Pr', nome: 'Praseodímio', l: 'Variável', m: '140.91', c: 6, r: 8 }, { n: 60, s: 'Nd', nome: 'Neodímio', l: 'Variável', m: '144.24', c: 7, r: 8 },
    { n: 61, s: 'Pm', nome: 'Promécio', l: 'Variável', m: '[145]', c: 8, r: 8 }, { n: 62, s: 'Sm', nome: 'Samário', l: 'Variável', m: '150.36', c: 9, r: 8 },
    { n: 63, s: 'Eu', nome: 'Európio', l: 'Variável', m: '151.96', c: 10, r: 8 }, { n: 64, s: 'Gd', nome: 'Gadolínio', l: 'Variável', m: '157.25', c: 11, r: 8 },
    { n: 65, s: 'Tb', nome: 'Térbio', l: 'Variável', m: '158.93', c: 12, r: 8 }, { n: 66, s: 'Dy', nome: 'Disprósio', l: 'Variável', m: '162.50', c: 13, r: 8 },
    { n: 67, s: 'Ho', nome: 'Hólmio', l: 'Variável', m: '164.93', c: 14, r: 8 }, { n: 68, s: 'Er', nome: 'Érbio', l: 'Variável', m: '167.26', c: 15, r: 8 },
    { n: 69, s: 'Tm', nome: 'Túlio', l: 'Variável', m: '168.93', c: 16, r: 8 }, { n: 70, s: 'Yb', nome: 'Itérbio', l: 'Variável', m: '173.05', c: 17, r: 8 },
    { n: 71, s: 'Lu', nome: 'Lutécio', l: 'Variável', m: '174.97', c: 18, r: 8 },
    { n: 72, s: 'Hf', nome: 'Háfnio', l: 'Variável', m: '178.49', c: 4, r: 6 }, { n: 73, s: 'Ta', nome: 'Tântalo', l: 'Variável', m: '180.95', c: 5, r: 6 },
    { n: 74, s: 'W', nome: 'Tungstênio', l: 'Variável', m: '183.84', c: 6, r: 6 }, { n: 75, s: 'Re', nome: 'Rênio', l: 'Variável', m: '186.21', c: 7, r: 6 },
    { n: 76, s: 'Os', nome: 'Ósmio', l: 'Variável', m: '190.23', c: 8, r: 6 }, { n: 77, s: 'Ir', nome: 'Irídio', l: 'Variável', m: '192.22', c: 9, r: 6 },
    { n: 78, s: 'Pt', nome: 'Platina', l: 'Variável', m: '195.08', c: 10, r: 6 }, { n: 79, s: 'Au', nome: 'Ouro', l: 'Variável', m: '196.97', c: 11, r: 6 },
    { n: 80, s: 'Hg', nome: 'Mercúrio', l: 'Variável', m: '200.59', c: 12, r: 6 }, { n: 81, s: 'Tl', nome: 'Tálio', l: '3', m: '204.38', c: 13, r: 6 },
    { n: 82, s: 'Pb', nome: 'Chumbo', l: '4', m: '207.2', c: 14, r: 6 }, { n: 83, s: 'Bi', nome: 'Bismuto', l: '3', m: '208.98', c: 15, r: 6 },
    { n: 84, s: 'Po', nome: 'Polônio', l: '2', m: '[209]', c: 16, r: 6 }, { n: 85, s: 'At', nome: 'Astato', l: '1', m: '[210]', c: 17, r: 6 },
    { n: 86, s: 'Rn', nome: 'Radônio', l: '0', m: '[222]', c: 18, r: 6 }, { n: 87, s: 'Fr', nome: 'Frâncio', l: '1', m: '[223]', c: 1, r: 7 },
    { n: 88, s: 'Ra', nome: 'Rádio', l: '2', m: '[226]', c: 2, r: 7 },
    { n: 89, s: 'Ac', nome: 'Actínio', l: 'Variável', m: '[227]', c: 4, r: 9 }, { n: 90, s: 'Th', nome: 'Tório', l: 'Variável', m: '232.04', c: 5, r: 9 },
    { n: 91, s: 'Pa', nome: 'Protactínio', l: 'Variável', m: '231.04', c: 6, r: 9 }, { n: 92, s: 'U', nome: 'Urânio', l: 'Variável', m: '238.03', c: 7, r: 9 },
    { n: 93, s: 'Np', nome: 'Netúnio', l: 'Variável', m: '[237]', c: 8, r: 9 }, { n: 94, s: 'Pu', nome: 'Plutônio', l: 'Variável', m: '[244]', c: 9, r: 9 },
    { n: 95, s: 'Am', nome: 'Amerício', l: 'Variável', m: '[243]', c: 10, r: 9 }, { n: 96, s: 'Cm', nome: 'Cúrio', l: 'Variável', m: '[247]', c: 11, r: 9 },
    { n: 97, s: 'Bk', nome: 'Berquélio', l: 'Variável', m: '[247]', c: 12, r: 9 }, { n: 98, s: 'Cf', nome: 'Califórnio', l: 'Variável', m: '[251]', c: 13, r: 9 },
    { n: 99, s: 'Es', nome: 'Einstênio', l: 'Variável', m: '[252]', c: 14, r: 9 }, { n: 100, s: 'Fm', nome: 'Férmio', l: 'Variável', m: '[257]', c: 15, r: 9 },
    { n: 101, s: 'Md', nome: 'Mendelévio', l: 'Variável', m: '[258]', c: 16, r: 9 }, { n: 102, s: 'No', nome: 'Nobélio', l: 'Variável', m: '[259]', c: 17, r: 9 },
    { n: 103, s: 'Lr', nome: 'Laurêncio', l: 'Variável', m: '[266]', c: 18, r: 9 },
    { n: 104, s: 'Rf', nome: 'Rutherfórdio', l: 'Variável', m: '[267]', c: 4, r: 7 }, { n: 105, s: 'Db', nome: 'Dúbnio', l: 'Variável', m: '[268]', c: 5, r: 7 },
    { n: 106, s: 'Sg', nome: 'Seabórgio', l: 'Variável', m: '[269]', c: 6, r: 7 }, { n: 107, s: 'Bh', nome: 'Bóhrio', l: 'Variável', m: '[270]', c: 7, r: 7 },
    { n: 108, s: 'Hs', nome: 'Hássio', l: 'Variável', m: '[269]', c: 8, r: 7 }, { n: 109, s: 'Mt', nome: 'Meitnério', l: 'Variável', m: '[278]', c: 9, r: 7 },
    { n: 110, s: 'Ds', nome: 'Darmstádio', l: 'Variável', m: '[281]', c: 10, r: 7 }, { n: 111, s: 'Rg', nome: 'Roentgênio', l: 'Variável', m: '[282]', c: 11, r: 7 },
    { n: 112, s: 'Cn', nome: 'Copernício', l: 'Variável', m: '[285]', c: 12, r: 7 }, { n: 113, s: 'Nh', nome: 'Nihônio', l: 'Variável', m: '[286]', c: 13, r: 7 },
    { n: 114, s: 'Fl', nome: 'Fleróvio', l: 'Variável', m: '[289]', c: 14, r: 7 }, { n: 115, s: 'Mc', nome: 'Moscóvio', l: 'Variável', m: '[290]', c: 15, r: 7 },
    { n: 116, s: 'Lv', nome: 'Livermório', l: 'Variável', m: '[293]', c: 16, r: 7 }, { n: 117, s: 'Ts', nome: 'Tenessino', l: 'Variável', m: '[294]', c: 17, r: 7 },
    { n: 118, s: 'Og', nome: 'Oganessônio', l: '0', m: '[294]', c: 18, r: 7 }
];

function injetarElementosGlobais() {
    // 1. Tabela Periódica
    if (!document.getElementById('tabela-overlay')) {
        const modalHTML = `
        <div id="tabela-overlay" class="modal-overlay" onclick="fecharModais(event)">
          <div class="modal-box modal-tabela">
            <div class="modal-header" style="background: var(--btn-bg);">
              <h3>📊 Tabela Periódica</h3>
              <button onclick="fecharTabelaPeriodica()">✖</button>
            </div>
            <div class="modal-body tabela-body">
              <div class="info-painel" id="info-painel-elemento">
                <h3 id="el-nome" style="width: 100%; text-align: center; margin-bottom: 10px; color: #0284c7;">Selecione um elemento</h3>
                <p><strong>Símbolo:</strong> <span id="el-simbolo">-</span></p>
                <p><strong>Número Atômico:</strong> <span id="el-numero">-</span></p>
                <p><strong>Massa Atômica:</strong> <span id="el-massa">-</span> u</p>
                <p><strong>Ligações:</strong> <span id="el-ligacoes">-</span></p>
              </div>
              <div id="grade-tabela" class="grade-tabela"></div>
            </div>
          </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // 2. QuimiChat
    if (!document.getElementById('quimichat-overlay')) {
        const chatHTML = `
        <div id="quimichat-overlay" class="modal-overlay" onclick="fecharModais(event)">
          <div class="modal-box modal-chat">
            <div class="modal-header" style="background: #1e293b;">
              <h3>💬 QuimiChat (Adômines)</h3>
              <button onclick="fecharQuimiChat()">✖</button>
            </div>
            <div class="aviso-chat">O QuimiChat possui um limite diário de ${MAX_PERGUNTAS} perguntas.</div>
            <div class="bateria-container">🔋 Bateria da Adômines: <span id="chat-bateria-num">100%</span></div>
            <div class="chat-body-inner">
              <div id="quimichat-mensagens" class="chat-mensagens">
                <div class="msg-ai">Olá! Eu sou a Adômines. Qual é a sua dúvida de química hoje?</div>
              </div>
              <div class="chat-input-area">
                <input type="text" id="quimichat-input" placeholder="Pergunte algo sobre química..." onkeypress="verificarEnterQuimiChat(event)">
                <button onclick="enviarPerguntaQuimiChatInput()">➤</button>
              </div>
            </div>
          </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', chatHTML);
        atualizarBateriaUI();
    }
    
    // Injeta Botões na Direita (Garantido pela trava de segurança)
    const headerDireita = document.querySelector('.topo .direita');
    if (headerDireita) {
        if (!document.querySelector('.btn-tabela-global')) {
            headerDireita.insertAdjacentHTML('afterbegin', `<button class="icon-btn btn-tabela-global" onclick="abrirTabelaPeriodica()" title="Tabela Periódica">📊</button>`);
        }
        if (!document.querySelector('.btn-chat-global')) {
            headerDireita.insertAdjacentHTML('afterbegin', `<button class="icon-btn btn-chat-global" onclick="abrirQuimiChat()" title="QuimiChat">💬</button>`);
        }
    }

    // Injeta Botão do Microfone na Esquerda
    const headerEsquerda = document.querySelector('.topo .esquerda');
    if (headerEsquerda && !document.getElementById('btnAssistente')) {
        const micHTML = `<button class="icon-btn" onclick="toggleAssistenteVoz()" id="btnAssistente" title="Assistente de Voz">🎤</button>`;
        const trofeus = document.getElementById('trofeus-globais');
        if (trofeus) { trofeus.insertAdjacentHTML('beforebegin', micHTML); } else { headerEsquerda.insertAdjacentHTML('beforeend', micHTML); }
    }
}

// Funções Tabela
function abrirTabelaPeriodica() { tocarSomClick(); document.getElementById("tabela-overlay").style.display = "block"; let grade = document.getElementById("grade-tabela"); if(grade && grade.innerHTML === "") { renderizarTabelaPeriodica(); } }
function fecharTabelaPeriodica() { tocarSomClick(); document.getElementById("tabela-overlay").style.display = "none"; }
function renderizarTabelaPeriodica() { let grade = document.getElementById("grade-tabela"); grade.innerHTML = ""; elementosTabela.forEach(el => { let div = document.createElement("div"); div.className = "elemento-tabela"; div.style.gridColumn = el.c; div.style.gridRow = el.r; div.innerHTML = `<span class="el-num">${el.n}</span><span class="el-sim">${el.s}</span>`; div.onclick = () => mostrarInfoElemento(el); grade.appendChild(div); }); }
function mostrarInfoElemento(el) { tocarSomClick(); document.getElementById("el-nome").innerText = el.nome; document.getElementById("el-simbolo").innerText = el.s; document.getElementById("el-numero").innerText = el.n; document.getElementById("el-massa").innerText = el.m; document.getElementById("el-ligacoes").innerText = el.l; }

// ==========================================
// LÓGICA DO QUIMICHAT (API GEMINI)
// ==========================================
function abrirQuimiChat() { tocarSomClick(); document.getElementById("quimichat-overlay").style.display = "block"; setTimeout(()=>{ document.getElementById("quimichat-input").focus(); }, 100); }
function fecharQuimiChat() { tocarSomClick(); document.getElementById("quimichat-overlay").style.display = "none"; }
function verificarEnterQuimiChat(e) { if(e.key === 'Enter') enviarPerguntaQuimiChatInput(); }

function atualizarBateriaUI() {
    let dados = gerenciarBateriaQuimiChat();
    let porcentagem = (dados.restantes / MAX_PERGUNTAS) * 100;
    let span = document.getElementById("chat-bateria-num");
    if(span) span.innerText = Math.round(porcentagem) + "% (" + dados.restantes + " restantes)";
}

function descontarBateria() {
    let dados = gerenciarBateriaQuimiChat();
    if(dados.restantes > 0) { dados.restantes--; localStorage.setItem("quimiChatBateria", JSON.stringify(dados)); atualizarBateriaUI(); }
}

function enviarPerguntaQuimiChatInput() {
    let input = document.getElementById("quimichat-input");
    let texto = input.value.trim();
    if(texto === "") return;
    input.value = "";
    enviarPerguntaQuimiChat(texto, false);
}

function pareceQuimica(pergunta) {
    let proibidas = ["futebol", "neymar", "filme", "capital", "politica", "bbb", "quem ganhou", "idade de"];
    let p = normalizar(pergunta);
    if(proibidas.some(x => p.includes(x))) return false;
    return true; 
}

async function enviarPerguntaQuimiChat(pergunta, lerVozAlta) {
    let container = document.getElementById("quimichat-mensagens");
    
    container.innerHTML += `<div class="msg-user">${pergunta}</div>`;
    container.scrollTop = container.scrollHeight;

    let dadosBateria = gerenciarBateriaQuimiChat();
    if (dadosBateria.restantes <= 0) {
        let msgSemEnergia = "Minha bateria acabou! Usei muita energia processando cálculos químicos hoje. Volte amanhã!";
        container.innerHTML += `<div class="msg-ai">${msgSemEnergia}</div>`;
        if(lerVozAlta) falarAssistente(msgSemEnergia);
        return;
    }

    if (!pareceQuimica(pergunta)) {
        let msgNaoQuimica = "Isso não parece ter nenhuma relação com química! Reformule sua pergunta.";
        container.innerHTML += `<div class="msg-ai">${msgNaoQuimica}</div>`;
        if(lerVozAlta) falarAssistente(msgNaoQuimica);
        return;
    }

    let idTemp = "msg-" + Date.now();
    container.innerHTML += `<div id="${idTemp}" class="carregando-ai">Adômines está pensando...</div>`;
    container.scrollTop = container.scrollHeight;

    try {
        let instrucao = "Você é a Adômines, assistente de química de um jogo. Responda APENAS perguntas sobre química de forma simples, direta e para jovens estudantes. Se a pergunta NÃO for sobre química, responda EXATAMENTE: 'Desculpe, eu só posso responder a perguntas relacionadas à química.'";
        
        const respostaApi = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY_GEMINI}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                system_instruction: { parts: { text: instrucao } },
                contents: [{ parts: [{ text: pergunta }] }]
            })
        });

        const dados = await respostaApi.json();
        let avisoPensando = document.getElementById(idTemp);
        if(avisoPensando) avisoPensando.remove();

        if (dados.error) { throw new Error(dados.error.message); }

        let respostaTexto = dados.candidates[0].content.parts[0].text.trim();
        
        if (!respostaTexto.includes("Desculpe, eu só posso responder")) {
            descontarBateria(); 
        }

        container.innerHTML += `<div class="msg-ai">${respostaTexto}</div>`;
        if(lerVozAlta) falarAssistente(respostaTexto);
        container.scrollTop = container.scrollHeight;

    } catch (e) {
        let avisoPensando = document.getElementById(idTemp);
        if(avisoPensando) avisoPensando.remove();
        console.error("Erro QuimiChat:", e);
        let msgErro = "Não consegui me conectar ao laboratório agora. Verifique se o desenvolvedor configurou minha Chave de Acesso da API do Gemini corretamente.";
        container.innerHTML += `<div class="msg-ai" style="color:#ef4444">${msgErro}</div>`;
        if(lerVozAlta) falarAssistente(msgErro);
    }
}