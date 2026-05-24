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

function formatarFormula(texto) { return texto.replace(/(\d+)/g, '<sub>$1</sub>'); }

function alterarCoeficiente(tipo, indice, valor) {
    if(typeof tocarSomClick === "function") tocarSomClick();
    if(tipo === 'R') { coeficientesReagentes[indice] = Math.max(1, coeficientesReagentes[indice] + valor); } 
    else { coeficientesProdutos[indice] = Math.max(1, coeficientesProdutos[indice] + valor); }
    renderizarEquacao(); atualizarBalanca();
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

function extrairElementos(formula) {
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
    else if (formula === "CH4") {
        caixa.style.height = "50px";
        caixa.appendChild(criarBolinha('C', 0, 0, 10)); 
        caixa.appendChild(criarBolinha('H', 0, -18, 5)); 
        caixa.appendChild(criarBolinha('H', -16, 6, 5)); 
        caixa.appendChild(criarBolinha('H', 16, 6, 5)); 
        caixa.appendChild(criarBolinha('H', 0, 18, 5)); 
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

function desenharPrato(pratoElemento, moleculas, coeficientes) {
    pratoElemento.innerHTML = "";
    let totalMols = coeficientes.reduce((a,b)=>a+b, 0);
    let scale = 1;
    if(totalMols > 6) scale = 0.8;
    if(totalMols > 10) scale = 0.6;
    if(totalMols > 15) scale = 0.45; 

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

    let massaEsq = 0; let massaDir = 0;
    faseAtual.reagentes.forEach((mol, idx) => { massaEsq += (extrairElementos(mol).length * coeficientesReagentes[idx]); });
    faseAtual.produtos.forEach((mol, idx) => { massaDir += (extrairElementos(mol).length * coeficientesProdutos[idx]); });
    
    let diferenca = massaEsq - massaDir;
    let angulo = diferenca * 2.5; 
    angulo = Math.max(-25, Math.min(25, angulo));

    hasteBalanca.style.transform = `translate(-50%, 0) rotate(${angulo}deg)`;
    cordaEsq.style.transform = `rotate(${-angulo}deg)`;
    cordaDir.style.transform = `rotate(${-angulo}deg)`;
}

// -----------------------------------------------------
// LÓGICA DE VERIFICAÇÃO COM ANIMAÇÃO DA ESTRELA
// -----------------------------------------------------
window.verificarBalanceamento = function() {
    if(typeof tocarSomClick === "function") tocarSomClick();

    let angHaste = hasteBalanca.style.transform;
    if (!angHaste.includes("rotate(0deg)")) {
        perderVidaDesafio("A balança não está equilibrada! Ajuste os botões de (+) e (-) e tente novamente.");
        return;
    }

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
        estrelasGanhas += 2; // Ganha as duas!
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
    
    // Se o balanço já estava perfeito, ele avança de fase
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
            window.pularFaseBalanceando(true); // Pula silencioso
        }
    }
}

function perderVidaDesafio(motivo) {
    if(somErro) { somErro.currentTime=0; somErro.play().catch(()=>{}); }
    vidasRestantes--; 
    atualizarHUD();
    
    if(vidasRestantes <= 0) { 
        window.encerrarDesafioBalanceando(); 
    } else { 
        document.getElementById("texto-erro-desafio").innerText = motivo;
        document.getElementById("modal-erro-desafio").style.display = "flex";
    }
}

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

window.encerrarDesafioBalanceando = function() {
    if(typeof tocarSomClick === "function") tocarSomClick();
    
    document.getElementById("modal-resultado-desafio").style.display = "flex";
    let box = document.getElementById("box-resultado-desafio");
    let header = document.getElementById("header-resultado-desafio");
    let titulo = document.getElementById("texto-resultado-desafio");
    let sub = document.getElementById("subtexto-resultado-desafio");
    let btn = document.getElementById("btn-resultado-desafio");

    if (estrelasGanhas > 0) {
        box.style.border = "4px solid #16a34a";
        box.style.background = "linear-gradient(135deg, #f0fdf4, #dcfce7)";
        header.style.background = "#16a34a"; header.style.borderBottom = "4px solid #15803d";
        titulo.style.color = "#15803d"; btn.style.background = "#16a34a";
        titulo.innerText = "Desafio Concluído! ⭐";
        sub.innerText = `Você escolheu encerrar e salvou ${estrelasGanhas} estrela(s). Bom trabalho!`;
        if(somGanhou) { somGanhou.currentTime=0; somGanhou.play().catch(()=>{}); }
    } else {
        box.style.border = "4px solid #ef4444";
        box.style.background = "linear-gradient(135deg, #fef2f2, #fee2e2)";
        header.style.background = "#ef4444"; header.style.borderBottom = "4px solid #b91c1c";
        titulo.style.color = "#b91c1c"; btn.style.background = "#ef4444";
        titulo.innerText = "Fim do Teste!";
        
        if(somPerdeu) { somPerdeu.currentTime=0; somPerdeu.play().catch(()=>{}); }
        sub.innerText = "Não desanime! Ajustar coeficientes requer muita atenção."; 
    }
};

iniciarFase();