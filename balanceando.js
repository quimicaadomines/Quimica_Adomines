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

// ==========================================
// TABELA DE MASSAS ATÔMICAS REAIS (LEI DE LAVOISIER)
// ==========================================
const MASSAS_ATOMICAS = {
    'H': 1, 'C': 12, 'N': 14, 'O': 16, 'Na': 23, 'Mg': 24, 'Al': 27,
    'Si': 28, 'P': 31, 'S': 32, 'Cl': 35.5, 'K': 39, 'Ca': 40, 'Mn': 55,
    'Fe': 56, 'Cu': 63.5, 'Zn': 65.4
};

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
let vidasIniciais = modoAtual === "balanceando-impossivel" ? 2 : 3;
let vidasRestantes = vidasIniciais;
let coeficientesReagentes = [];
let coeficientesProdutos = [];
let faseAtual = null;

let tempoMaximo = 90; // 01:30
let tempoRestante = tempoMaximo;
let intervaloCronometro = null;

let nivelDisplay = modoAtual.replace("balanceando-", "").toUpperCase();
titulo.innerText = `BALANCEANDO (${nivelDisplay})`;

function obterLimiteCoeficiente() {
    if (modoAtual === "balanceando-facil" || modoAtual === "balanceando-medio") return 8;
    return 16;
}

function iniciarFase() {
    faseAtual = bancoFases[modoAtual][indexFaseAtual];
    coeficientesReagentes = new Array(faseAtual.reagentes.length).fill(1);
    coeficientesProdutos = new Array(faseAtual.produtos.length).fill(1);
    
    renderizarEquacao();
    atualizarBalanca();
    atualizarHUD();

    if (modoAtual === "balanceando-impossivel") {
        let cron = document.getElementById("cronometro-desafio");
        if (cron) cron.classList.remove("escondido");
        tempoRestante = tempoMaximo;
        iniciarCronometro();
    }
}

function iniciarCronometro() {
    clearInterval(intervaloCronometro);
    let display = document.getElementById("cronometro-desafio");
    if (!display) return;
    display.classList.remove("perigo");
    
    let m = Math.floor(tempoRestante / 60).toString().padStart(2, '0');
    let s = (tempoRestante % 60).toString().padStart(2, '0');
    display.innerText = `${m}:${s}`;

    intervaloCronometro = setInterval(() => {
        tempoRestante--;
        let m = Math.floor(tempoRestante / 60).toString().padStart(2, '0');
        let s = (tempoRestante % 60).toString().padStart(2, '0');
        display.innerText = `${m}:${s}`;
        if(tempoRestante <= 20) display.classList.add("perigo");
        if (tempoRestante <= 0) { 
            clearInterval(intervaloCronometro); 
            perderVidaDesafio("O tempo acabou!"); 
        }
    }, 1000);
}

function atualizarHUD() {
    let spans = document.getElementById("estrelas-container").querySelectorAll("span");
    spans.forEach((sp, index) => {
        if(index < estrelasGanhas) { sp.classList.add("ganha"); sp.innerText = "★"; }
        else { sp.classList.remove("ganha"); }
    });
    document.getElementById("vidas-container").innerHTML = "❤️".repeat(vidasRestantes) + "🖤".repeat(vidasIniciais - vidasRestantes);
}

function formatarFormula(texto) { return texto.replace(/(\d+)/g, '<sub>$1</sub>'); }

// ==========================================
// CONTROLE COM LIMITE INTELIGENTE DE COEFICIENTES
// ==========================================
window.alterarCoeficiente = function(tipo, indice, valor) {
    if(typeof tocarSomClick === "function") tocarSomClick();
    let limiteMax = obterLimiteCoeficiente();

    if(tipo === 'R') { 
        if(valor > 0 && coeficientesReagentes[indice] >= limiteMax) {
            if(typeof mostrarMensagemGlob === "function") mostrarMensagemGlob(`⚠️ Limite máximo de ${limiteMax} atingido!`);
            return;
        }
        coeficientesReagentes[indice] = Math.max(1, coeficientesReagentes[indice] + valor); 
    } else { 
        if(valor > 0 && coeficientesProdutos[indice] >= limiteMax) {
            if(typeof mostrarMensagemGlob === "function") mostrarMensagemGlob(`⚠️ Limite máximo de ${limiteMax} atingido!`);
            return;
        }
        coeficientesProdutos[indice] = Math.max(1, coeficientesProdutos[indice] + valor); 
    }
    renderizarEquacao(); 
    atualizarBalanca();
};

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

function extrairElementos(formula) {
    let pilha = [{}];
    let i = 0;
    while (i < formula.length) {
        if (formula[i] === '(') {
            pilha.push({});
            i++;
        } else if (formula[i] === ')') {
            i++;
            let numStr = "";
            while (i < formula.length && /\d/.test(formula[i])) {
                numStr += formula[i];
                i++;
            }
            let mult = numStr ? parseInt(numStr) : 1;
            let topo = pilha.pop();
            let anterior = pilha[pilha.length - 1];
            for (let el in topo) {
                anterior[el] = (anterior[el] || 0) + topo[el] * mult;
            }
        } else if (/[A-Z]/.test(formula[i])) {
            let el = formula[i];
            i++;
            if (i < formula.length && /[a-z]/.test(formula[i])) {
                el += formula[i];
                i++;
            }
            let numStr = "";
            while (i < formula.length && /\d/.test(formula[i])) {
                numStr += formula[i];
                i++;
            }
            let qtd = numStr ? parseInt(numStr) : 1;
            let topo = pilha[pilha.length - 1];
            topo[el] = (topo[el] || 0) + qtd;
        } else {
            i++;
        }
    }

    let resultado = [];
    let contagem = pilha[0];
    for (let el in contagem) {
        for (let j = 0; j < contagem[el]; j++) {
            resultado.push(el);
        }
    }
    return resultado;
}

function obterMassaMolecula(formula) {
    let elementos = extrairElementos(formula);
    let massa = 0;
    elementos.forEach(el => {
        massa += (MASSAS_ATOMICAS[el] || 10);
    });
    return massa;
}

function criarBolinha(nomeElemento, transX, transY, zIndex = 5) {
    let bolinha = document.createElement("div");
    bolinha.className = "atomo-bolinha";
    let estilo = CORES_ATOMOS[nomeElemento] || { cor: '#555', texto: '#fff', size: 18 };
    
    bolinha.style.backgroundColor = estilo.cor;
    bolinha.style.color = estilo.texto;
    bolinha.style.width = estilo.size + "px";
    bolinha.style.height = estilo.size + "px";
    bolinha.innerText = nomeElemento;
    
    bolinha.style.transform = `translate(${transX}px, ${transY}px)`;
    bolinha.style.zIndex = zIndex;
    return bolinha;
}

function desenharMoleculaGeometria(formula) {
    let atomos = extrairElementos(formula);
    let caixa = document.createElement("div");
    caixa.className = "molecula-visual";
    caixa.style.width = "40px"; 
    caixa.style.height = "25px";

    if (atomos.length === 1) {
        caixa.appendChild(criarBolinha(atomos[0], 0, 0));
    } 
    else if (atomos.length === 2) {
        caixa.style.width = "46px";
        let r1 = CORES_ATOMOS[atomos[0]] ? CORES_ATOMOS[atomos[0]].size/2 : 9;
        let r2 = CORES_ATOMOS[atomos[1]] ? CORES_ATOMOS[atomos[1]].size/2 : 9;
        let offset = (r1 + r2) / 2 - 2; 
        caixa.appendChild(criarBolinha(atomos[0], -offset, 0));
        caixa.appendChild(criarBolinha(atomos[1], offset, 0));
    } 
    else if (formula === "H2O") {
        caixa.appendChild(criarBolinha('O', 0, -5, 10)); 
        caixa.appendChild(criarBolinha('H', -12, 6, 5)); 
        caixa.appendChild(criarBolinha('H', 12, 6, 5)); 
    } 
    else if (formula === "CO2" || formula === "SO2" || formula === "NO2") {
        caixa.style.width = "60px";
        caixa.appendChild(criarBolinha(atomos[0], 0, 0, 10)); 
        caixa.appendChild(criarBolinha(atomos[1], -18, 0, 5)); 
        caixa.appendChild(criarBolinha(atomos[2], 18, 0, 5)); 
    }
    else if (formula === "NH3" || formula === "AlCl3") {
        caixa.appendChild(criarBolinha(atomos[0], 0, -8, 10)); 
        caixa.appendChild(criarBolinha(atomos[1], -14, 8, 5)); 
        caixa.appendChild(criarBolinha(atomos[2], 14, 8, 5)); 
        caixa.appendChild(criarBolinha(atomos[3], 0, 14, 5)); 
    }
    else {
        let central = criarBolinha(atomos[0], 0, 0, 10);
        caixa.appendChild(central);
        let raio = atomos.length > 8 ? 16 : 12;
        caixa.style.width = (raio * 2 + 20) + "px";
        caixa.style.height = (raio * 2 + 20) + "px";

        for (let i = 1; i < atomos.length; i++) {
            let angulo = (i / (atomos.length - 1)) * (Math.PI * 2);
            let px = Math.cos(angulo) * raio;
            let py = Math.sin(angulo) * raio;
            caixa.appendChild(criarBolinha(atomos[i], px, py, 5));
        }
    }
    return caixa;
}

// ==========================================
// DISTRIBUIÇÃO EM MÚLTIPLAS COLUNAS LADO A LADO
// (Organização compacta que nunca sobe até o topo)
// ==========================================
function desenharPrato(pratoElemento, moleculas, coeficientes) {
    pratoElemento.innerHTML = "";
    
    let listaMol = [];
    moleculas.forEach((mol, idx) => {
        let coef = coeficientes[idx];
        for (let c = 0; c < coef; c++) {
            listaMol.push(mol);
        }
    });

    let totalMols = listaMol.length;
    if (totalMols === 0) return;

    // Máximo de 3 moléculas empilhadas por coluna
    const MAX_POR_COLUNA = 3;
    let qtdColunas = Math.ceil(totalMols / MAX_POR_COLUNA);
    
    let colunasDOM = [];
    for (let i = 0; i < qtdColunas; i++) {
        let col = document.createElement("div");
        col.className = "coluna-prato";
        pratoElemento.appendChild(col);
        colunasDOM.push(col);
    }

    // Escala adaptável para acomodar confortavelmente no prato
    let scale = 1;
    if (qtdColunas === 2) scale = 0.85;
    else if (qtdColunas === 3) scale = 0.72;
    else if (qtdColunas >= 4) scale = 0.6;
    if (totalMols > 12) scale = 0.5;

    listaMol.forEach((mol, index) => {
        let colIdx = Math.floor(index / MAX_POR_COLUNA);
        if (colIdx >= colunasDOM.length) colIdx = colunasDOM.length - 1;
        
        let divMol = desenharMoleculaGeometria(mol);
        divMol.style.transform = `scale(${scale})`;
        colunasDOM[colIdx].appendChild(divMol);
    });
}

// ==========================================
// CÁLCULO DE MASSA REAL (FÍSICA DA BALANÇA)
// ==========================================
function atualizarBalanca() {
    desenharPrato(pratoReagentes, faseAtual.reagentes, coeficientesReagentes);
    desenharPrato(pratoProdutos, faseAtual.produtos, coeficientesProdutos);

    let massaEsq = 0; 
    let massaDir = 0;
    faseAtual.reagentes.forEach((mol, idx) => { 
        massaEsq += (obterMassaMolecula(mol) * coeficientesReagentes[idx]); 
    });
    faseAtual.produtos.forEach((mol, idx) => { 
        massaDir += (obterMassaMolecula(mol) * coeficientesProdutos[idx]); 
    });
    
    let diferenca = massaEsq - massaDir;
    
    // Sensibilidade calibrada para que 1 H2 + 2 O2 vs 2 H2O (diferença de 30u) incline a balança a 24°
    let angulo = diferenca * 0.8; 
    angulo = Math.max(-25, Math.min(25, angulo));

    hasteBalanca.style.transform = `translate(-50%, 0) rotate(${angulo}deg)`;
    cordaEsq.style.transform = `rotate(${-angulo}deg)`;
    cordaDir.style.transform = `rotate(${-angulo}deg)`;
}

// -----------------------------------------------------
// VERIFICAÇÃO DE BALANCEAMENTO
// -----------------------------------------------------
window.verificarBalanceamento = function() {
    if(typeof tocarSomClick === "function") tocarSomClick();

    let contagemEsq = {};
    let contagemDir = {};

    faseAtual.reagentes.forEach((mol, idx) => {
        let coef = coeficientesReagentes[idx];
        extrairElementos(mol).forEach(el => { contagemEsq[el] = (contagemEsq[el] || 0) + coef; });
    });
    faseAtual.produtos.forEach((mol, idx) => {
        let coef = coeficientesProdutos[idx];
        extrairElementos(mol).forEach(el => { contagemDir[el] = (contagemDir[el] || 0) + coef; });
    });

    let balanceadoQuimicamente = true;
    let todosElementos = new Set([...Object.keys(contagemEsq), ...Object.keys(contagemDir)]);
    todosElementos.forEach(el => {
        if ((contagemEsq[el] || 0) !== (contagemDir[el] || 0)) {
            balanceadoQuimicamente = false;
        }
    });

    if (!balanceadoQuimicamente) {
        perderVidaDesafio("A balança não está equilibrada! Verifique a quantidade de cada tipo de átomo dos dois lados.");
        return;
    }

    clearInterval(intervaloCronometro);

    let todosCoeficientes = [...coeficientesReagentes, ...coeficientesProdutos];
    let mdc = todosCoeficientes[0];
    for (let i = 1; i < todosCoeficientes.length; i++) {
        let a = mdc; let b = todosCoeficientes[i];
        while (b !== 0) { let temp = b; b = a % b; a = temp; }
        mdc = a;
    }

    if (mdc > 1) {
        if(typeof mostrarMensagemGlob === "function") mostrarMensagemGlob(`✅ Balanceado! (1 Estrela)\nDivida os coeficientes por ${mdc} para a 2ª estrela!`);
        estrelasGanhas++;
        dispararEstrelaAnimacao("Você ganhou 1 estrela! Simplifique para a próxima!");
    } else {
        if(somCorreto) { somCorreto.currentTime=0; somCorreto.play().catch(()=>{}); }
        estrelasGanhas += 2;
        dispararEstrelaAnimacao("Perfeito! 2 estrelas garantidas!");
    }
};

function dispararEstrelaAnimacao(texto) {
    atualizarHUD();
    if(somEstrela) { somEstrela.currentTime=0; somEstrela.play().catch(()=>{}); }
    
    document.getElementById("texto-estrela").innerText = texto;
    document.getElementById("modal-estrela").style.display = "flex";
}

window.continuarModoBalanceando = function() {
    if(typeof tocarSomClick === "function") tocarSomClick();
    document.getElementById("modal-estrela").style.display = "none";
    
    let todosCoeficientes = [...coeficientesReagentes, ...coeficientesProdutos];
    let mdc = todosCoeficientes[0];
    for (let i = 1; i < todosCoeficientes.length; i++) {
        let a = mdc; let b = todosCoeficientes[i];
        while (b !== 0) { let temp = b; b = a % b; a = temp; }
        mdc = a;
    }
    
    if (mdc === 1) {
        if(estrelasGanhas >= 10 || indexFaseAtual >= bancoFases[modoAtual].length - 1) { 
            window.encerrarDesafioBalanceando(true); 
        } else { 
            window.pularFaseBalanceando(true); 
        }
    } else {
        if (modoAtual === "balanceando-impossivel") {
            tempoRestante = tempoMaximo;
            iniciarCronometro();
        }
    }
};

function perderVidaDesafio(motivo) {
    if(somErro) { somErro.currentTime=0; somErro.play().catch(()=>{}); }
    vidasRestantes--; 
    atualizarHUD();
    
    if(vidasRestantes <= 0) { 
        window.encerrarDesafioBalanceando(false); 
    } else { 
        clearInterval(intervaloCronometro);
        document.getElementById("texto-erro-desafio").innerText = motivo;
        document.getElementById("modal-erro-desafio").style.display = "flex";
    }
}

window.fecharErroBalanceando = function() {
    if(typeof tocarSomClick === "function") tocarSomClick();
    document.getElementById("modal-erro-desafio").style.display = "none";
    if (modoAtual === "balanceando-impossivel") {
        tempoRestante = tempoMaximo;
        iniciarCronometro();
    }
};

window.pularFaseBalanceando = function(silencioso = false) {
    if(!silencioso && typeof tocarSomClick === "function") tocarSomClick();
    if (indexFaseAtual < bancoFases[modoAtual].length - 1) {
        indexFaseAtual++;
        iniciarFase();
    } else {
        if(typeof mostrarMensagemGlob === "function") mostrarMensagemGlob("⚠️ Esta já é a última fase deste nível!");
    }
};

window.voltarFaseBalanceando = function() {
    if(typeof tocarSomClick === "function") tocarSomClick();
    if (indexFaseAtual > 0) {
        indexFaseAtual--;
        iniciarFase();
    } else {
        if(typeof mostrarMensagemGlob === "function") mostrarMensagemGlob("⚠️ Esta já é a primeira fase!");
    }
};

window.encerrarDesafioBalanceando = function(vitoriaForcada = null) {
    clearInterval(intervaloCronometro);
    if(typeof tocarSomClick === "function") tocarSomClick();
    
    let isVitoria = vitoriaForcada !== null ? vitoriaForcada : (estrelasGanhas > 0);
    document.getElementById("modal-resultado-desafio").style.display = "flex";
    
    let box = document.getElementById("box-resultado-desafio");
    let header = document.getElementById("header-resultado-desafio");
    let tituloRes = document.getElementById("texto-resultado-desafio");
    let sub = document.getElementById("subtexto-resultado-desafio");
    let btn = document.getElementById("btn-resultado-desafio");

    if (isVitoria) {
        box.style.border = "4px solid #16a34a";
        box.style.background = "linear-gradient(135deg, #f0fdf4, #dcfce7)";
        header.style.background = "#16a34a"; 
        header.style.borderBottom = "4px solid #15803d";
        tituloRes.style.color = "#15803d"; 
        btn.style.background = "#16a34a";
        tituloRes.innerText = "Desafio Concluído! ⭐";
        sub.innerText = `Você salvou ${estrelasGanhas} estrela(s). Balanço químico impecável!`;
        if(somGanhou) { somGanhou.currentTime=0; somGanhou.play().catch(()=>{}); }

        if (typeof desbloquearConquista === "function") {
            if (modoAtual === "balanceando-facil") desbloquearConquista('c8');
            if (modoAtual === "balanceando-medio") desbloquearConquista('c9');
            if (modoAtual === "balanceando-dificil") desbloquearConquista('c10');
            if (modoAtual === "balanceando-impossivel") desbloquearConquista('c11');
        }
    } else {
        box.style.border = "4px solid #ef4444";
        box.style.background = "linear-gradient(135deg, #fef2f2, #fee2e2)";
        header.style.background = "#ef4444"; 
        header.style.borderBottom = "4px solid #b91c1c";
        tituloRes.style.color = "#b91c1c"; 
        btn.style.background = "#ef4444";
        tituloRes.innerText = "Fim do Teste!";
        
        if(somPerdeu) { somPerdeu.currentTime=0; somPerdeu.play().catch(()=>{}); }
        sub.innerText = "Não desanime! Ajustar coeficientes requer muita atenção."; 
    }
};

// ==========================================
// CHEATS ADMINISTRATIVOS
// ==========================================
window.cheatCompletarFase = function() {
    estrelasGanhas = 10;
    window.encerrarDesafioBalanceando(true);
};

window.cheatEstrelas = function(qtd) {
    estrelasGanhas = qtd;
    atualizarHUD();
    if(estrelasGanhas >= 10) {
        window.encerrarDesafioBalanceando(true);
    } else {
        dispararEstrelaAnimacao(`Você recebeu ${qtd} estrela(s)! (Cheat ADM)`);
    }
};

iniciarFase();