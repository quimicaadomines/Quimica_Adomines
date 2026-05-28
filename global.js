// ==========================================
// GLOBAL JAVASCRIPT (ATUALIZADO COM PWA E FULLSCREEN)
// ==========================================
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
let eventoInstalacao; // Para PWA

// ==========================================
// TELA CHEIA E PWA
// ==========================================
function ativarTelaCheia() {
  const elemento = document.documentElement;
  if (elemento.requestFullscreen) { elemento.requestFullscreen(); } 
  else if (elemento.webkitRequestFullscreen) { elemento.webkitRequestFullscreen(); } 
  else if (elemento.msRequestFullscreen) { elemento.msRequestFullscreen(); }
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  eventoInstalacao = e;
  const btn = document.getElementById('btn-instalar-pwa');
  if(btn) btn.style.display = 'block';
});

async function instalarPWA() {
  if (eventoInstalacao) {
    eventoInstalacao.prompt();
    const { outcome } = await eventoInstalacao.userChoice;
    eventoInstalacao = null;
    fecharModaisPWA();
  } else {
    const esIphone = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (esIphone) {
        document.getElementById('pwa-instrucoes-ios').style.display = 'block';
        document.getElementById('pwa-conteudo-geral').style.display = 'none';
    }
  }
}

function abrirModalPWA() { tocarSomClick(); document.getElementById("pwa-overlay").style.display = "flex"; }
function fecharModaisPWA() { document.getElementById("pwa-overlay").style.display = "none"; }

// ==========================================
// CONFIGURAÇÃO DO QUIMICHAT (IA) E BATERIA
// ==========================================
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

function carregarConfiguracoes() {
  if (localStorage.getItem("tema") === "escuro") { document.body.classList.add("dark"); let btn = document.getElementById("temaBtn"); if(btn) btn.innerText = "☀️"; }
  if (localStorage.getItem("mutado") === "true") { mutado = true; if(musica) musica.muted = true; let btn = document.getElementById("muteBtn"); if(btn) btn.innerText = "🔇"; }
  
  let volMusica = localStorage.getItem("volumeMusica");
  if (volMusica !== null && musica) { musica.volume = parseFloat(volMusica); let rg = document.getElementById("rangeMusica"); if(rg) rg.value = volMusica; }
  
  let volEfeitos = localStorage.getItem("volumeEfeitos");
  if (volEfeitos !== null) { if(clickAudio) clickAudio.volume = parseFloat(volEfeitos); if(bubbleAudio) bubbleAudio.volume = parseFloat(volEfeitos); let rg = document.getElementById("rangeEfeitos"); if(rg) rg.value = volEfeitos; }

  if (localStorage.getItem("efeitosVisuais") === "false") { efeitosVisuaisAtivos = false; let chk = document.getElementById("checkEfeitos"); if(chk) chk.checked = true; aplicarEfeitosNaLogo(false); }

  let tempoSalvo = localStorage.getItem("tempoMusica");
  let estavaTocando = localStorage.getItem("musicaTocando"); 
  if (tempoSalvo !== null && musica) { musica.currentTime = parseFloat(tempoSalvo); }
  
  if (estavaTocando === "true" && !mutado && musica) {
    let p = musica.play();
    if (p !== undefined) { p.then(_ => { musicaIniciada = true; }).catch(e => { console.log("Bloqueio de autoplay."); }); }
  }

  renderizarConquistas();
  renderizarTrofeus();
  gerenciarBateriaQuimiChat(); 
  injetarElementosGlobais(); 
}

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', carregarConfiguracoes); } 
else { carregarConfiguracoes(); }

window.addEventListener("beforeunload", () => { 
  if(musica) { localStorage.setItem("tempoMusica", musica.currentTime); localStorage.setItem("musicaTocando", !musica.paused); }
});

function mudarTela(url) {
  if (isNavegando) return; 
  isNavegando = true;
  if (typeof assistenteReconhecimento !== 'undefined' && assistenteReconhecimento) { assistenteReconhecimento.onend = null; assistenteReconhecimento.stop(); }
  if (transicaoAudio) { transicaoAudio.volume = 1.0; transicaoAudio.currentTime = 0; transicaoAudio.play().catch(()=>{}); }
  document.body.classList.add("saindo");
  if(musica) { localStorage.setItem("tempoMusica", musica.currentTime); localStorage.setItem("musicaTocando", !musica.paused); }
  setTimeout(() => { window.location.href = url; }, 500);
}

document.addEventListener("click", () => { if (!musicaIniciada && !mutado && musica) { musica.play().catch(()=>{}); musicaIniciada = true; } }, { once: true });
function tocarSomClick() { if(clickAudio){ clickAudio.currentTime = 0; clickAudio.play().catch(()=>{}); } }

document.addEventListener("click", (e) => {
  let menu = document.getElementById("menu");
  if (menu && menu.style.display === "block" && !menu.contains(e.target)) { menu.style.display = "none"; }
  if (e.target.closest('button') || e.target.tagName === 'INPUT') return;
  if (!efeitosVisuaisAtivos) return;
  if(bubbleAudio){ bubbleAudio.currentTime = 0; bubbleAudio.play().catch(()=>{}); }
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
    if(musica) musica.muted = mutado; 
    if (!mutado && !musicaIniciada && musica) { musica.play(); musicaIniciada = true; } 
    let btn = document.getElementById("muteBtn");
    if(btn) btn.innerText = mutado ? "🔇" : "🔊"; 
    localStorage.setItem("mutado", mutado); 
}

function toggleMenu(event) { if (event) event.stopPropagation(); tocarSomClick(); let menu = document.getElementById("menu"); if(menu) menu.style.display = (menu.style.display === "block") ? "none" : "block"; }

function volumeMusica(v) { v = Math.max(0, Math.min(1, v)); if(musica) musica.volume = v; localStorage.setItem("volumeMusica", v); let rg = document.getElementById("rangeMusica"); if(rg) rg.value = v;}
function volumeEfeitos(v) { v = Math.max(0, Math.min(1, v)); if(clickAudio) clickAudio.volume = v; if(bubbleAudio) bubbleAudio.volume = v; localStorage.setItem("volumeEfeitos", v); let rg = document.getElementById("rangeEfeitos"); if(rg) rg.value = v;}

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
    if(toast) { toast.innerText = texto; toast.classList.remove("escondido"); setTimeout(() => { toast.classList.add("escondido"); }, 5000); }
}

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
    if(tipo === 'platina') { icone.innerText = "🏆"; icone.className = "trofeu-gigante"; titulo.innerText = "PLATINA ALCANÇADA!"; titulo.style.textShadow = "0 0 10px gold"; } 
    else { icone.innerText = "🏆"; icone.className = "trofeu-gigante prata-brilho"; titulo.innerText = "MOLÉCULAS CATALOGADAS!"; titulo.style.textShadow = "0 0 10px silver"; }
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

function abrirChat() { tocarSomClick(); document.getElementById("chat-overlay").style.display = "block"; document.body.style.overflow = "hidden"; }
function fecharChatBtn() { tocarSomClick(); document.getElementById("chat-overlay").style.display = "none"; document.body.style.overflow = "auto"; }
function abrirConquistas() { tocarSomClick(); document.getElementById("conquistas-overlay").style.display = "block"; document.body.style.overflow = "hidden"; }
function fecharConquistasBtn() { tocarSomClick(); document.getElementById("conquistas-overlay").style.display = "none"; document.body.style.overflow = "auto"; }

function fecharModais(event) { 
    if (event.target.classList.contains("modal-overlay")) { 
        event.target.style.display = "none"; 
        document.body.style.overflow = "auto"; 
    } 
}

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

function renderizarConquistas() {
  let container = document.getElementById("lista-conquistas");
  if (!container) return;
  container.innerHTML = ""; 
  let conquistadas = JSON.parse(localStorage.getItem("conquistasDesbloqueadas")) ||[];
  listaDeConquistas.forEach(conq => {
    let div = document.createElement("div"); let desbloqueada = conquistadas.includes(conq.id);
    div.className = `conquista-item ${desbloqueada ? 'conquista-desbloqueada' : ''}`;
    div.innerHTML = `<div class="conquista-icone">${desbloqueada ? '🏆' : '🔒'}</div><div class="conquista-texto">${conq.texto}</div>`;
    container.appendChild(div);
  });
}

const elementosTabela =[
    { n: 1, s: 'H', nome: 'Hidrogênio', l: '1', m: '1.008', c: 1, r: 1 }, { n: 2, s: 'He', nome: 'Hélio', l: '0', m: '4.002', c: 18, r: 1 },
    { n: 6, s: 'C', nome: 'Carbono', l: '4', m: '12.011', c: 14, r: 2 }, { n: 7, s: 'N', nome: 'Nitrogênio', l: '3', m: '14.007', c: 15, r: 2 },
    { n: 8, s: 'O', nome: 'Oxigênio', l: '2', m: '15.999', c: 16, r: 2 }
    // ... simplificado para o exemplo, mantenha sua lista completa aqui
];

function injetarElementosGlobais() {
    // TABELA PERIÓDICA
    if (!document.getElementById('tabela-overlay')) {
        const modalHTML = `
        <div id="tabela-overlay" class="modal-overlay" onclick="fecharModais(event)" style="z-index: 100000;">
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

    // QUIMICHAT
    if (!document.getElementById('quimichat-overlay')) {
        const chatHTML = `
        <div id="quimichat-overlay" class="modal-overlay" onclick="fecharModais(event)" style="z-index: 100000;">
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

    // MODAL PWA (INSTALAÇÃO)
    if (!document.getElementById('pwa-overlay')) {
        const pwaHTML = `
        <div id="pwa-overlay" class="modal-overlay" onclick="fecharModais(event)" style="z-index: 110000;">
          <div class="modal-box" style="max-width: 400px;">
            <div class="modal-header" style="background: #16a34a;">
              <h3>📲 Instalar Aplicativo</h3>
              <button onclick="fecharModaisPWA()">✖</button>
            </div>
            <div class="modal-body modal-pwa">
              <div id="pwa-conteudo-geral">
                  <img src="logo.png" alt="Logo">
                  <p>Deseja instalar <strong>Química Adômines</strong> no seu dispositivo para jogar em tela cheia e sem barras de navegação?</p>
                  <button class="btn-pwa-instalar" onclick="instalarPWA()">Instalar Agora</button>
              </div>
              <div id="pwa-instrucoes-ios" style="display: none; text-align: left;">
                  <p>No iPhone, o navegador não permite instalação direta.</p><br>
                  <p>1. Clique no ícone de <strong>Compartilhar</strong> (quadrado com seta para cima).</p>
                  <p>2. Role para baixo e clique em <strong>"Adicionar à Tela de Início"</strong>.</p>
                  <p>3. Clique em <strong>Adicionar</strong> no topo da tela.</p>
              </div>
            </div>
          </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', pwaHTML);
    }
}

function abrirTabelaPeriodica() { tocarSomClick(); document.getElementById("tabela-overlay").style.display = "flex"; document.body.style.overflow = "hidden"; let grade = document.getElementById("grade-tabela"); if(grade && grade.innerHTML === "") { renderizarTabelaPeriodica(); } }
function fecharTabelaPeriodica() { tocarSomClick(); document.getElementById("tabela-overlay").style.display = "none"; document.body.style.overflow = "auto"; }
function renderizarTabelaPeriodica() { let grade = document.getElementById("grade-tabela"); grade.innerHTML = ""; elementosTabela.forEach(el => { let div = document.createElement("div"); div.className = "elemento-tabela"; div.style.gridColumn = el.c; div.style.gridRow = el.r; div.innerHTML = `<span class="el-num">${el.n}</span><span class="el-sim">${el.s}</span>`; div.onclick = () => mostrarInfoElemento(el); grade.appendChild(div); }); }
function mostrarInfoElemento(el) { tocarSomClick(); document.getElementById("el-nome").innerText = el.nome; document.getElementById("el-simbolo").innerText = el.s; document.getElementById("el-numero").innerText = el.n; document.getElementById("el-massa").innerText = el.m; document.getElementById("el-ligacoes").innerText = el.l; }

function abrirQuimiChat() { tocarSomClick(); document.getElementById("quimichat-overlay").style.display = "flex"; document.body.style.overflow = "hidden"; setTimeout(()=>{ document.getElementById("quimichat-input").focus(); }, 100); }
function fecharQuimiChat() { tocarSomClick(); document.getElementById("quimichat-overlay").style.display = "none"; document.body.style.overflow = "auto"; }
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
    let proibidas =["futebol", "neymar", "filme", "capital", "politica", "bbb", "quem ganhou", "idade de"];
    let p = pergunta.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if(proibidas.some(x => p.includes(x))) return false;
    return true; 
}

async function enviarPerguntaQuimiChat(pergunta, lerVozAlta) {
    let container = document.getElementById("quimichat-mensagens");
    container.innerHTML += `<div class="msg-user">${pergunta}</div>`;
    container.scrollTop = container.scrollHeight;
    let dadosBateria = gerenciarBateriaQuimiChat();
    if (dadosBateria.restantes <= 0) {
        let msgSemEnergia = "Minha bateria acabou! Volte amanhã!";
        container.innerHTML += `<div class="msg-ai">${msgSemEnergia}</div>`;
        return;
    }
    if (!pareceQuimica(pergunta)) {
        let msgNaoQuimica = "Isso não parece ter relação com química!";
        container.innerHTML += `<div class="msg-ai">${msgNaoQuimica}</div>`;
        return;
    }
    let idTemp = "msg-" + Date.now();
    container.innerHTML += `<div id="${idTemp}" class="carregando-ai">Pensando...</div>`;
    container.scrollTop = container.scrollHeight;
    try {
        const respostaApi = await fetch(`/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pergunta: pergunta })
        });
        const dados = await respostaApi.json();
        document.getElementById(idTemp).remove();
        let respostaTexto = dados.candidates[0].content.parts[0].text.trim();
        respostaTexto = respostaTexto.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
        if (!respostaTexto.includes("Desculpe")) { descontarBateria(); }
        container.innerHTML += `<div class="msg-ai">${respostaTexto}</div>`;
        container.scrollTop = container.scrollHeight;
    } catch (e) {
        document.getElementById(idTemp).remove();
        container.innerHTML += `<div class="msg-ai" style="color:#ef4444">Erro na conexão.</div>`;
    }
}