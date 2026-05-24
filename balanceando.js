// ==========================================
// MODO BALANCEANDO - QUÍMICA ADÔMINES
// ==========================================
let modoAtual = localStorage.getItem("modoAtual") || "balanceando-facil";
let titulo = document.getElementById("titulo-modo");
let hasteBalanca = document.getElementById("balanca-haste");
let cordaEsq = document.getElementById("corda-esquerda");
let cordaDir = document.getElementById("corda-direita");
let pratoReagentes = document.getElementById("prato-reagentes");
let pratoProdutos = document.getElementById("prato-produtos");
let areaEquacao = document.getElementById("area-equacao");

let somErro = document.getElementById("somErro");
let somCorreto = document.getElementById("somCorreto");
let somEstrela = document.getElementById("somEstrela");
let somGanhou = document.getElementById("somGanhou");
let somPerdeu = document.getElementById("somPerdeu");

// Tabela Padrão CPK (Cores e Tamanhos dos Átomos)
const CORES_ATOMOS = {
    'H': { cor: '#ffffff', texto: '#000', size: 14 },
    'O': { cor: '#ef4444', texto: '#fff', size: 20 },
    'C': { cor: '#333333', texto: '#fff', size: 22 },
    'N': { cor: '#3b82f6', texto: '#fff', size: 20 },
    'Fe':{ cor: '#d97706', texto: '#fff', size: 24 },
    'Na':{ cor: '#8b5cf6', texto: '#fff', size: 22 },
    'Cl':{ cor: '#22c55e', texto: '#fff', size: 22 },
    'K': { cor: '#a855f7', texto: '#fff', size: 24 },
    'Al':{ cor: '#94a3b8', texto: '#000', size: 22 },
    'Ca':{ cor: '#cbd5e1', texto: '#000', size: 24 },
    'Zn':{ cor: '#64748b', texto: '#fff', size: 22 },
    'Mg':{ cor: '#84cc16', texto: '#000', size: 22 },
    'S': { cor: '#eab308', texto: '#000', size: 22 },
    'Mn':{ cor: '#ec4899', texto: '#fff', size: 22 },
    'P': { cor: '#f97316', texto: '#fff', size: 22 },
    'Si':{ cor: '#6ee7b7', texto: '#000', size: 22 },
    'Cu':{ cor: '#b45309', texto: '#fff', size: 22 }
};

const bancoFases = {
    "balanceando-facil": [
        { reagentes: ["H2", "O2"], produtos: ["H2O"] },
        { reagentes: ["N2", "H2"], produtos: ["NH3"] },
        { reagentes: ["Fe", "O2"], produtos: ["Fe2O3"] },
        { reagentes: ["Na", "Cl2"], produtos: ["NaCl"] },
        { reagentes: ["K", "H2O"], produtos: ["KOH", "H2"] }
    ],
    "balanceando-medio": [
        { reagentes: ["Al", "O2"], produtos: ["Al2O3"] },
        { reagentes: ["Ca", "H2O"], produtos: ["Ca(OH)2", "H2"] },
        { reagentes: ["Zn", "HCl"], produtos: ["ZnCl2", "H2"] },
        { reagentes: ["Fe", "H2O"], produtos: ["Fe3O4", "H2"] },
        { reagentes: ["Mg", "N2"], produtos: ["Mg3N2"] }
    ],
    "balanceando-dificil": [
        { reagentes: ["C2H6", "O2"], produtos: ["CO2", "H2O"] },
        { reagentes: ["FeS2", "O2"], produtos: ["Fe2O3", "SO2"] },
        { reagentes: ["NH3", "O2"], produtos: ["NO", "H2O"] },
        { reagentes: ["Al", "HCl"], produtos: ["AlCl3", "H2"] },
        { reagentes: ["Na2CO3", "HCl"], produtos: ["NaCl", "H2O", "CO2"] }
    ],
    "balanceando-impossivel": [
        { reagentes: ["C6H12O6", "O2"], produtos: ["CO2", "H2O"] },
        { reagentes: ["KMnO4", "HCl"], produtos: ["KCl", "MnCl2", "H2O", "Cl2"] },
        { reagentes: ["Fe2(SO4)3", "KOH"], produtos: ["Fe(OH)3", "K2SO4"] },
        { reagentes: ["Ca3(PO4)2", "SiO2", "C"], produtos: ["P4", "CaSiO3", "CO"] },
        { reagentes: ["Cu", "HNO3"], produtos: ["Cu(NO3)2", "NO2", "H2O"] }
    ]
};

let indexFaseAtual = 0;
let estrelasGanhas = 0;
let vidasIniciais = 3;
let vidasRestantes = vidasIniciais;
let coeficientesReagentes = [];
let coeficientesProdutos = [];
let faseAtual = null;

let nivelDisplay = modoAtual.replace("balanceando-", "").toUpperCase();
titulo.innerText = `BALANCEANDO (${nivelDisplay})`;

function iniciarFase() {
    faseAtual = bancoFases[modoAtual][indexFaseAtual];
    coeficientesReagentes = new Array(faseAtual.reagentes.length).fill(1);
    coeficientesProdutos = new Array(faseAtual.produtos.length).fill(1);
    
    renderizarEquacao();
    atualizarBalanca();
    atualizarHUD();
}

function atualizarHUD() {
    let spans = document.getElementById("estrelas-container").querySelectorAll("span");
    spans.forEach((sp, index) => {
        if(index < estrelasGanhas) { sp.classList.add("ganha"); sp.innerText = "★"; }
        else { sp.classList.remove("ganha"); }
    });
    document.getElementById("vidas-container").innerHTML = "❤️".repeat(vidasRestantes) + "🖤".repeat(vidasIniciais - vidasRestantes);
}

function formatarFormula(texto) {
    return texto.replace(/(\d+)/g, '<sub>$1</sub>');
}

function alterarCoeficiente(tipo, indice, valor) {
    if(typeof tocarSomClick === "function") tocarSomClick();
    if(tipo === 'R') {
        coeficientesReagentes[indice] = Math.max(1, coeficientesReagentes[indice] + valor);
    } else {
        coeficientesProdutos[indice] = Math.max(1, coeficientesProdutos[indice] + valor);
    }
    renderizarEquacao();
    atualizarBalanca();
}

function renderizarEquacao() {
    areaEquacao.innerHTML = "";
    
    faseAtual.reagentes.forEach((mol, idx) => {
        if(idx > 0) areaEquacao.innerHTML += `<div class="sinal-mais">+</div>`;
        areaEquacao.innerHTML += `
        <div class="termo-equacao">
            <div class="bloco-coeficiente">
                <button class="btn-coeficiente" onclick="alterarCoeficiente('R', ${idx}, 1)">+</button>
                <div class="valor-coeficiente">${coeficientesReagentes[idx]}</div>
                <button class="btn-coeficiente minus" onclick="alterarCoeficiente('R', ${idx}, -1)">-</button>
            </div>
            <div class="texto-molecula">${formatarFormula(mol)}</div>
        </div>`;
    });

    areaEquacao.innerHTML += `<div class="sinal-seta">➔</div>`;

    faseAtual.produtos.forEach((mol, idx) => {
        if(idx > 0) areaEquacao.innerHTML += `<div class="sinal-mais">+</div>`;
        areaEquacao.innerHTML += `
        <div class="termo-equacao">
            <div class="bloco-coeficiente">
                <button class="btn-coeficiente" onclick="alterarCoeficiente('P', ${idx}, 1)">+</button>
                <div class="valor-coeficiente">${coeficientesProdutos[idx]}</div>
                <button class="btn-coeficiente minus" onclick="alterarCoeficiente('P', ${idx}, -1)">-</button>
            </div>
            <div class="texto-molecula">${formatarFormula(mol)}</div>
        </div>`;
    });
}

// -----------------------------------------------------
// ENGINE GEOMÉTRICA DE MOLÉCULAS (REGRA UNIVERSAL)
// -----------------------------------------------------

function extrairElementos(formula) {
    let elementos = [];
    // Um regex ninja que lê Fe2, S, O4 e lida com números escondidos
    let regex = /([A-Z][a-z]*)(\d*)/g;
    let match;
    while((match = regex.exec(formula)) !== null) {
        let sigla = match[1];
        let qtd = match[2] ? parseInt(match[2]) : 1;
        for(let i=0; i<qtd; i++) elementos.push(sigla);
    }
    return elementos;
}

function desenharMoleculaGeometria(formula) {
    let atomos = extrairElementos(formula);
    let caixa = document.createElement("div");
    caixa.className = "molecula-visual";
    
    // Altura e largura base da caixa invisível que segura os átomos
    caixa.style.width = "40px"; 
    caixa.style.height = "40px";

    if (atomos.length === 1) {
        // Átomo solto (Ex: Fe)
        caixa.appendChild(criarBolinha(atomos[0], 0, 0));
    } 
    else if (atomos.length === 2) {
        // Molécula Diatômica (Ex: O2, H2, NaCl) -> Ficam lado a lado
        caixa.style.width = "50px";
        caixa.appendChild(criarBolinha(atomos[0], -12, 0));
        caixa.appendChild(criarBolinha(atomos[1], 12, 0));
    } 
    else if (formula === "H2O") {
        // H2O Geometria Angular (Oxigênio no centro, H nas diagonais baixas)
        caixa.appendChild(criarBolinha('O', 0, -8)); 
        caixa.appendChild(criarBolinha('H', -14, 8)); 
        caixa.appendChild(criarBolinha('H', 14, 8)); 
    } 
    else if (formula === "CO2" || formula === "SO2" || formula === "NO2") {
        // Geometria Linear (Ex: O-C-O)
        caixa.style.width = "60px";
        caixa.appendChild(criarBolinha(atomos[0], 0, 0)); // Central
        caixa.appendChild(criarBolinha(atomos[1], -18, 0)); // Esquerda
        caixa.appendChild(criarBolinha(atomos[2], 18, 0)); // Direita
    }
    else if (formula === "NH3" || formula === "AlCl3") {
        // Geometria Piramidal (Ex: N no centro, 3 H em volta)
        caixa.appendChild(criarBolinha(atomos[0], 0, -10)); // Central sobe um pouco
        caixa.appendChild(criarBolinha(atomos[1], -15, 10)); // Esq baixo
        caixa.appendChild(criarBolinha(atomos[2], 15, 10)); // Dir baixo
        caixa.appendChild(criarBolinha(atomos[3], 0, 15)); // Meio baixo
    }
    else if (formula === "CH4") {
        // Tetraédrica
        caixa.appendChild(criarBolinha('C', 0, 0)); 
        caixa.appendChild(criarBolinha('H', 0, -18)); // Cima
        caixa.appendChild(criarBolinha('H', -18, 6)); // Esq
        caixa.appendChild(criarBolinha('H', 18, 6)); // Dir
        caixa.appendChild(criarBolinha('H', 0, 18)); // Baixo
    }
    else {
        // Moléculas complexas (Ex: Fe2(SO4)3, C6H12O6)
        // Para não estourar a tela, eu faço um "Cacho de Uva" simétrico.
        let central = criarBolinha(atomos[0], 0, 0);
        central.style.zIndex = 10;
        caixa.appendChild(central);
        
        let raioAgrupamento = atomos.length > 8 ? 20 : 15;
        caixa.style.width = (raioAgrupamento * 2 + 20) + "px";
        caixa.style.height = (raioAgrupamento * 2 + 20) + "px";

        for (let i = 1; i < atomos.length; i++) {
            let angulo = (i / (atomos.length - 1)) * (Math.PI * 2);
            let px = Math.cos(angulo) * raioAgrupamento;
            let py = Math.sin(angulo) * raioAgrupamento;
            let b = criarBolinha(atomos[i], px, py);
            b.style.zIndex = 5;
            caixa.appendChild(b);
        }
    }
    return caixa;
}

function criarBolinha(nomeElemento, offsetX, offsetY) {
    let bolinha = document.createElement("div");
    bolinha.className = "atomo-bolinha";
    let estilo = CORES_ATOMOS[nomeElemento] || { cor: '#555', texto: '#fff', size: 15 };
    
    bolinha.style.backgroundColor = estilo.cor;
    bolinha.style.color = estilo.texto;
    bolinha.style.width = estilo.size + "px";
    bolinha.style.height = estilo.size + "px";
    bolinha.innerText = nomeElemento;
    
    // Posicionamento exato fornecido pela função de geometria
    bolinha.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    return bolinha;
}

function desenharPrato(pratoElemento, moleculas, coeficientes) {
    pratoElemento.innerHTML = "";
    
    let totalMols = coeficientes.reduce((a,b)=>a+b, 0);
    let scale = 1;
    if(totalMols > 6) scale = 0.8;
    if(totalMols > 10) scale = 0.6;
    if(totalMols > 15) scale = 0.45; // Para as equações impossíveis brutais

    moleculas.forEach((mol, idx) => {
        let coef = coeficientes[idx];
        for(let c=0; c<coef; c++) {
            let divMol = desenharMoleculaGeometria(mol);
            divMol.style.transform = `scale(${scale})`;
            pratoElemento.appendChild(divMol);
        }
    });
}

function atualizarBalanca() {
    desenharPrato(pratoReagentes, faseAtual.reagentes, coeficientesReagentes);
    desenharPrato(pratoProdutos, faseAtual.produtos, coeficientesProdutos);

    // Simplificação de massa rápida: cada átomo vale 1 ponto de peso
    let massaEsq = 0; let massaDir = 0;
    
    faseAtual.reagentes.forEach((mol, idx) => {
        massaEsq += (extrairElementos(mol).length * coeficientesReagentes[idx]);
    });
    faseAtual.produtos.forEach((mol, idx) => {
        massaDir += (extrairElementos(mol).length * coeficientesProdutos[idx]);
    });
    
    let diferenca = massaEsq - massaDir;
    let angulo = diferenca * 2.5; 
    
    angulo = Math.max(-25, Math.min(25, angulo));

    hasteBalanca.style.transform = `translate(-50%, 0) rotate(${angulo}deg)`;
    cordaEsq.style.transform = `rotate(${-angulo}deg)`;
    cordaDir.style.transform = `rotate(${-angulo}deg)`;
}

// -----------------------------------------------------
// LÓGICA DE JOGO, VERIFICAÇÃO E NAVEGAÇÃO
// -----------------------------------------------------
window.verificarBalanceamento = function() {
    // Se a balança não estiver perfeitamente reta (ângulo zero), errou!
    let angHaste = hasteBalanca.style.transform;
    if (!angHaste.includes("rotate(0deg)")) {
        perderVidaDesafio("A balança não está equilibrada! Ajuste os botões de mais e menos e tente novamente.");
        return;
    }

    // Se está equilibrada, vamos checar a simplificação Matemática (MDC)
    let todosCoeficientes = [...coeficientesReagentes, ...coeficientesProdutos];
    
    let mdc = todosCoeficientes[0];
    for (let i = 1; i < todosCoeficientes.length; i++) {
        let a = mdc; let b = todosCoeficientes[i];
        while (b !== 0) { let temp = b; b = a % b; a = temp; }
        mdc = a;
    }

    if (mdc > 1) {
        // Balança tá certa, mas dá pra simplificar!
        mostrarMensagemGlob("✅ Balanceado! (1 Estrela)\nDivida todos os números por " + mdc + " para ganhar a segunda estrela!");
        ganharEstrela();
        // Não avança de fase, deixa ele continuar mexendo pra ganhar a outra
    } else {
        // Perfeito e simplificado! Duas estrelas!
        if(somCorreto) { somCorreto.currentTime=0; somCorreto.play().catch(()=>{}); }
        ganharEstrela();
        setTimeout(() => { ganharEstrela(); }, 800); // Dá as duas de uma vez
        
        setTimeout(() => {
            if(estrelasGanhas >= 10) { encerrarDesafioBalanceando(); } 
            else { window.pularFaseBalanceando(); }
        }, 1500);
    }
};

function perderVidaDesafio(motivo) {
    if(somErro) { somErro.currentTime=0; somErro.play().catch(()=>{}); }
    vidasRestantes--; 
    atualizarHUD();
    
    if(vidasRestantes <= 0) { 
        encerrarDesafioBalanceando(false); 
    } else { 
        document.getElementById("texto-erro-desafio").innerText = motivo;
        document.getElementById("modal-erro-desafio").style.display = "flex";
    }
}

function ganharEstrela() {
    estrelasGanhas++;
    if(somEstrela) { somEstrela.currentTime=0; somEstrela.play().catch(()=>{}); }
    atualizarHUD();
}

window.pularFaseBalanceando = function() {
    if(typeof tocarSomClick === "function") tocarSomClick();
    if (indexFaseAtual < bancoFases[modoAtual].length - 1) {
        indexFaseAtual++;
        iniciarFase();
    } else {
        mostrarMensagemGlob("⚠️ Esta já é a última fase deste nível!");
    }
};

window.voltarFaseBalanceando = function() {
    if(typeof tocarSomClick === "function") tocarSomClick();
    if (indexFaseAtual > 0) {
        indexFaseAtual--;
        iniciarFase();
    } else {
        mostrarMensagemGlob("⚠️ Esta já é a primeira fase!");
    }
};

window.encerrarDesafioBalanceando = function() {
    if(typeof tocarSomClick === "function") tocarSomClick();
    clearInterval(intervaloCronometro);
    
    document.getElementById("modal-resultado-desafio").style.display = "flex";
    let box = document.getElementById("box-resultado-desafio");
    let header = document.getElementById("header-resultado-desafio");
    let titulo = document.getElementById("texto-resultado-desafio");
    let sub = document.getElementById("subtexto-resultado-desafio");
    let btn = document.getElementById("btn-resultado-desafio");

    if (estrelasGanhas >= 10) {
        box.style.border = "4px solid #16a34a";
        box.style.background = "linear-gradient(135deg, #f0fdf4, #dcfce7)";
        header.style.background = "#16a34a"; header.style.borderBottom = "4px solid #15803d";
        titulo.style.color = "#15803d"; btn.style.background = "#16a34a";
        titulo.innerText = "Mestre da Estequiometria! ⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐";
        sub.innerText = "Você balanceou tudo com perfeição!";
        if(somGanhou) { somGanhou.currentTime=0; somGanhou.play().catch(()=>{}); }
        // Daria a conquista do balanceando aqui!
    } else {
        box.style.border = "4px solid #ef4444";
        box.style.background = "linear-gradient(135deg, #fef2f2, #fee2e2)";
        header.style.background = "#ef4444"; header.style.borderBottom = "4px solid #b91c1c";
        titulo.style.color = "#b91c1c"; btn.style.background = "#ef4444";
        titulo.innerText = "Fim do Teste!";
        
        if(somPerdeu) { somPerdeu.currentTime=0; somPerdeu.play().catch(()=>{}); }
        if (estrelasGanhas > 0) { sub.innerText = `Você conseguiu ${estrelasGanhas} estrela(s). Pratique mais as simplificações!`; } 
        else { sub.innerText = "Não desanime! Ajustar coeficientes requer muita atenção."; }
    }
};

// Start automático ao abrir a tela
iniciarFase();