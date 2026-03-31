let titulo = document.getElementById("titulo-modo");
let modoAtual = localStorage.getItem("modoAtual") || "inclusao-reconhecer";

let somClick = document.getElementById("click");
let somEstrela = document.getElementById("somEstrela");
let somGanhou = document.getElementById("somGanhou");

function tocarSom() { if(somClick) { somClick.currentTime=0; somClick.play().catch(()=>{}); } }
function mostrarMensagem(txt) {
    let t = document.getElementById("toast-mensagem");
    if(t) { t.innerText = txt; t.classList.remove("escondido"); setTimeout(()=> t.classList.add("escondido"), 3000); }
}

// ==========================================
// BANCO DE DADOS (Pedagogia Positiva)
// ==========================================
const bancoInclusao = {
    "inclusao-reconhecer":[
        { tipo: "pintura", img: "desenho1.png", titulo: "Pintura Livre: Isobutano", enunciado: "Sugestão: Pinte os Carbonos de preto e as Ligações de cinza!", info: "O Isobutano possui 4 carbonos, mas tem uma ramificação. Ele é muito usado em aerossóis e geladeiras!" },
        { tipo: "pintura", img: "desenho2.png", titulo: "Destacando o Halogênio", enunciado: "Sugestão: Use a cor Vermelha para destacar o átomo de Bromo (Br)!", info: "O Bromobenzeno possui um anel aromático (benzeno) com um átomo de Bromo grudado nele." },
        { tipo: "pontos", titulo: "Ligar os Pontos", enunciado: "Clique, segure e arraste a linha entre as letras para formar a palavra PROPANO!", info: "O Propano é um gás combustível, composto por 3 carbonos e 8 hidrogênios na sua cadeia principal." }
    ],
    "inclusao-relacionar":[
        { tipo: "lacunas", titulo: "Completar Frase", enunciado: "Arraste a palavra correta para a linha em branco.", texto: "O [LACUNA] é o principal gás encontrado no pum das vacas e no gás natural.", opcoes:["Etanol", "Metano", "Oxigênio"], resposta: "Metano", info: "O Metano (CH4) é o hidrocarboneto mais simples que existe!" },
        { tipo: "lacunas", titulo: "Completar Frase", enunciado: "Arraste a função química correta.", texto: "A terminação '-ol' no nome de uma molécula indica que ela é um [LACUNA].", opcoes:["Ácido", "Álcool", "Gás"], resposta: "Álcool", info: "Todo álcool possui um grupo OH (Hidroxila) ligado a um carbono!" },
        { tipo: "caca-palavras", titulo: "Caça Palavras", enunciado: "Clique na primeira letra e arraste até a última para encontrar as 5 palavras!", palavras:["CARBONO", "AGUA", "METANO", "ETANOL", "BENZENO"], info: "Ache as palavras escondidas na tabela. Elas podem estar na vertical, horizontal ou diagonal!" }
    ],
    "inclusao-interpretar":[
        { tipo: "quiz", titulo: "Interpretação de Texto", enunciado: "Leia o texto e escolha a opção correta.", textoLeitura: "A Acetona (Propanona) é um líquido incolor e com cheiro forte, muito conhecido por ser um excelente solvente, sendo usado no dia a dia para remover esmaltes das unhas.", pergunta: "Segundo o texto, para que a Acetona é muito usada no dia a dia?", opcoes:["Fazer bolhas em refrigerante", "Remover esmaltes", "Temperar saladas"], respostaIndex: 1, info: "A acetona possui 3 carbonos e uma dupla ligação com Oxigênio no meio da cadeia." },
        { tipo: "quiz", titulo: "Interpretação de Texto", enunciado: "Leia o texto e responda.", textoLeitura: "O Etino, popularmente chamado de acetileno, é um gás que queima com uma chama extremamente quente. Por isso, ele é a principal escolha dos soldadores para derreter metais.", pergunta: "Qual é a característica do Etino que o faz ser útil para soldadores?", opcoes:["Queimar com chama muito quente", "Ter um cheiro muito ruim", "Ser um líquido congelante"], respostaIndex: 0, info: "O Etino (C2H2) possui uma ligação tripla entre seus carbonos!" },
        { tipo: "quiz", titulo: "Interpretação de Texto Longa", enunciado: "Leia atentamente e escolha a opção.", textoLeitura: "Os combustíveis fósseis, como o petróleo, o carvão mineral e o gás natural, são formados pela decomposição de matéria orgânica ao longo de milhões de anos. Embora sejam fundamentais para a indústria moderna e para o transporte global, a queima desses compostos libera uma grande quantidade de Dióxido de Carbono (CO2) na atmosfera. Esse acúmulo de CO2 intensifica o efeito estufa, contribuindo diretamente para o aquecimento global e as mudanças climáticas.", pergunta: "De acordo com o texto, qual é o principal problema ambiental causado pela queima de combustíveis fósseis?", opcoes:["O resfriamento extremo do planeta Terra.", "A produção de energia renovável e limpa.", "A intensificação do efeito estufa pelo acúmulo de CO2.", "A formação de matéria orgânica no subsolo.", "A diminuição dos níveis de oxigênio nos oceanos."], respostaIndex: 2, info: "O CO2 retém o calor do Sol na Terra, causando o aumento das temperaturas globais." }
    ]
};

let faseAtual = 0;
let estrelasInclusivas = 0;
let infoAtual = "";
let textoParaLer = "";

if(modoAtual === "inclusao-reconhecer") titulo.innerText = "MODO ACESSÍVEL: Reconhecer";
if(modoAtual === "inclusao-relacionar") titulo.innerText = "MODO ACESSÍVEL: Relacionar";
if(modoAtual === "inclusao-interpretar") titulo.innerText = "MODO ACESSÍVEL: Interpretar";

function carregarFase() {
    let d = bancoInclusao[modoAtual][faseAtual];
    infoAtual = d.info;
    document.getElementById("texto-enunciado").innerText = d.enunciado;
    textoParaLer = d.enunciado;

    // Esconde todos
    document.getElementById("container-pintura").classList.add("escondido");
    document.getElementById("container-pontos").classList.add("escondido");
    document.getElementById("container-lacunas").classList.add("escondido");
    document.getElementById("container-caca-palavras").classList.add("escondido");
    document.getElementById("container-quiz").classList.add("escondido");

    if (d.tipo === "pintura") iniciarPintura(d);
    else if (d.tipo === "pontos") iniciarPontos(d);
    else if (d.tipo === "lacunas") iniciarLacunas(d);
    else if (d.tipo === "caca-palavras") iniciarCacaPalavras(d);
    else if (d.tipo === "quiz") iniciarQuiz(d);
}

// LER EM VOZ ALTA (Acessibilidade)
let btnOuvir = document.getElementById("btn-ler-texto");
if(btnOuvir) {
    btnOuvir.addEventListener("click", () => {
        tocarSom();
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); 
            let fala = new SpeechSynthesisUtterance(textoParaLer);
            fala.lang = "pt-BR";
            fala.rate = 0.9; 
            window.speechSynthesis.speak(fala);
        } else {
            mostrarMensagem("Seu navegador não suporta leitura em voz alta.");
        }
    });
}

window.mostrarInformacaoQuimica = function() {
    tocarSom();
    document.getElementById("texto-info-quimica").innerText = infoAtual;
    document.getElementById("info-overlay").style.display = "block";
}

// ==========================================
// 🎨 MÓDULO 1A: PINTURA EM CANVAS (MOTOR BLINDADO E CORRIGIDO!)
// ==========================================
let canvas = document.getElementById("canvas-pintura");
let ctx = canvas ? canvas.getContext("2d", { willReadFrequently: true }) : null;
let pintando = false;
let corAtual = "#333333";
let isBorracha = false;
let brushSize = 10;
let pintouAlgo = false; 
let zoomPintura = 1.0;
let historicoPintura =[];

// SÓ ATRELA OS EVENTOS DE MOUSE UMA ÚNICA VEZ PARA NÃO DAR CONFLITO
if (canvas) {
    canvas.addEventListener("pointerdown", startPosition);
    canvas.addEventListener("pointerup", endPosition);
    canvas.addEventListener("pointerout", endPosition);
    canvas.addEventListener("pointermove", draw);
}

function iniciarPintura(d) {
    document.getElementById("container-pintura").classList.remove("escondido");
    ctx.clearRect(0,0, canvas.width, canvas.height);
    
    // Imagem no fundo
    canvas.style.backgroundImage = `url('${d.img}')`;
    canvas.style.backgroundSize = "contain";
    canvas.style.backgroundPosition = "center";
    canvas.style.backgroundRepeat = "no-repeat";
    canvas.style.transform = `scale(1)`;
    zoomPintura = 1.0;
    
    pintouAlgo = false; 
    historicoPintura =[]; 
    salvarEstadoPintura(); 
    
    mudarCor('#333333', false);
}

// MÁGICA CORRIGIDA AQUI: Lê o mouse com ou sem zoom perfeitamente!
function getMousePos(e) {
    let rect = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
}

function startPosition(e) {
    e.preventDefault();
    pintando = true;
    salvarEstadoPintura();
    let pos = getMousePos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    draw(e);
}

function endPosition(e) {
    if(e) e.preventDefault();
    pintando = false;
    ctx.beginPath();
}

function draw(e) {
    if (!pintando) return;
    e.preventDefault();
    if (!isBorracha) pintouAlgo = true;

    let pos = getMousePos(e);
    
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round"; 
    
    if (isBorracha) {
        ctx.globalCompositeOperation = "destination-out"; // Borracha apaga só a tinta
        ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
        ctx.globalCompositeOperation = "source-over"; // Tinta
        ctx.strokeStyle = corAtual;
    }

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
}

function salvarEstadoPintura() {
    historicoPintura.push(canvas.toDataURL());
    if(historicoPintura.length > 5) historicoPintura.shift(); 
}

window.desfazerPintura = function() {
    tocarSom();
    if(historicoPintura.length > 1) {
        let imgData = historicoPintura.pop(); 
        let img = new Image(); 
        img.src = historicoPintura[historicoPintura.length - 1]; 
        img.onload = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0); };
    }
}

window.mudarZoomPintura = function(delta) {
    tocarSom();
    zoomPintura = Math.max(0.5, Math.min(2, zoomPintura + delta));
    canvas.style.transform = `scale(${zoomPintura})`;
    canvas.style.transformOrigin = "top left"; 
}

window.mudarCor = function(c, borracha) { 
    tocarSom(); corAtual = c; isBorracha = borracha; 
    document.querySelectorAll(".cor-btn").forEach(b => b.classList.remove("ativo"));
    if(event && event.target) event.target.classList.add("ativo");
}
window.mudarPincel = function(val) { brushSize = val; }

window.concluirFasePintura = function() { 
    tocarSom(); 
    if(!pintouAlgo) {
        mostrarMensagem("🎨 Você precisa colorir pelo menos um traço antes de terminar!");
        return;
    }
    ganharEstrelaInclusiva(); 
}


// ==========================================
// 🎨 MÓDULO 1B: LIGAR OS PONTOS
// ==========================================
let pontosAtivos =[];
let pontoAtualIndex = 0;
let ligandoPontos = false;
let mousePts = {x:0, y:0};

function iniciarPontos(d) {
    document.getElementById("container-pontos").classList.remove("escondido");
    textoParaLer = d.enunciado;
    infoAtual = d.info;
    document.getElementById("texto-enunciado").innerText = d.enunciado;

    pontosAtivos =[
        {l:'P', x:100, y:200}, {l:'R', x:200, y:100}, {l:'O', x:300, y:200},
        {l:'P', x:400, y:100}, {l:'A', x:500, y:200}, {l:'N', x:400, y:300}, {l:'O', x:200, y:300}
    ];
    pontoAtualIndex = 0;
    ligandoPontos = false;

    let wrapper = document.getElementById("dots-wrapper");
    wrapper.innerHTML = "";
    
    pontosAtivos.forEach((pt, i) => {
        let div = document.createElement("div");
        div.className = "ponto-ligar";
        div.innerText = pt.l;
        div.style.left = (pt.x - 20) + "px"; 
        div.style.top = (pt.y - 20) + "px";
        div.dataset.idx = i;
        div.style.userSelect = "none"; 
        wrapper.appendChild(div);
    });
    
    let cPts = document.getElementById("canvas-pontos");
    
    wrapper.onpointerdown = (e) => {
        e.preventDefault();
        let dot = e.target.closest('.ponto-ligar');
        if (dot && parseInt(dot.dataset.idx) === pontoAtualIndex - 1) {
            ligandoPontos = true;
            tocarSom();
            atualizarMouseCanvasPontos(e, cPts);
            desenharLinhasPontos();
        }
    };
    
    wrapper.onpointermove = (e) => {
        if (!ligandoPontos) return;
        e.preventDefault();
        atualizarMouseCanvasPontos(e, cPts);
        
        let el = document.elementFromPoint(e.clientX, e.clientY);
        let dot = el ? el.closest('.ponto-ligar') : null;
        
        if (dot && parseInt(dot.dataset.idx) === pontoAtualIndex) {
            pontoAtualIndex++;
            dot.classList.add("ponto-ativo");
            if(somClick) { somClick.currentTime=0; somClick.play().catch(()=>{}); }
            
            if (pontoAtualIndex === pontosAtivos.length) {
                ligandoPontos = false;
                desenharLinhasPontos();
                setTimeout(() => ganharEstrelaInclusiva(), 1000);
                return;
            }
        }
        desenharLinhasPontos();
    };

    wrapper.onpointerup = () => {
        ligandoPontos = false;
        desenharLinhasPontos();
    };
    
    wrapper.onpointerleave = () => {
        ligandoPontos = false;
        desenharLinhasPontos();
    };

    wrapper.children[0].classList.add("ponto-ativo");
    pontoAtualIndex = 1;
    desenharLinhasPontos();
}

function atualizarMouseCanvasPontos(e, cPts) {
    let rect = cPts.getBoundingClientRect();
    mousePts.x = (e.clientX - rect.left) * (cPts.width / rect.width);
    mousePts.y = (e.clientY - rect.top) * (cPts.height / rect.height);
}

function desenharLinhasPontos() {
    let cPts = document.getElementById("canvas-pontos");
    if(!cPts) return;
    let ctxP = cPts.getContext("2d");
    ctxP.clearRect(0,0,cPts.width, cPts.height);
    
    ctxP.lineWidth = 6;
    ctxP.lineCap = "round";
    ctxP.lineJoin = "round";
    ctxP.strokeStyle = "#0284c7";

    ctxP.beginPath();
    if (pontoAtualIndex > 0) {
        ctxP.moveTo(pontosAtivos[0].x, pontosAtivos[0].y);
        for (let i = 1; i < pontoAtualIndex; i++) {
            ctxP.lineTo(pontosAtivos[i].x, pontosAtivos[i].y);
        }
        if (ligandoPontos && pontoAtualIndex < pontosAtivos.length) {
            ctxP.lineTo(mousePts.x, mousePts.y);
        }
    }
    ctxP.stroke();
}


// ==========================================
// 🧩 MÓDULO 2: LACUNAS (Arrastar Palavra)
// ==========================================
let respostaLacunaAtual = "";

function iniciarLacunas(d) {
    document.getElementById("container-lacunas").classList.remove("escondido");
    textoParaLer = d.enunciado + " A frase é: " + d.texto.replace("[LACUNA]", "espaço em branco");
    infoAtual = d.info;
    
    let boxFrase = document.getElementById("frase-lacuna");
    boxFrase.innerHTML = d.texto.replace("[LACUNA]", `<span class="lacuna-drop" id="alvo-lacuna" ondragover="allowDrop(event)" ondragleave="leaveDrop(event)" ondrop="dropPalavra(event)">[Arraste aqui]</span>`);
    
    respostaLacunaAtual = d.resposta;

    let banco = document.getElementById("banco-palavras");
    banco.innerHTML = "";
    
    let ops =[...d.opcoes].sort(() => Math.random() - 0.5);
    ops.forEach(op => {
        let div = document.createElement("div");
        div.className = "palavra-drag";
        div.innerText = op;
        div.draggable = true;
        div.ondragstart = (e) => { e.dataTransfer.setData("text", op); tocarSom(); };
        banco.appendChild(div);
    });
}

window.allowDrop = function(e) { e.preventDefault(); e.target.classList.add("hover"); }
window.leaveDrop = function(e) { e.target.classList.remove("hover"); }

window.dropPalavra = function(e) {
    e.preventDefault();
    e.target.classList.remove("hover");
    let arrastada = e.dataTransfer.getData("text");
    
    if(arrastada === respostaLacunaAtual) {
        e.target.innerText = arrastada;
        e.target.style.background = "#16a34a";
        e.target.style.color = "white";
        tocarSom(); 
        setTimeout(() => ganharEstrelaInclusiva(), 1000);
    } else {
        mostrarMensagem("🤔 Hmm, essa palavra não encaixa bem. Vamos tentar outra?");
    }
}


// ==========================================
// 🧩 MÓDULO 2B: CAÇA-PALAVRAS
// ==========================================
const gridCP =[
    "CARBONORTM",
    "EKTXPWAGUA",
    "TLBENZENOX",
    "AOYPTOMODT",
    "NMYLXQZRWP",
    "OUIVBPTAFN",
    "LPMETANOQQ",
    "KPACEZUQMX",
    "WTCLIGACAO",
    "PLPWCRUJNM"
];
let cpWordsEncontradas = 0;
let cpTotalWords = 5;
let cpIsDragging = false;
let cpStartCell = null;
let cpLines =[]; 

function iniciarCacaPalavras(d) {
    document.getElementById("container-caca-palavras").classList.remove("escondido");
    textoParaLer = d.enunciado + " As palavras são: " + d.palavras.join(", ");
    infoAtual = d.info;
    cpWordsEncontradas = 0; cpTotalWords = d.palavras.length; cpLines =[];

    let banco = document.getElementById("lista-palavras-caca");
    banco.innerHTML = "";
    d.palavras.forEach(p => {
        let div = document.createElement("div");
        div.className = "palavra-drag";
        div.innerText = p;
        div.id = "cp-word-" + p;
        banco.appendChild(div);
    });

    let gridDiv = document.getElementById("grid-letras");
    gridDiv.innerHTML = "";
    for(let r=0; r<10; r++){
        for(let c=0; c<10; c++){
            let cell = document.createElement("div");
            cell.className = "letra-celula"; cell.innerText = gridCP[r][c]; cell.dataset.r = r; cell.dataset.c = c;
            gridDiv.appendChild(cell);
        }
    }

    let canvasCP = document.getElementById("canvas-caca-palavras");
    canvasCP.width = 420; canvasCP.height = 420; 
    let ctxCP = canvasCP.getContext("2d");
    ctxCP.clearRect(0,0, canvasCP.width, canvasCP.height);

    gridDiv.onpointerdown = (e) => {
        let cell = e.target.closest(".letra-celula");
        if(cell) { cpIsDragging = true; cpStartCell = cell; tocarSom(); }
    };
    gridDiv.onpointermove = (e) => {
        if(!cpIsDragging || !cpStartCell) return;
        let rect = canvasCP.getBoundingClientRect();
        let mouseX = e.clientX - rect.left; let mouseY = e.clientY - rect.top;
        desenharLinhasCP(ctxCP, mouseX, mouseY); 
    };
    gridDiv.onpointerup = (e) => {
        if(!cpIsDragging) return;
        cpIsDragging = false;
        let endCell = document.elementFromPoint(e.clientX, e.clientY).closest(".letra-celula");
        if(endCell) checarPalavraCP(cpStartCell, endCell, d.palavras);
        desenharLinhasCP(ctxCP); 
    };
    gridDiv.onpointerleave = () => { cpIsDragging = false; desenharLinhasCP(ctxCP); };
}

function desenharLinhasCP(ctxCP, mouseX, mouseY) {
    ctxCP.clearRect(0,0, 420, 420);
    ctxCP.lineWidth = 20; ctxCP.lineCap = "round";
    
    cpLines.forEach(l => {
        ctxCP.strokeStyle = "rgba(34, 197, 94, 0.4)";
        ctxCP.beginPath(); ctxCP.moveTo(l.x1, l.y1); ctxCP.lineTo(l.x2, l.y2); ctxCP.stroke();
    });

    if(cpIsDragging && cpStartCell && mouseX !== undefined) {
        ctxCP.strokeStyle = "rgba(2, 132, 199, 0.4)";
        let x1 = (parseInt(cpStartCell.dataset.c) * 42) + 21;
        let y1 = (parseInt(cpStartCell.dataset.r) * 42) + 21;
        ctxCP.beginPath(); ctxCP.moveTo(x1, y1); ctxCP.lineTo(mouseX, mouseY); ctxCP.stroke();
    }
}

function checarPalavraCP(sCell, eCell, palavrasValidas) {
    let r1 = parseInt(sCell.dataset.r), c1 = parseInt(sCell.dataset.c);
    let r2 = parseInt(eCell.dataset.r), c2 = parseInt(eCell.dataset.c);
    
    let dR = r2 - r1; let dC = c2 - c1;
    if(dR !== 0 && dC !== 0 && Math.abs(dR) !== Math.abs(dC)) return; 
    
    let stepR = dR === 0 ? 0 : dR / Math.abs(dR);
    let stepC = dC === 0 ? 0 : dC / Math.abs(dC);
    
    let str = "";
    let currR = r1, currC = c1;
    let len = Math.max(Math.abs(dR), Math.abs(dC)) + 1;

    for(let i=0; i<len; i++) {
        str += gridCP[currR][currC];
        currR += stepR; currC += stepC;
    }

    let revStr = str.split("").reverse().join("");
    let palavraAchada = palavrasValidas.find(p => p === str || p === revStr);
    
    if(palavraAchada) {
        let divP = document.getElementById("cp-word-" + palavraAchada);
        if(!divP.classList.contains("palavra-encontrada")) {
            tocarSom();
            divP.classList.add("palavra-encontrada");
            cpLines.push({ x1: (c1*42)+21, y1: (r1*42)+21, x2: (c2*42)+21, y2: (r2*42)+21 });
            cpWordsEncontradas++;
            if(cpWordsEncontradas === cpTotalWords) {
                setTimeout(() => ganharEstrelaInclusiva(), 1000);
            }
        }
    } else {
        mostrarMensagem("Essa não é uma das palavras! Tente novamente.");
    }
}


// ==========================================
// 📖 MÓDULO 3: QUIZ MÚLTIPLA ESCOLHA
// ==========================================
function iniciarQuiz(d) {
    document.getElementById("container-quiz").classList.remove("escondido");
    textoParaLer = d.enunciado + " O texto diz: " + d.textoLeitura + " A pergunta é: " + d.pergunta;
    infoAtual = d.info;

    document.getElementById("texto-leitura").innerHTML = `<strong>${d.textoLeitura}</strong><br><br>${d.pergunta}`;
    
    let boxOpcoes = document.getElementById("opcoes-quiz");
    boxOpcoes.innerHTML = "";

    d.opcoes.forEach((op, index) => {
        let btn = document.createElement("button");
        btn.className = "btn-opcao-quiz";
        btn.innerText = op;
        btn.onclick = () => {
            tocarSom();
            if(index === d.respostaIndex) {
                btn.style.background = "#16a34a"; btn.style.color = "white";
                setTimeout(() => ganharEstrelaInclusiva(), 1000);
            } else {
                btn.classList.add("opcao-errada");
                mostrarMensagem("💡 Quase lá! Leia com calma e tente outra alternativa.");
                setTimeout(()=> btn.classList.remove("opcao-errada"), 500);
            }
        };
        boxOpcoes.appendChild(btn);
    });
}

// ==========================================
// SISTEMA DE ESTRELAS E CHEATS
// ==========================================
function ganharEstrelaInclusiva() {
    estrelasInclusivas++;
    if(somEstrela) { somEstrela.currentTime=0; somEstrela.play().catch(()=>{}); }
    
    let spans = document.getElementById("estrelas-container").querySelectorAll("span");
    for(let i=0; i<estrelasInclusivas; i++) { spans[i].classList.add("ganha"); spans[i].innerText = "★"; }

    document.getElementById("modal-estrela").style.display = "flex";

    setTimeout(() => {
        window.proximaFaseInclusiva();
    }, 2000);
}

window.proximaFaseInclusiva = function() {
    document.getElementById("modal-estrela").style.display = "none";
    
    faseAtual++;
    if(faseAtual < bancoInclusao[modoAtual].length) {
        carregarFase();
    } else {
        if(somGanhou) { somGanhou.currentTime=0; somGanhou.play().catch(()=>{}); }
        if(typeof desbloquearConquista === "function") desbloquearConquista("c7");
        
        let modalVit = document.getElementById("modal-vitoria-inclusao");
        if(modalVit) modalVit.style.display = "flex";
        
        setTimeout(() => mudarTela("modos.html"), 3000);
    }
};

window.cheatCompletarFase = function() {
    ganharEstrelaInclusiva();
};

window.cheatEstrelas = function(qtd) {
    estrelasInclusivas = Math.min(qtd, 3);
    let spans = document.getElementById("estrelas-container").querySelectorAll("span");
    for(let i=0; i<3; i++) { 
        if(i < estrelasInclusivas) { spans[i].classList.add("ganha"); spans[i].innerText = "★"; } 
        else { spans[i].classList.remove("ganha"); spans[i].innerText = "★"; } 
    }
    
    if (estrelasInclusivas >= 3) {
        if(somGanhou) { somGanhou.currentTime=0; somGanhou.play().catch(()=>{}); }
        if(typeof desbloquearConquista === "function") desbloquearConquista("c7");
        let modalVit = document.getElementById("modal-vitoria-inclusao");
        if(modalVit) modalVit.style.display = "flex";
        setTimeout(() => mudarTela("modos.html"), 3000);
    } else {
        faseAtual = estrelasInclusivas;
        carregarFase();
        mostrarMensagem(`Cheat ativado! Avançando para a fase ${estrelasInclusivas + 1}.`);
    }
};

// ==========================================
// INICIALIZAÇÃO
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    carregarFase();
});