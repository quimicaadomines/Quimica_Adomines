let musica = document.getElementById("musica");
let clickAudio = document.getElementById("click");
let bubbleAudio = document.getElementById("bubble");
let transicaoAudio = document.getElementById("transicaoSom"); 
let somAplausos = document.getElementById("somAplausos");
let somConquistaGlob = document.getElementById("somConquista"); 

let mutado = false; let efeitosVisuaisAtivos = true; let musicaIniciada = false;

const listaDeConquistas =[
  { id: "c1", texto: "Complete o nível fácil do modo de jogo estruturando pela primeira vez." },
  { id: "c2", texto: "Complete o nível médio do modo de jogo estruturando pela primeira vez." },
  { id: "c3", texto: "Complete o nível difícil do modo de jogo estruturando pela primeira vez." },
  { id: "c4", texto: "Complete o nível impossível do modo de jogo estruturando pela primeira vez." },
  { id: "c5", texto: "Complete todos os níveis do modo de jogo estruturando pelo menos 5 vezes." },
  { id: "c6", texto: "Conclua o catálogo do modo livre do jogo estruturando." }, 
  { id: "c7", texto: "Complete um nível inclusivo do modo de jogo estruturando." }
];

function carregarConfiguracoes() {
  if (localStorage.getItem("tema") === "escuro") { document.body.classList.add("dark"); document.getElementById("temaBtn").innerText = "☀️"; }
  if (localStorage.getItem("mutado") === "true") { mutado = true; musica.muted = true; document.getElementById("muteBtn").innerText = "🔇"; }
  
  let volMusica = localStorage.getItem("volumeMusica");
  if (volMusica !== null) { musica.volume = parseFloat(volMusica); document.getElementById("rangeMusica").value = volMusica; }
  
  let volEfeitos = localStorage.getItem("volumeEfeitos");
  if (volEfeitos !== null) { clickAudio.volume = parseFloat(volEfeitos); bubbleAudio.volume = parseFloat(volEfeitos); document.getElementById("rangeEfeitos").value = volEfeitos; }

  if (localStorage.getItem("efeitosVisuais") === "false") { efeitosVisuaisAtivos = false; document.getElementById("checkEfeitos").checked = true; aplicarEfeitosNaLogo(false); }

  let tempoSalvo = localStorage.getItem("tempoMusica");
  let estavaTocando = localStorage.getItem("musicaTocando"); 
  if (tempoSalvo !== null) { musica.currentTime = parseFloat(tempoSalvo); }
  
  if (estavaTocando === "true" && !mutado) {
    let p = musica.play();
    if (p !== undefined) { p.then(_ => { musicaIniciada = true; }).catch(e => { console.log("Bloqueio de autoplay."); }); }
  }

  renderizarConquistas();
  renderizarTrofeus();
}
window.onload = carregarConfiguracoes;

window.addEventListener("beforeunload", () => { 
  localStorage.setItem("tempoMusica", musica.currentTime); 
  localStorage.setItem("musicaTocando", !musica.paused);
});

function mudarTela(url) {
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

function toggleModo() { tocarSomClick(); document.body.classList.toggle("dark"); let isDark = document.body.classList.contains("dark"); document.getElementById("temaBtn").innerText = isDark ? "☀️" : "🌙"; localStorage.setItem("tema", isDark ? "escuro" : "claro"); }
function toggleMute() { tocarSomClick(); mutado = !mutado; musica.muted = mutado; if (!mutado && !musicaIniciada) { musica.play(); musicaIniciada = true; } document.getElementById("muteBtn").innerText = mutado ? "🔇" : "🔊"; localStorage.setItem("mutado", mutado); }
function toggleMenu(event) { if (event) event.stopPropagation(); tocarSomClick(); let menu = document.getElementById("menu"); menu.style.display = (menu.style.display === "block") ? "none" : "block"; }
function volumeMusica(v) { musica.volume = v; localStorage.setItem("volumeMusica", v); }
function volumeEfeitos(v) { clickAudio.volume = v; bubbleAudio.volume = v; localStorage.setItem("volumeEfeitos", v); }
function toggleEfeitos(checkbox) { efeitosVisuaisAtivos = !checkbox.checked; localStorage.setItem("efeitosVisuais", efeitosVisuaisAtivos); aplicarEfeitosNaLogo(efeitosVisuaisAtivos); }
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
// TROFÉUS E CONQUISTAS GLOBAIS
// ==========================================
function desbloquearConquista(id, silencioso=false) {
    let concluidas = JSON.parse(localStorage.getItem("conquistasDesbloqueadas")) ||[];
    if(!concluidas.includes(id)) {
        concluidas.push(id);
        localStorage.setItem("conquistasDesbloqueadas", JSON.stringify(concluidas));
        if(!silencioso) {
            if(somConquistaGlob) { 
                somConquistaGlob.volume = 1.0;
                somConquistaGlob.currentTime = 0; 
                somConquistaGlob.play().catch(()=>{}); 
            }
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
        icone.innerText = "🏆"; 
        icone.className = "trofeu-gigante";
        titulo.innerText = "PLATINA ALCANÇADA!"; 
        titulo.style.textShadow = "0 0 10px gold";
    } else {
        icone.innerText = "🏆"; 
        icone.className = "trofeu-gigante prata-brilho";
        titulo.innerText = "MOLÉCULAS CATALOGADAS!"; 
        titulo.style.textShadow = "0 0 10px silver";
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

// CHAT ADM CHEATS
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
        let cmd = input.value.trim().toLowerCase();
        input.value = "";
        
        div.innerHTML += `<div style="margin-bottom:5px;"><b>Você:</b> ${cmd}</div>`;
        
        if(cmd === "\\platinar") {
            listaDeConquistas.forEach(c => desbloquearConquista(c.id, true));
            verificarPlatina();
            div.innerHTML += `<div style="color:#16a34a; margin-bottom:5px;"><b>Sistema:</b> Todas as conquistas ativadas!</div>`;
        } else if (cmd === "\\catalogador") {
            let dbIds =[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];
            localStorage.setItem("catalogoDesbloqueado", JSON.stringify(dbIds));
            window.verificarCatalogador();
            div.innerHTML += `<div style="color:#16a34a; margin-bottom:5px;"><b>Sistema:</b> Catálogo completo ativado!</div>`;
        } else if (cmd === "\\limpar") {
            localStorage.removeItem("conquistasDesbloqueadas");
            localStorage.removeItem("catalogoDesbloqueado");
            localStorage.removeItem("platinado");
            localStorage.removeItem("catalogador");
            renderizarTrofeus(); renderizarConquistas();
            div.innerHTML += `<div style="color:#ef4444; margin-bottom:5px;"><b>Sistema:</b> Dados resetados! Recarregue a página.</div>`;
        } else if (cmd === "\\completar") {
            if(typeof window.cheatCompletarFase === "function") { 
                window.cheatCompletarFase(); 
                div.innerHTML += `<div style="color:#16a34a; margin-bottom:5px;"><b>Sistema:</b> Fase completada automaticamente!</div>`; 
            } else { 
                div.innerHTML += `<div style="color:#ef4444; margin-bottom:5px;"><b>Sistema:</b> Você precisa estar dentro de um Modo Desafio!</div>`; 
            }
        } else if (cmd.startsWith("\\estrela")) {
            let num = parseInt(cmd.replace("\\estrela", ""));
            if(num >= 1 && num <= 5) {
                if(typeof window.cheatEstrelas === "function") { 
                    window.cheatEstrelas(num); 
                    div.innerHTML += `<div style="color:#16a34a; margin-bottom:5px;"><b>Sistema:</b> Você recebeu ${num} estrela(s)!</div>`; 
                } else { 
                    div.innerHTML += `<div style="color:#ef4444; margin-bottom:5px;"><b>Sistema:</b> Você precisa estar dentro de um Modo Desafio!</div>`; 
                }
            } else {
                div.innerHTML += `<div style="color:#ef4444; margin-bottom:5px;"><b>Sistema:</b> Comando inválido. Use \\estrela1 a \\estrela5.</div>`;
            }
        } else if (cmd === "\\help") {
            div.innerHTML += `<div style="color:#0284c7; margin-bottom:5px;"><b>Comandos ADM:</b><br>\\platinar - Platina o jogo<br>\\catalogador - Completa o catálogo<br>\\limpar - Reseta todas as conquistas e troféus<br>\\completar - Completa o desafio e vence a fase<br>\\estrela[1 a 5] - Dá a quantidade de estrelas na fase<br>\\help - Mostra esta lista</div>`;
        } else {
            div.innerHTML += `<div style="color:#64748b; margin-bottom:5px;"><b>Sistema:</b> Comando '${cmd}' não reconhecido. Digite \\help</div>`;
        }
        div.scrollTop = div.scrollHeight;
    }
}

function renderizarConquistas() {
  let container = document.getElementById("lista-conquistas");
  if (!container) return;
  container.innerHTML = ""; 
  let conquistadas = JSON.parse(localStorage.getItem("conquistasDesbloqueadas")) ||[];
  listaDeConquistas.forEach(conq => {
    let div = document.createElement("div");
    let desbloqueada = conquistadas.includes(conq.id);
    div.className = `conquista-item ${desbloqueada ? 'conquista-desbloqueada' : ''}`;
    div.innerHTML = `<div class="conquista-icone">${desbloqueada ? '🏆' : '🔒'}</div><div class="conquista-texto">${conq.texto}</div>`;
    container.appendChild(div);
  });
}


// ==========================================
// ASSISTENTE DE VOZ (ADICIONADO DE FORMA SEGURA)
// ==========================================
let assistenteAtivo = localStorage.getItem("assistenteAtivo") === "true";
let assistenteReconhecimento = null;
let assistenteSintese = window.speechSynthesis;

// Inicializa a Voz de forma simples e infalível
function falarAssistente(texto) {
    assistenteSintese.cancel(); 
    let fala = new SpeechSynthesisUtterance(texto);
    fala.lang = "pt-BR";
    
    let vozes = assistenteSintese.getVoices();
    // Tenta pegar voz feminina/online do BR
    let vozBR = vozes.find(v => v.lang.includes('pt-BR') && (v.name.includes('Feminina') || v.name.includes('Google') || v.name.includes('Luciana') || v.name.includes('Maria')));
    // Se não achar, pega a primeira voz BR que existir
    if(!vozBR) vozBR = vozes.find(v => v.lang.includes('pt-BR'));
    
    if(vozBR) fala.voice = vozBR;
    fala.pitch = 1.2; 
    
    assistenteSintese.speak(fala);
}

// Força o carregamento das vozes caso o navegador seja lento
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = () => { assistenteSintese.getVoices(); };
}

// Inicializa o Microfone de forma segura
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
        let comando = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
        mostrarMensagemGlob('🎤 Ouvi: "' + comando + '"');
        processarComandoVozSeguro(comando);
    };

    assistenteReconhecimento.onerror = function(event) {
        if(event.error === 'not-allowed') {
            mostrarMensagemGlob("Permissão do microfone negada.");
            assistenteAtivo = false;
            localStorage.setItem("assistenteAtivo", "false");
            let btn = document.getElementById("btnAssistente");
            if(btn) btn.classList.remove("mic-ouvindo");
        }
    };

    assistenteReconhecimento.onend = function() {
        if (assistenteAtivo) {
            try { assistenteReconhecimento.start(); } catch(e){}
        } else {
            let btn = document.getElementById("btnAssistente");
            if(btn) btn.classList.remove("mic-ouvindo");
        }
    };
}

// Ligar/Desligar sem mexer na navegação do jogo
window.toggleAssistenteVoz = function(silencioso = false) {
    if(!silencioso) tocarSomClick();
    
    if (!assistenteReconhecimento) {
        mostrarMensagemGlob("Seu navegador não suporta voz.");
        falarAssistente("Desculpe, seu navegador não suporta o assistente de voz.");
        return;
    }

    if (assistenteAtivo) {
        assistenteAtivo = false;
        localStorage.setItem("assistenteAtivo", "false");
        assistenteReconhecimento.stop();
        if(!silencioso) {
            falarAssistente("Assistente desativado.");
            mostrarMensagemGlob("🎤 Assistente Desativado");
        }
    } else {
        try {
            assistenteAtivo = true; 
            localStorage.setItem("assistenteAtivo", "true");
            assistenteReconhecimento.start();
            if(!silencioso) {
                falarAssistente("Assistente ativado. Como posso ajudar?");
                mostrarMensagemGlob("🎤 Assistente Ouvindo...");
            }
        } catch(e) { }
    }
}

// Tecla Espaço global
document.addEventListener("keydown", (e) => {
    if(e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
    if (e.code === "Space") {
        e.preventDefault(); 
        toggleAssistenteVoz();
    }
});

// Religamento automático limpo (executado apenas 1x no final do carregamento)
setTimeout(() => {
    if(assistenteAtivo && assistenteReconhecimento) {
        try { assistenteReconhecimento.start(); } catch(e){}
    }
}, 1000);

// Processamento de Comandos simples, diretos e com várias palavras-chave
function processarComandoVozSeguro(comando) {
    
    // Desligar
    if (comando.includes("desativar") || comando.includes("desligar") || comando.includes("parar")) {
        toggleAssistenteVoz();
        return;
    }

    // Voltar (Index)
    if (comando.includes("voltar") || comando.includes("início") || comando.includes("principal")) {
        falarAssistente("Voltando");
        mudarTela('index.html');
        return;
    }

    // Mutar/Desmutar
    if (comando.includes("mutar") || comando.includes("silêncio") || comando.includes("tirar som")) {
        if(!mutado) toggleMute();
        falarAssistente("Mudo.");
        return;
    }
    if (comando.includes("desmutar") || comando.includes("ligar som") || comando.includes("com som")) {
        if(mutado) toggleMute();
        falarAssistente("Som ligado.");
        return;
    }

    // Iniciar Jogo
    if (comando.includes("iniciar") || comando.includes("começar") || comando.includes("jogar") || comando.includes("bora") || comando.includes("vamos") || comando.includes("entrar") || comando.includes("play")) {
        let urlAtual = window.location.pathname;
        if (urlAtual.includes('modos.html') || urlAtual.includes('estruturando.html') || urlAtual.includes('inclusao.html')) {
            falarAssistente("Você já está no jogo.");
        } else {
            falarAssistente("Iniciando.");
            // Usa a sua função original se existir (tela index), se não, chama mudarTela direto
            if (typeof iniciar === "function") { iniciar(); } else { mudarTela('modos.html'); }
        }
        return;
    }

    // Escolher modo Estruturando (na tela de modos)
    if (window.location.href.includes('modos.html')) {
        if (comando.includes("estruturando") || comando.includes("clássico") || comando.includes("primeiro")) {
            falarAssistente("Estruturando.");
            localStorage.setItem("modoAtual", "livre");
            mudarTela('estruturando.html');
            return;
        }
        // Escolher modo Acessível (na tela de modos)
        if (comando.includes("acessível") || comando.includes("inclusão") || comando.includes("segundo")) {
            falarAssistente("Acessível.");
            localStorage.setItem("modoAtual", "inclusao-reconhecer");
            mudarTela('inclusao.html');
            return;
        }
    }
}