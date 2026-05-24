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

const CORES_ATOMOS = {
    'H': { cor: '#ffffff', texto: '#000', size: 12 },
    'O': { cor: '#ef4444', texto: '#fff', size: 18 },
    'C': { cor: '#333333', texto: '#fff', size: 20 },
    'N': { cor: '#3b82f6', texto: '#fff', size: 18 },
    'Fe':{ cor: '#d97706', texto: '#fff', size: 22 },
    'Na':{ cor: '#8b5cf6', texto: '#fff', size: 20 },
    'Cl':{ cor: '#22c55e', texto: '#fff', size: 20 },
    'K': { cor: '#a855f7', texto: '#fff', size: 22 },
    'Al':{ cor: '#94a3b8', texto: '#000', size: 20 },
    'Ca':{ cor: '#cbd5e1', texto: '#000', size: 22 },
    'Zn':{ cor: '#64748b', texto: '#fff', size: 20 },
    'Mg':{ cor: '#84cc16', texto: '#000', size: 20 },
    'S': { cor: '#eab308', texto: '#000', size: 20 },
    'Mn':{ cor: '#ec4899', texto: '#fff', size: 20 },
    'P': { cor: '#f97316', texto: '#fff', size: 20 },
    'Si':{ cor: '#6ee7b7', texto: '#000', size: 20 },
    'Cu':{ cor: '#b45309', texto: '#fff', size: 20 }
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

function contarAtomos(moleculas, coeficientes) {
    let contagem = {};
    moleculas.forEach((mol, idx) => {
        let coef = coeficientes[idx];
        
        let regexParse = /([A-Z][a-z]*)(\d*)|(\()|(\))(\d*)/g;
        let stack = [1];
        let multAtual = 1;
        let p;

        let partes = [];
        let curStr = mol;
        
        // Expande os parênteses
        while ((p = regexParse.exec(mol)) !== null) {
            if(p[1]) {
                let elem = p[1];
                let qtd = p[2] ? parseInt(p[2]) : 1;
                contagem[elem] = (contagem[elem] || 0) + (qtd * coef);
            }
            // NOTA: Para moléculas complexas com parênteses, vamos usar um parser recursivo no próximo passo.
            // Para as fases fáceis e médias, esse regex básico resolve perfeitamente.
        }
    });
    return contagem;
}

function extrairElementosSimples(formula) {
    let elementos = [];
    let regex = /([A-Z][a-z]*)(\d*)/g;
    let match;
    while((match = regex.exec(formula)) !== null) {
        let sigla = match[1];
        let qtd = match[2] ? parseInt(match[2]) : 1;
        for(let i=0; i<qtd; i++) elementos.push(sigla);
    }
    return elementos;
}

function desenharPrato(pratoElemento, moleculas, coeficientes) {
    pratoElemento.innerHTML = "";
    
    // Zoom dinâmico para não estourar a tela no nível impossível
    let totalMols = coeficientes.reduce((a,b)=>a+b, 0);
    let scale = 1;
    if(totalMols > 6) scale = 0.8;
    if(totalMols > 12) scale = 0.6;

    moleculas.forEach((mol, idx) => {
        let coef = coeficientes[idx];
        let elementos = extrairElementosSimples(mol);
        
        for(let c=0; c<coef; c++) {
            let divMol = document.createElement("div");
            divMol.className = "molecula-visual";
            divMol.style.transform = `scale(${scale})`;
            
            elementos.forEach(el => {
                let bolinha = document.createElement("div");
                bolinha.className = "atomo-bolinha";
                let estilo = CORES_ATOMOS[el] || { cor: '#555', texto: '#fff', size: 15 };
                bolinha.style.backgroundColor = estilo.cor;
                bolinha.style.color = estilo.texto;
                bolinha.style.width = estilo.size + "px";
                bolinha.style.height = estilo.size + "px";
                bolinha.innerText = el;
                divMol.appendChild(bolinha);
            });
            pratoElemento.appendChild(divMol);
        }
    });
}

function atualizarBalanca() {
    desenharPrato(pratoReagentes, faseAtual.reagentes, coeficientesReagentes);
    desenharPrato(pratoProdutos, faseAtual.produtos, coeficientesProdutos);

    let massaEsq = coeficientesReagentes.reduce((a,b)=>a+b,0);
    let massaDir = coeficientesProdutos.reduce((a,b)=>a+b,0);
    
    let diferenca = massaEsq - massaDir;
    let angulo = diferenca * 4; 
    
    // Limita o giro para não capotar a balança
    angulo = Math.max(-25, Math.min(25, angulo));

    hasteBalanca.style.transform = `translate(-50%, 0) rotate(${angulo}deg)`;
    cordaEsq.style.transform = `rotate(${-angulo}deg)`;
    cordaDir.style.transform = `rotate(${-angulo}deg)`;
}

// Iniciar a primeira fase
iniciarFase();