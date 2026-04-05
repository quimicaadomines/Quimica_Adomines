let modoAtual = localStorage.getItem("modoAtual") || "livre";
let titulo = document.getElementById("titulo-modo");
let quadroOuter = document.getElementById("quadro");
let quadroInner = document.getElementById("quadro-inner");
let listaAtomos = document.getElementById("lista-atomos");

let somErro = document.getElementById("somErro");
let somCorreto = document.getElementById("somCorreto");
let somConquista = document.getElementById("somConquista");
let somEstrela = document.getElementById("somEstrela");
let somGanhou = document.getElementById("somGanhou");
let somPerdeu = document.getElementById("somPerdeu");

function mostrarMensagemGlob(texto) {
    let toast = document.getElementById("toast-mensagem");
    if(toast) {
        toast.innerText = texto;
        toast.classList.remove("escondido");
        setTimeout(() => { toast.classList.add("escondido"); }, 3000);
    }
}
function abrirAjuda() { tocarSomClick(); document.getElementById('ajuda-overlay').style.display = 'flex'; }

// ==========================================
// MODO DESAFIO (LÓGICA E CHEATS)
// ==========================================
const bancoDesafios = {
    "facil":[
        { nome: "Propan-2-ol", dica: "A terminação '-ol' indica um grupo Álcool (OH). E o '2' diz que está no meio!", chk: (c)=> c.C==3 && c.H==8 && c.O==1 && c.simples==11 },
        { nome: "Pent-1,3-dieno", dica: "'Pent' são 5 carbonos. 'dieno' significa DUAS ligações duplas.", chk: (c)=> c.C==5 && c.H==8 && c.dupla==2 && c.simples==10 },
        { nome: "Butano", dica: "'But' são 4 carbonos. 'ano' significa que SÓ tem ligação simples.", chk: (c)=> c.C==4 && c.H==10 && c.simples==13 },
        { nome: "Propan-1-amina", dica: "'amina' indica que você precisa usar Nitrogênio (N).", chk: (c)=> c.C==3 && c.H==9 && c.N==1 && c.simples==12 },
        { nome: "2-Metilbutano", dica: "Cadeia principal com 4 (but) e um carbono extra ramificado no número 2.", chk: (c)=> c.C==5 && c.H==12 && c.simples==16 }
    ],
    "medio":[
        { nome: "Metanotiol", dica: "A terminação '-tiol' exige a presença de Enxofre (S).", chk: (c)=> c.C==1 && c.H==4 && c.S==1 && c.simples==5 },
        { nome: "Fosfina", dica: "É formada por Fósforo (P) e Hidrogênios.", chk: (c)=> c.P==1 && c.H==3 && c.simples==3 },
        { nome: "3,3-dimetil-hexano", dica: "'Hex' (6) na principal, e DOIS carbonos pendurados no número 3.", chk: (c)=> c.C==8 && c.H==18 && c.simples==25 },
        { nome: "3-metilbutan-2-ona", dica: "'-ona' significa dupla ligação com Oxigênio (C=O).", chk: (c)=> c.C==5 && c.H==10 && c.O==1 && c.dupla==1 && c.simples==14 },
        { nome: "Hept-1,3,5-trieno", dica: "Cadeia de 7 carbonos (Hept) com TRÊS duplas ligações.", chk: (c)=> c.C==7 && c.H==10 && c.dupla==3 && c.simples==13 }
    ],
    "dificil":[
        { nome: "2-cloropropan-1-ol", dica: "Você vai usar Carbono, Cloro (Cl) e Álcool (OH).", chk: (c)=> c.C==3 && c.H==7 && c.Cl==1 && c.O==1 && c.simples==11 },
        { nome: "1-bromopropan-2-amina", dica: "Você vai usar Bromo (Br) e uma Amina (N).", chk: (c)=> c.C==3 && c.H==8 && c.Br==1 && c.N==1 && c.simples==12 },
        { nome: "2-fluorobutan-1-ol", dica: "Cadeia de 4 com Flúor (F) e Álcool (OH).", chk: (c)=> c.C==4 && c.H==9 && c.F==1 && c.O==1 && c.simples==14 },
        { nome: "2-iodobutano", dica: "Cadeia de 4 com Iodo (I).", chk: (c)=> c.C==4 && c.H==9 && c.I==1 && c.simples==13 },
        { nome: "3-cloropentan-1-ol", dica: "Cadeia de 5 (pent) com Cloro (Cl) e Álcool (OH).", chk: (c)=> c.C==5 && c.H==11 && c.Cl==1 && c.O==1 && c.simples==17 }
    ],
    "impossivel":[
        { nome: "2,3-dimetilbutan-1-ol", dica: "Cadeia de 4 carbonos com ramificações e Álcool.", chk: (c)=> c.C==6 && c.H==14 && c.O==1 && c.simples==20, class:["Aberta", "Ramificada", "Saturada", "Homogênea"] },
        { nome: "Hex-2-eno", dica: "Cadeia de 6 carbonos com uma ligação dupla entre carbonos.", chk: (c)=> c.C==6 && c.H==12 && c.dupla==1 && c.simples==16, class:["Aberta", "Normal", "Insaturada", "Homogênea"] },
        { nome: "2,2-dimetilpropan-1-amina", dica: "Amina com ramificações no carbono 2.", chk: (c)=> c.C==5 && c.H==13 && c.N==1 && c.simples==18, class:["Aberta", "Ramificada", "Saturada", "Homogênea"] },
        { nome: "2-bromo-3-metilpent-2-eno", dica: "Cadeia de 5 com Bromo, ramificação metil e ligação dupla.", chk: (c)=> c.C==6 && c.H==11 && c.Br==1 && c.dupla==1 && c.simples==16, class:["Aberta", "Ramificada", "Insaturada", "Homogênea"] },
        { nome: "3-cloropentan-2-ona", dica: "Cadeia de 5 carbonos com Cloro e ligação dupla com Oxigênio (Cetona).", chk: (c)=> c.C==5 && c.H==9 && c.Cl==1 && c.O==1 && c.dupla==1 && c.simples==14, class:["Aberta", "Normal", "Saturada", "Homogênea"] }
    ]
};

let indexDesafioAtual = 0;
let estrelasGanhas = 0;
let vidasIniciais = modoAtual === "impossivel" ? 2 : 3;
let vidasRestantes = vidasIniciais;
let tempoMaximo = 180; 
let tempoRestante = tempoMaximo;
let intervaloCronometro = null;

if (modoAtual === "livre") { 
    titulo.innerText = "ESTRUTURANDO (Modo Livre)"; 
    document.getElementById("texto-modo-livre").classList.remove("escondido");
    document.getElementById("btn-catalogo").classList.remove("escondido");
} else { 
    titulo.innerText = `ESTRUTURANDO (Modo ${modoAtual.toUpperCase()})`; 
    document.getElementById("hud-desafio").classList.remove("escondido");
    document.getElementById("btn-verificar-desafio").classList.remove("escondido");
    if (modoAtual === "impossivel") { document.getElementById("cronometro-desafio").classList.remove("escondido"); }
    iniciarRodadaDesafio(true); // true indica que é a rodada inicial (espera o tutorial checar)
}

function iniciarRodadaDesafio(isStart = false) {
    let desafiosDoModo = bancoDesafios[modoAtual];
    document.getElementById("nome-desafio-atual").innerText = desafiosDoModo[indexDesafioAtual].nome;
    atualizarHUD();
    
    // Se for o modo impossível, resetamos o tempo, mas não iniciamos o cronômetro agora 
    // se estivermos na inicialização da página. O cronômetro será iniciado no final do checkTutorialOnLoad.
    if (modoAtual === "impossivel") { 
        tempoRestante = tempoMaximo; 
        if (!isStart) { iniciarCronometro(); }
    }
}

function atualizarHUD() {
    let spans = document.getElementById("estrelas-container").querySelectorAll("span");
    spans.forEach((sp, index) => {
        if(index < estrelasGanhas) { sp.classList.add("ganha"); sp.innerText = "★"; }
        else { sp.classList.remove("ganha"); }
    });
    document.getElementById("vidas-container").innerHTML = "❤️".repeat(vidasRestantes) + "🖤".repeat(vidasIniciais - vidasRestantes);
}

function iniciarCronometro() {
    clearInterval(intervaloCronometro);
    let display = document.getElementById("cronometro-desafio");
    display.classList.remove("perigo");
    
    // Atualiza a visualização no segundo 0 para já mostrar os "03:00" na tela
    let m = Math.floor(tempoRestante / 60).toString().padStart(2, '0');
    let s = (tempoRestante % 60).toString().padStart(2, '0');
    display.innerText = `${m}:${s}`;

    intervaloCronometro = setInterval(() => {
        tempoRestante--;
        let m = Math.floor(tempoRestante / 60).toString().padStart(2, '0');
        let s = (tempoRestante % 60).toString().padStart(2, '0');
        display.innerText = `${m}:${s}`;
        if(tempoRestante <= 30) display.classList.add("perigo");
        if (tempoRestante <= 0) { clearInterval(intervaloCronometro); perderVidaDesafio("O tempo acabou!"); }
    }, 1000);
}

window.mostrarDicaDesafio = function() {
    tocarSomClick();
    let dAtual = bancoDesafios[modoAtual][indexDesafioAtual];
    mostrarMensagemGlob("💡 Dica: " + dAtual.dica);
};

window.verificarMoleculaDesafio = function() {
    tocarSomClick();
    
    let dAtual = bancoDesafios[modoAtual][indexDesafioAtual];
    let allPecas = Array.from(quadroInner.querySelectorAll(`.peca-draggable.no-quadro`));
    if(allPecas.length === 0) { mostrarMensagemGlob("⚠️ O quadro está vazio!"); return; }

    let acertou = false;
    let grpUnicos = new Set();
    allPecas.forEach(p => {
        if(p.dataset.grupo) grpUnicos.add(p.dataset.grupo);
        else grpUnicos.add("solto_" + p.dataset.id);
    });

    grpUnicos.forEach(gId => {
        let pecasDoGrupo = gId.startsWith("solto_") ? allPecas.filter(p => p.dataset.id === gId.substring(6)) : allPecas.filter(p => p.dataset.grupo === gId);
        
        let c = { C:0, H:0, O:0, N:0, S:0, P:0, Cl:0, F:0, Br:0, I:0, simples:0, dupla:0, tripla:0, total:0 };
        
        pecasDoGrupo.forEach(p => {
            if(p.dataset.tipo === "atomo") {
                let sigla = p.dataset.sigla; 
                c[sigla] = (c[sigla] || 0) + 1; 
                c.total += 1;
                let hQtd = parseInt(p.dataset.hExtras || 0); 
                if(hQtd > 0) { c.H = (c.H || 0) + hQtd; c.total += hQtd; c.simples += hQtd; }
            } else if(p.dataset.tipo === "ligacao") {
                let val = parseInt(p.dataset.val);
                if(val === 1) c.simples += 1; if(val === 2) c.dupla += 1; if(val === 3) c.tripla += 1;
            }
        });

        if(dAtual.chk(c)) acertou = true;
    });

    if(acertou) {
        if(somCorreto) { somCorreto.currentTime=0; somCorreto.play().catch(()=>{}); }
        clearInterval(intervaloCronometro); 
        if (modoAtual === "impossivel") { document.getElementById("modal-classificacao").style.display = "flex"; } else { ganharEstrela(); }
    } else { perderVidaDesafio(`Estrutura Incorreta!\n\n💡 Lembrete: ${dAtual.dica}`); }
};

function perderVidaDesafio(motivo) {
    if(somErro) { somErro.currentTime=0; somErro.play().catch(()=>{}); }
    vidasRestantes--; 
    atualizarHUD();
    
    if(vidasRestantes <= 0) { 
        finalizarDesafio(false); 
    } else { 
        clearInterval(intervaloCronometro); 
        document.getElementById("texto-erro-desafio").innerText = motivo;
        document.getElementById("modal-erro-desafio").style.display = "flex";
    }
}

window.fecharErroDesafio = function() {
    tocarSomClick();
    document.getElementById("modal-erro-desafio").style.display = "none";
    if (modoAtual === "impossivel") { tempoRestante = tempoMaximo; iniciarCronometro(); }
};

window.verificarClassificacao = function() {
    tocarSomClick();
    let classCorreta = bancoDesafios["impossivel"][indexDesafioAtual].class; 
    let cCadeia = document.querySelector('input[name="classCadeia"]:checked');
    let cDisp = document.querySelector('input[name="classDisp"]:checked');
    let cSat = document.querySelector('input[name="classSat"]:checked');
    let cNat = document.querySelector('input[name="classNat"]:checked');

    if(!cCadeia || !cDisp || !cSat || !cNat) { mostrarMensagemGlob("⚠️ Preencha todas as classificações antes de confirmar!"); return; }

    let respostas =[cCadeia.value, cDisp.value, cSat.value, cNat.value];
    if(classCorreta.every(val => respostas.includes(val))) {
        document.getElementById("modal-classificacao").style.display = "none";
        document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
        ganharEstrela();
    } else {
        if(somErro) { somErro.currentTime=0; somErro.play().catch(()=>{}); }
        mostrarMensagemGlob("❌ Classificação Incorreta! Analise com cuidado.");
    }
};

function ganharEstrela() {
    estrelasGanhas++;
    if(somEstrela) { somEstrela.currentTime=0; somEstrela.play().catch(()=>{}); }
    document.getElementById("texto-estrela").innerText = `Você ganhou a ${estrelasGanhas}ª estrela!`;
    document.getElementById("modal-estrela").style.display = "flex";
}

window.continuarDesafio = function() {
    tocarSomClick();
    document.getElementById("modal-estrela").style.display = "none";
    atualizarHUD(); limparQuadro(); 
    if(estrelasGanhas >= 5) { finalizarDesafio(true); } else { indexDesafioAtual++; iniciarRodadaDesafio(); }
};

function finalizarDesafio(vitoria) {
    clearInterval(intervaloCronometro);
    document.getElementById("modal-resultado-desafio").style.display = "flex";
    let box = document.getElementById("box-resultado-desafio");
    let header = document.getElementById("header-resultado-desafio");
    let titulo = document.getElementById("texto-resultado-desafio");
    let sub = document.getElementById("subtexto-resultado-desafio");
    let btn = document.getElementById("btn-resultado-desafio");

    if (vitoria) {
        box.style.border = "4px solid #16a34a";
        box.style.background = "linear-gradient(135deg, #f0fdf4, #dcfce7)";
        header.style.background = "#16a34a"; 
        header.style.borderBottom = "4px solid #15803d";
        titulo.style.color = "#15803d";
        btn.style.background = "#16a34a";
        titulo.innerText = "Excelente! Você ganhou cinco estrelas! ⭐⭐⭐⭐⭐";
        sub.innerText = "Sua habilidade em química estrutural é incrível!";
        if(somGanhou) { somGanhou.currentTime=0; somGanhou.play().catch(()=>{}); }
        
        if(modoAtual === "facil" && typeof desbloquearConquista === "function") desbloquearConquista('c1');
        if(modoAtual === "medio" && typeof desbloquearConquista === "function") desbloquearConquista('c2');
        if(modoAtual === "dificil" && typeof desbloquearConquista === "function") desbloquearConquista('c3');
        if(modoAtual === "impossivel" && typeof desbloquearConquista === "function") desbloquearConquista('c4');
    } else {
        box.style.border = "4px solid #ef4444";
        box.style.background = "linear-gradient(135deg, #fef2f2, #fee2e2)";
        header.style.background = "#ef4444"; 
        header.style.borderBottom = "4px solid #b91c1c";
        titulo.style.color = "#b91c1c";
        btn.style.background = "#ef4444";
        titulo.innerText = "Fim de Jogo!";
        
        if(somPerdeu) { somPerdeu.currentTime=0; somPerdeu.play().catch(()=>{}); }
        if (estrelasGanhas === 4) { sub.innerText = "Muito bem! Você conseguiu 4 estrelas. Faltou muito pouco!"; } 
        else if (estrelasGanhas > 0) { sub.innerText = `Você conseguiu ${estrelasGanhas} estrela(s). Tente novamente para dominar as estruturas!`; } 
        else { sub.innerText = "Não desanime! A química exige prática. Comece pelos níveis mais fáceis!"; }
    }
}

window.cheatCompletarFase = function() {
    if(modoAtual === "livre") return;
    estrelasGanhas = 5;
    finalizarDesafio(true);
};

window.cheatEstrelas = function(qtd) {
    if(modoAtual === "livre") return;
    estrelasGanhas = qtd;
    atualizarHUD();
    if(estrelasGanhas >= 5) {
        finalizarDesafio(true);
    } else {
        if(somEstrela) { somEstrela.currentTime=0; somEstrela.play().catch(()=>{}); }
        document.getElementById("texto-estrela").innerText = `Você ganhou a ${estrelasGanhas}ª estrela! (Cheat)`;
        document.getElementById("modal-estrela").style.display = "flex";
    }
};

// ==========================================
// POKEDEX DO MODO LIVRE
// ==========================================
const dbCatalogo =[
    { id:1, form:"H2O", nome:"Água", desc:"Essencial para a vida, compõe a maior parte dos seres vivos.", chk:(c)=> c.O==1 && c.H==2 && c.total==3 && c.simples==2 },
    { id:2, form:"CH4", nome:"Metano", desc:"Principal componente do gás natural, usado como combustível.", chk:(c)=> c.C==1 && c.H==4 && c.total==5 && c.simples==4 },
    { id:3, form:"C2H6", nome:"Etano", desc:"Gás usado na produção de eteno para a indústria de plásticos.", chk:(c)=> c.C==2 && c.H==6 && c.total==8 && c.simples==7 },
    { id:4, form:"C2H4", nome:"Eteno", desc:"Usado na agricultura para amadurecer frutas e base para polietileno.", chk:(c)=> c.C==2 && c.H==4 && c.total==6 && c.dupla==1 && c.simples==4 },
    { id:5, form:"C2H2", nome:"Etino", desc:"Gás usado em maçaricos de solda debido à sua chama super quente.", chk:(c)=> c.C==2 && c.H==2 && c.total==4 && c.tripla==1 && c.simples==2 },
    { id:6, form:"C2H5OH", nome:"Etanol", desc:"Álcool comum presente em bebidas, perfumes e combustíveis.", chk:(c)=> c.C==2 && c.H==6 && c.O==1 && c.total==9 && c.simples==8 },
    { id:7, form:"CH3COOH", nome:"Ácido acético", desc:"Principal componente del vinagre, usado como tempero.", chk:(c)=> c.C==2 && c.H==4 && c.O==2 && c.total==8 && c.dupla==1 && c.simples==6 },
    { id:8, form:"C3H6O", nome:"Acetona", desc:"Solvente muy comum, famoso por remover esmaltes.", chk:(c)=> c.C==3 && c.H==6 && c.O==1 && c.total==10 && c.dupla==1 && c.simples==8 },
    { id:9, form:"CO2", nome:"Dióxido de carbono", desc:"Gás exhalado na respiração, usado en refrigerantes.", chk:(c)=> c.C==1 && c.O==2 && c.total==3 && c.dupla==2 },
    { id:10, form:"NH3", nome:"Amônia", desc:"Gás de cheiro forte usado em produtos de limpeza.", chk:(c)=> c.N==1 && c.H==3 && c.total==4 && c.simples==3 },
    { id:11, form:"CH3NH2", nome:"Metilamina", desc:"Gás con cheiro de peixe, usado na síntesis de medicamentos.", chk:(c)=> c.C==1 && c.H==5 && c.N==1 && c.total==7 && c.simples==6 },
    { id:12, form:"CO(NH2)2", nome:"Ureia", desc:"Presente na urina, muito usado como fertilizante agrícola.", chk:(c)=> c.C==1 && c.H==4 && c.N==2 && c.O==1 && c.total==8 && c.dupla==1 && c.simples==6 },
    { id:13, form:"H2S", nome:"Sulfeto de hidrogênio", desc:"Gás tóxico com cheiro de ovo podre.", chk:(c)=> c.S==1 && c.H==2 && c.total==3 && c.simples==2 },
    { id:14, form:"CH3SH", nome:"Metanotiol", desc:"Gás de cheiro repulsivo adicionado ao gás de cozinha.", chk:(c)=> c.C==1 && c.H==4 && c.S==1 && c.total==6 && c.simples==5 },
    { id:15, form:"H3PO4", nome:"Ácido fosfórico", desc:"Ácido usado em refrigerantes de cola e fertilizantes.", chk:(c)=> c.P==1 && c.O==4 && c.H==3 && c.total==8 && c.dupla==1 && c.simples==7 },
    { id:16, form:"PH3", nome:"Fosfina", desc:"Gás extremamente tóxico usado no controle de pragas.", chk:(c)=> c.P==1 && c.H==3 && c.total==4 && c.simples==3 },
    { id:17, form:"CH3Cl", nome:"Clorometano", desc:"Gás usado antigamente como refrigerante.", chk:(c)=> c.C==1 && c.H==3 && c.Cl==1 && c.total==5 && c.simples==4 },
    { id:18, form:"CH3F", nome:"Fluorometano", desc:"Gás usado na fabricação de semicondutores e eletrônicos.", chk:(c)=> c.C==1 && c.H==3 && c.F==1 && c.total==5 && c.simples==4 },
    { id:19, form:"C2H5Br", nome:"Bromoetano", desc:"Líquido volátil usado na química como agente alquilante.", chk:(c)=> c.C==2 && c.H==5 && c.Br==1 && c.total==8 && c.simples==7 },
    { id:20, form:"CH3I", nome:"Iodometano", desc:"Líquido denso usado como pesticida e síntese em laboratórios.", chk:(c)=> c.C==1 && c.H==3 && c.I==1 && c.total==5 && c.simples==4 }
];

function abrirCatalogo() {
    tocarSomClick();
    let grid = document.getElementById("grid-catalogo");
    grid.innerHTML = "";
    let desbloqueados = JSON.parse(localStorage.getItem("catalogoDesbloqueado")) ||[];
    dbCatalogo.forEach(mol => {
        let isUnlk = desbloqueados.includes(mol.id);
        grid.innerHTML += `<div class="item-catalogo ${isUnlk ? 'desbloqueado' : 'bloqueado'}">${isUnlk ? '' : '<span class="icone-lock">🔒</span>'}<h4>${mol.form} - ${mol.nome}</h4><p>${mol.desc}</p></div>`;
    });
    document.getElementById('catalogo-overlay').style.display = 'flex';
}

function checarPokedex(grupoId) {
    if(modoAtual !== "livre") return;
    let pecasDoGrupo = Array.from(quadroInner.querySelectorAll(`[data-grupo="${grupoId}"]`));
    let c = { C:0, H:0, O:0, N:0, S:0, P:0, Cl:0, F:0, Br:0, I:0, simples:0, dupla:0, tripla:0, total:0 };
    
    pecasDoGrupo.forEach(p => {
        if(p.dataset.tipo === "atomo") {
            let sigla = p.dataset.sigla; 
            c[sigla] = (c[sigla] || 0) + 1; 
            c.total += 1;
            let hQtd = parseInt(p.dataset.hExtras || 0);
            if(hQtd > 0) {
                c.H = (c.H || 0) + hQtd; 
                c.total += hQtd; 
                c.simples += hQtd;
            }
        } else if(p.dataset.tipo === "ligacao") {
            let val = parseInt(p.dataset.val);
            if(val === 1) c.simples += 1; if(val === 2) c.dupla += 1; if(val === 3) c.tripla += 1;
        }
    });

    let desbloqueados = JSON.parse(localStorage.getItem("catalogoDesbloqueado")) ||[];
    dbCatalogo.forEach(mol => {
        if(mol.chk(c)) {
            if(!desbloqueados.includes(mol.id)) {
                desbloqueados.push(mol.id);
                localStorage.setItem("catalogoDesbloqueado", JSON.stringify(desbloqueados));
                if(typeof window.verificarCatalogador === "function") window.verificarCatalogador();
                if(somConquista) { somConquista.volume = 1.0; somConquista.currentTime = 0; somConquista.play().catch(()=>{}); }
                mostrarMensagemGlob(`🎉 Você catalogou: ${mol.nome} (${mol.form})!`);
            }
        }
    });
}

// ==========================================
// RENDERIZAÇÃO INICIAL DE ÁTOMOS
// ==========================================
const bancoDeAtomos = {
  "facil":[{sigla:"C",val:4}, {sigla:"H",val:1}, {sigla:"O",val:2}, {sigla:"N",val:3}],
  "medio":[{sigla:"S",val:2}, {sigla:"P",val:5}],
  "dificil":[{sigla:"Cl",val:1}, {sigla:"F",val:1}, {sigla:"Br",val:1}, {sigla:"I",val:1}]
};

let atomosPermitidos = modoAtual.includes("medio") ?[...bancoDeAtomos.facil, ...bancoDeAtomos.medio] : (modoAtual.includes("livre") || modoAtual.includes("dificil") || modoAtual.includes("impossivel") ?[...bancoDeAtomos.facil, ...bancoDeAtomos.medio, ...bancoDeAtomos.dificil] :[...bancoDeAtomos.facil]);

atomosPermitidos.forEach(atomo => {
  let div = document.createElement("div");
  div.className = `peca-draggable atomo atomo-${atomo.sigla}`;
  div.innerText = atomo.sigla;
  div.dataset.tipo = "atomo";
  div.dataset.sigla = atomo.sigla;
  div.dataset.valencia = atomo.val;
  listaAtomos.appendChild(div);
});

let pecaEmMovimento = null; let grupoEmMovimento =[];
let mouseStartX = 0, mouseStartY = 0; let zoomLevel = 1;
let historico =[]; let groupIdCounter = 1; 
let pecaAlvoMenu = null;

function salvarEstado() { historico.push(quadroInner.innerHTML); if(historico.length > 2) historico.shift(); }

// ==========================================
// NOVO TUTORIAL ESTILO GENSHIN IMPACT
// ==========================================
const tutorialGenshinData = [
    {
        type: 'video',
        src: 'passo1.mp4',
        text: '<b>Arraste os átomos</b> para o quadro branco para começar a montar as estruturas moleculares. No celular, <b>toque e segure</b> o átomo com o dedo e arraste até o local desejado. No computador, <b>clique com o botão esquerdo</b> do mouse, segure e mova o átomo até a posição adequada.'
    },
    {
        type: 'video',
        src: 'passo2.mp4',
        text: 'Para criar ligações, aproxime os átomos até que fiquem encostados. Quando estiverem corretamente posicionados, a ligação será formada automaticamente.<br><br>Para verificar se estão realmente conectados, <b>mova uma das partes</b>: se a outra se mover junto, a ligação está correta.<br><br>Fique atento às cores: se um átomo piscar em <b><span style="color: #16a34a;">verde</span></b>, significa que sua valência está completa; se piscar em <b><span style="color: #ef4444;">vermelho</span></b>, indica que a valência foi excedida.'
    },
    {
        type: 'video',
        src: 'passo3.mp4',
        text: 'Ao clicar com o botão direito sobre um átomo (ou pressioná-lo no celular), um menu surgirá:<br><br><b>🖨️ Copiar e colar:</b> cria uma cópia idêntica.<br><b>➕ Completar valência (H):</b> completa com Hidrogênios.<br><b>✂️ Desvincular peça:</b> separa o átomo da estrutura.<br><b>🗑️ Excluir molécula inteira:</b> remove toda a estrutura ligada.<br><b>🗑️ Excluir átomo:</b> remove apenas a peça.'
    },
    {
        type: 'video',
        src: 'passo4.mp4',
        text: 'Ao clicar com o botão direito sobre uma ligação, o menu exibirá as opções anteriores e também a função:<br><br><b>🔄 Girar 90°:</b> rotaciona a ligação em 90 graus, permitindo ajustar a orientação da estrutura molecular no quadro.'
    },
    {
        type: 'video',
        src: 'passo5.mp4',
        text: 'Ao dar <b>dois cliques</b> em uma ligação dentro do quadro branco, ela será rotacionada em 90 graus automaticamente, sem a necessidade de abrir o menu de opções. Esse recurso funciona como um atalho para agilizar a edição.'
    },
    {
        type: 'video',
        src: 'passo6.mp4',
        text: 'Ao <b>clicar duas vezes</b> em um átomo ou em uma ligação na barra inferior de peças, ele será automaticamente adicionado ao centro do quadro branco, sem a necessidade de arrastá-lo manualmente. Mais um atalho para agilizar sua montagem!'
    },
    {
        type: 'image',
        src: 'passo7.png',
        text: 'Dentro do quadro, atente-se aos menus:<br><br><b>🔧 Canto inferior direito:</b> ferramentas para dar zoom, desfazer ações, limpar o quadro e tirar foto da molécula.<br><b>❓ Canto superior direito:</b> botão de interrogação que exibe as explicações das ferramentas e permite <b>rever este tutorial</b>.<br><b>📊 Canto superior esquerdo:</b> mostra a quantidade de átomos e o número de valências livres.'
    }
];

let tutorialGenshinStep = 0;

function checkTutorialOnLoad() {
    let tutorialKey = "tutorial_estruturando_v4_" + modoAtual;
    if (!localStorage.getItem(tutorialKey)) {
        abrirNovoTutorial();
        localStorage.setItem(tutorialKey, "visto");
    } else {
        // Se o tutorial não for abrir, o tempo já pode rodar no modo impossível
        if (modoAtual === "impossivel") {
            iniciarCronometro();
        }
    }
}

function abrirNovoTutorial() {
    tutorialGenshinStep = 0;
    document.body.classList.add("no-scroll");
    let modal = document.getElementById("tutorial-genshin-overlay");
    modal.classList.remove("escondido");
    modal.style.display = "flex";
    renderizarPassoTutorialGenshin();
}

function abrirTutorialManual() {
    tocarSomClick();
    document.getElementById('ajuda-overlay').style.display = 'none';
    abrirNovoTutorial();
}

function renderizarPassoTutorialGenshin() {
    const data = tutorialGenshinData[tutorialGenshinStep];
    const mediaContainer = document.getElementById("tutorial-media-container");
    const textContainer = document.getElementById("tutorial-genshin-texto");
    const dotsContainer = document.getElementById("tutorial-dots");
    const btnProsseguir = document.getElementById("btn-tutorial-prosseguir");

    mediaContainer.innerHTML = "";
    if (data.type === 'video') {
        let video = document.createElement('video');
        video.src = data.src;
        video.loop = true;
        video.muted = false; 
        video.playsInline = true;
        mediaContainer.appendChild(video);

        let playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                video.muted = true;
                video.play();
            });
        }
    } else {
        let img = document.createElement('img');
        img.src = data.src;
        mediaContainer.appendChild(img);
    }

    textContainer.innerHTML = data.text;

    dotsContainer.innerHTML = "";
    for (let i = 0; i < tutorialGenshinData.length; i++) {
        let dot = document.createElement('div');
        dot.className = "dot" + (i === tutorialGenshinStep ? " active" : "");
        dotsContainer.appendChild(dot);
    }

    if (tutorialGenshinStep === tutorialGenshinData.length - 1) {
        btnProsseguir.innerText = "Concluir ✔️";
        btnProsseguir.style.background = "#16a34a";
    } else {
        btnProsseguir.innerText = "Prosseguir ➡";
        btnProsseguir.style.background = "#0284c7";
    }
}

window.avancarTutorialGenshin = function() {
    tocarSomClick();
    if (tutorialGenshinStep < tutorialGenshinData.length - 1) {
        tutorialGenshinStep++;
        renderizarPassoTutorialGenshin();
    } else {
        fecharTutorialGenshin();
    }
}

function fecharTutorialGenshin() {
    let modal = document.getElementById("tutorial-genshin-overlay");
    modal.classList.add("escondido");
    modal.style.display = "none";
    document.body.classList.remove("no-scroll");
    document.getElementById("tutorial-media-container").innerHTML = ""; 
    
    // Quando o tutorial fecha, se for o modo impossível, o cronômetro começa a rodar!
    if (modoAtual === "impossivel") {
        iniciarCronometro();
    }
}

setTimeout(checkTutorialOnLoad, 500);


// ==========================================
// DRAG & DROP FÍSICO COM DETECTOR DE DUPLO CLIQUE 
// ==========================================
let ultimoCliqueTempo = 0;

document.addEventListener("pointerdown", (e) => {
    
    if(e.button !== 2 && !e.target.closest("#menu-contexto")) { fecharMenuContexto(); }
    if(e.button === 2) return; 

    let peca = e.target.closest(".peca-draggable");
    if (!peca) return;
    
    let agora = Date.now();
    let tempoDesdeUltimo = agora - ultimoCliqueTempo;
    ultimoCliqueTempo = agora;

    if (tempoDesdeUltimo < 300) {
        if (e.target.closest('.retangulo-pecas') || (pecaEmMovimento && pecaEmMovimento.dataset.recemCriada === "true")) {
            let nova = pecaEmMovimento ? pecaEmMovimento : peca.cloneNode(true);
            if (!pecaEmMovimento) {
                nova.classList.add("no-quadro");
                nova.dataset.id = Date.now();
                quadroInner.appendChild(nova);
            }
            
            let oRect = quadroOuter.getBoundingClientRect();
            let iRect = quadroInner.getBoundingClientRect();
            let tgtX = (oRect.width/2 - iRect.left)/zoomLevel - 20;
            let tgtY = (oRect.height/2 - iRect.top)/zoomLevel - 20;
            
            nova.style.left = tgtX + "px"; 
            nova.style.top = tgtY + "px";
            nova.dataset.noQuadro = "true";
            nova.style.position = "absolute";
            nova.style.zIndex = 10;
            
            grupoEmMovimento =[]; pecaEmMovimento = null;
            resolverColisaoGlobal(); verificarLigacoesQuimicas(); atualizarContadores(); tocarSomClick();
            return; 
        }
        
        if (peca.classList.contains("ligacao") && peca.dataset.noQuadro === "true") {
            if (!peca.dataset.grupo) { 
                salvarEstado(); peca.style.transform = ""; peca.dataset.angle = 0; peca.classList.toggle("lig-vertical"); tocarSomClick();
                grupoEmMovimento =[]; pecaEmMovimento = null;
            }
            return;
        }
    }

    e.preventDefault();
    let novaPeca = false;

    if (e.target.closest('.retangulo-pecas')) {
        salvarEstado(); 
        pecaEmMovimento = peca.cloneNode(true);
        pecaEmMovimento.classList.add("no-quadro");
        pecaEmMovimento.dataset.id = Date.now();
        pecaEmMovimento.dataset.recemCriada = "true"; 

        quadroInner.appendChild(pecaEmMovimento);
        grupoEmMovimento = [pecaEmMovimento];
        novaPeca = true;
    } else {
        salvarEstado(); 
        pecaEmMovimento = peca;
        let gid = peca.dataset.grupo;
        grupoEmMovimento = gid ? Array.from(quadroInner.querySelectorAll(`[data-grupo="${gid}"]`)) : [peca];
    }

    mouseStartX = e.clientX; mouseStartY = e.clientY;

    grupoEmMovimento.forEach(p => {
        let pRect = p.getBoundingClientRect();
        let innerRect = quadroInner.getBoundingClientRect();
        let startX = parseFloat(p.style.left) || ((pRect.left - innerRect.left) / zoomLevel);
        let startY = parseFloat(p.style.top) || ((pRect.top - innerRect.top) / zoomLevel);
        
        if(novaPeca) {
            startX = (e.clientX - innerRect.left - (p.offsetWidth/2)) / zoomLevel;
            startY = (e.clientY - innerRect.top - (p.offsetHeight/2)) / zoomLevel;
        }
        p.dataset.startX = startX; p.dataset.startY = startY; p.style.zIndex = 1000;
    });

    moverGrupo(e.clientX, e.clientY);
});

document.addEventListener("pointermove", (e) => {
    if (grupoEmMovimento.length === 0) return;
    moverGrupo(e.clientX, e.clientY);
});

document.addEventListener("pointerup", (e) => {
    if (grupoEmMovimento.length === 0) return;

    let isNoQuadro = pecaEmMovimento.dataset.noQuadro === "true";

    let sobrePainel = false;
    let paineis = document.querySelectorAll('.painel-info, .painel-ferramentas, .btn-ajuda, .btn-catalogo, .btn-verificar');
    paineis.forEach(painel => {
        if(!painel.classList.contains("escondido") && painel.offsetParent !== null) {
            let rect = painel.getBoundingClientRect();
            if(e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                sobrePainel = true;
            }
        }
    });

    if (sobrePainel) {
        if (isNoQuadro) {
            grupoEmMovimento.forEach(p => { p.style.left = p.dataset.startX + "px"; p.style.top = p.dataset.startY + "px"; });
            mostrarMensagemGlob("⚠️ Área ocupada pela interface do jogo!");
        } else {
            grupoEmMovimento.forEach(p => p.remove()); 
        }
        atualizarContadores(); pecaEmMovimento = null; grupoEmMovimento =[]; return; 
    }

    let quadroRect = quadroOuter.getBoundingClientRect();
    let soltouDentro = (e.clientX >= quadroRect.left && e.clientX <= quadroRect.right && e.clientY >= quadroRect.top && e.clientY <= quadroRect.bottom);

    if (soltouDentro || isNoQuadro) {
        grupoEmMovimento.forEach(p => { p.dataset.noQuadro = "true"; p.style.position = "absolute"; p.style.zIndex = 10; });

        if(grupoEmMovimento.length === 1) {
            let cx = e.clientX, cy = e.clientY;
            let sobreposto = Array.from(quadroInner.querySelectorAll('.peca-draggable.no-quadro')).find(outra => {
                if(outra === pecaEmMovimento) return false;
                let oRect = outra.getBoundingClientRect();
                let oCx = oRect.left + oRect.width/2; let oCy = oRect.top + oRect.height/2;
                return (Math.hypot(cx - oCx, cy - oCy) < 15 && outra.dataset.tipo === pecaEmMovimento.dataset.tipo);
            });
            if(sobreposto) { 
                pecaAlvoMenu = sobreposto; window.cmDesvincular(); sobreposto.remove(); pecaAlvoMenu = null;
                mostrarMensagemGlob("🗑️ Peça sobreposta removida!");
            }
        }

        resolverColisaoGlobal(); verificarLigacoesQuimicas(); tocarSomClick();
    } else {
        grupoEmMovimento.forEach(p => p.remove());
    }

    atualizarContadores(); pecaEmMovimento = null; grupoEmMovimento =[];
});


// ==========================================
// MENU DE CONTEXTO (BOTÃO DIREITO)
// ==========================================
document.addEventListener("contextmenu", (e) => {
    let peca = e.target.closest(".peca-draggable.no-quadro");
    if(!peca) return;
    e.preventDefault();
    pecaAlvoMenu = peca;

    let menu = document.getElementById("menu-contexto");
    let lista = document.getElementById("lista-menu-contexto");
    lista.innerHTML = "";

    let isVinculado = peca.dataset.grupo ? true : false;
    
    lista.innerHTML += `<li onclick="window.cmCopiar()">🖨️ Copiar e Colar</li>`;

    if(peca.dataset.tipo === "atomo") {
        lista.innerHTML += `<li onclick="window.cmCompletar()">➕ Completar Valência (H)</li>`;
        if (isVinculado) {
            lista.innerHTML += `<li onclick="window.cmDesvincular()">✂️ Desvincular Peça</li>`;
            lista.innerHTML += `<li onclick="window.cmExcluirMolecula()">🗑️ Excluir Molécula Inteira</li>`;
        } else {
            lista.innerHTML += `<li onclick="window.cmExcluir()">🗑️ Excluir Átomo</li>`;
        }
    } else {
        if (isVinculado) {
            lista.innerHTML += `<li onclick="window.cmDesvincular()">✂️ Desvincular Ligação</li>`;
            lista.innerHTML += `<li onclick="window.cmExcluirMolecula()">🗑️ Excluir Molécula Inteira</li>`;
        } else {
            lista.innerHTML += `<li onclick="window.cmGirar90()">🔄 Girar 90°</li>`;
            lista.innerHTML += `<li onclick="window.cmExcluir()">🗑️ Excluir Ligação</li>`;
        }
    }

    menu.style.left = e.clientX + "px";
    menu.style.top = e.clientY + "px";
    menu.classList.remove("escondido");
});

function curarQuadro() {
    let all = Array.from(quadroInner.querySelectorAll('.peca-draggable.no-quadro'));
    all.forEach(p => { p.dataset.grupo = ""; p.dataset.occL = ""; p.dataset.occR = ""; p.dataset.occT = ""; p.dataset.occB = ""; });
    recalcularTudo(all);
}

window.cmCopiar = function() {
    if(!pecaAlvoMenu) return;
    salvarEstado();
    
    let nova = pecaAlvoMenu.cloneNode(true);
    nova.dataset.id = Date.now();
    nova.dataset.grupo = ""; 
    nova.dataset.occL = ""; nova.dataset.occR = ""; nova.dataset.occT = ""; nova.dataset.occB = "";
    nova.dataset.valUso = 0;
    nova.classList.remove("atomo-erro", "atomo-sucesso");
    
    let hSub = nova.querySelector('.hidrogenio-completo');
    if(hSub) { hSub.remove(); nova.dataset.hExtras = 0; }

    let currX = parseFloat(pecaAlvoMenu.style.left);
    let currY = parseFloat(pecaAlvoMenu.style.top);
    nova.style.left = (currX + 30) + "px";
    nova.style.top = (currY + 30) + "px";

    quadroInner.appendChild(nova);
    fecharMenuContexto();
    resolverColisaoGlobal(); verificarLigacoesQuimicas(); atualizarContadores(); tocarSomClick();
};

window.cmExcluir = function() { 
    if(!pecaAlvoMenu) return; salvarEstado(); let p = pecaAlvoMenu; fecharMenuContexto(); p.remove(); curarQuadro(); atualizarContadores(); 
};

window.cmExcluirMolecula = function() {
    if(!pecaAlvoMenu) return;
    salvarEstado();
    let gid = pecaAlvoMenu.dataset.grupo;
    fecharMenuContexto(); 
    if(gid) {
        let grupoInteiro = quadroInner.querySelectorAll(`[data-grupo="${gid}"]`);
        grupoInteiro.forEach(p => p.remove());
    } else { pecaAlvoMenu.remove(); }
    curarQuadro(); atualizarContadores();
};

window.cmGirar90 = function() { 
    if(!pecaAlvoMenu) return; salvarEstado(); pecaAlvoMenu.style.transform = ""; pecaAlvoMenu.dataset.angle = 0; pecaAlvoMenu.classList.toggle("lig-vertical"); fecharMenuContexto(); 
};

window.cmCompletar = function() {
    if(!pecaAlvoMenu) return;
    salvarEstado();
    let valMax = parseInt(pecaAlvoMenu.dataset.valencia);
    let valUso = parseInt(pecaAlvoMenu.dataset.valUso || 0);
    let falta = valMax - valUso;

    if(falta > 0) {
        let hAntigo = pecaAlvoMenu.querySelector(".hidrogenio-completo");
        if(hAntigo) hAntigo.remove();
        
        let hidr = document.createElement("div"); 
        hidr.className = "hidrogenio-completo"; 
        hidr.innerHTML = `H<sub>${falta > 1 ? falta : ''}</sub>`;
        pecaAlvoMenu.appendChild(hidr); 
        pecaAlvoMenu.dataset.hExtras = falta; 
        
        checarValidacaoAtomo(pecaAlvoMenu);
        if(pecaAlvoMenu.dataset.grupo) checarPokedex(pecaAlvoMenu.dataset.grupo);
    } else { 
        mostrarMensagemGlob("⚠️ Valência já está completa ou excedida!"); 
    }
    fecharMenuContexto(); atualizarContadores();
};

window.cmDesvincular = function() {
    if(!pecaAlvoMenu) return;
    salvarEstado();
    let p = pecaAlvoMenu;
    fecharMenuContexto();
    
    let hSub = p.querySelector('.hidrogenio-completo');
    if (hSub) { hSub.remove(); p.dataset.hExtras = 0; }

    let currX = parseFloat(p.style.left); let currY = parseFloat(p.style.top);
    p.style.left = (currX + 30) + "px"; p.style.top = (currY + 30) + "px";

    resolverColisaoGlobal(); curarQuadro(); atualizarContadores(); 
};

function fecharMenuContexto() { document.getElementById("menu-contexto").classList.add("escondido"); pecaAlvoMenu = null; }

// ==========================================
// MOVIMENTO, FÍSICA E ÍMÃ
// ==========================================
function moverGrupo(mouseX, mouseY) {
    let rawDx = (mouseX - mouseStartX) / zoomLevel; let rawDy = (mouseY - mouseStartY) / zoomLevel;
    let isNoQuadro = grupoEmMovimento[0].dataset.noQuadro === "true";

    if (isNoQuadro) {
        let boardW = quadroInner.clientWidth / zoomLevel; let boardH = quadroInner.clientHeight / zoomLevel;
        let minDx = -Infinity, maxDx = Infinity, minDy = -Infinity, maxDy = Infinity;
        grupoEmMovimento.forEach(p => {
            let sX = parseFloat(p.dataset.startX); let sY = parseFloat(p.dataset.startY);
            if (-sX > minDx) minDx = -sX;
            if (boardW - p.offsetWidth - sX < maxDx) maxDx = boardW - p.offsetWidth - sX;
            if (-sY > minDy) minDy = -sY;
            if (boardH - p.offsetHeight - sY < maxDy) maxDy = boardH - p.offsetHeight - sY;
        });
        rawDx = Math.max(minDx, Math.min(rawDx, maxDx)); rawDy = Math.max(minDy, Math.min(rawDy, maxDy));
    }
    grupoEmMovimento.forEach(p => { p.style.left = (parseFloat(p.dataset.startX) + rawDx) + "px"; p.style.top = (parseFloat(p.dataset.startY) + rawDy) + "px"; });
}

const oppos = { 'R':'L', 'L':'R', 'T':'B', 'B':'T' };

function getSnapPoints(peca) {
    let isV = peca.classList.contains("lig-vertical"); let type = peca.dataset.tipo;
    let x = parseFloat(peca.style.left) || 0, y = parseFloat(peca.style.top) || 0; let pts =[];
    if (type === "atomo") {
        if (!peca.dataset.occR) pts.push({ x: x+40, y: y+20, dir: 'H', id: 'R', peca: peca });
        if (!peca.dataset.occL) pts.push({ x: x+0,  y: y+20, dir: 'H', id: 'L', peca: peca });
        if (!peca.dataset.occT) pts.push({ x: x+20, y: y+0,  dir: 'V', id: 'T', peca: peca });
        if (!peca.dataset.occB) pts.push({ x: x+20, y: y+40, dir: 'V', id: 'B', peca: peca });
    } else {
        if (!isV) {
            if (!peca.dataset.occR) pts.push({ x: x+40, y: y+10, dir: 'H', id: 'R', peca: peca });
            if (!peca.dataset.occL) pts.push({ x: x+0,  y: y+10, dir: 'H', id: 'L', peca: peca });
        } else {
            if (!peca.dataset.occB) pts.push({ x: x+10, y: y+40, dir: 'V', id: 'B', peca: peca });
            if (!peca.dataset.occT) pts.push({ x: x+10, y: y+0,  dir: 'V', id: 'T', peca: peca });
        }
    }
    return pts;
}

function verificarLigacoesQuimicas() {
    let allPecas = Array.from(quadroInner.querySelectorAll('.peca-draggable.no-quadro'));
    recalcularTudo(allPecas);
}

function recalcularTudo(allPecas) {
    allPecas.forEach(p => {
        p.dataset.occL = ""; p.dataset.occR = ""; p.dataset.occT = ""; p.dataset.occB = "";
        let hExtras = parseInt(p.dataset.hExtras || 0);
        p.dataset.valUso = hExtras;
    });

    for(let i=0; i < allPecas.length; i++){
        for(let j=i+1; j < allPecas.length; j++){
            let p1 = allPecas[i], p2 = allPecas[j];
            if(p1.dataset.tipo === p2.dataset.tipo) continue;

            let pts1 = getSnapPoints(p1), pts2 = getSnapPoints(p2);
            pts1.forEach(pt1 => {
                pts2.forEach(pt2 => {
                    if(pt1.dir === pt2.dir && pt1.id === oppos[pt2.id] && Math.hypot(pt1.x - pt2.x, pt1.y - pt2.y) < 10) {
                        
                        if(grupoEmMovimento.includes(p1) && !grupoEmMovimento.includes(p2)) {
                            let diffX = pt2.x - pt1.x, diffY = pt2.y - pt1.y;
                            grupoEmMovimento.forEach(g => { g.style.left = (parseFloat(g.style.left)+diffX)+"px"; g.style.top = (parseFloat(g.style.top)+diffY)+"px"; });
                        }
                        
                        let gId1 = p1.dataset.grupo; let gId2 = p2.dataset.grupo;
                        let novoG = gId1 || gId2 || ("g" + groupIdCounter++);
                        allPecas.forEach(p => { if ((gId1 && p.dataset.grupo === gId1) || (gId2 && p.dataset.grupo === gId2)) { p.dataset.grupo = novoG; } });
                        p1.dataset.grupo = novoG; p2.dataset.grupo = novoG;
                        
                        p1.dataset["occ"+pt1.id] = "true"; p2.dataset["occ"+pt2.id] = "true";
                        let atomo = p1.dataset.tipo === "atomo" ? p1 : p2; let lig = p1.dataset.tipo === "ligacao" ? p1 : p2;
                        atomo.dataset.valUso = parseInt(atomo.dataset.valUso) + parseInt(lig.dataset.val);
                    }
                });
            });
        }
    }
    
    let grpUnicos = new Set();
    allPecas.forEach(atomo => { 
        if(atomo.dataset.tipo === "atomo") checarValidacaoAtomo(atomo); 
        if(atomo.dataset.grupo) grpUnicos.add(atomo.dataset.grupo);
    });

    if(modoAtual === "livre") { grpUnicos.forEach(gId => checarPokedex(gId)); }
}

function resolverColisaoGlobal() {
    let all = Array.from(quadroInner.querySelectorAll('.peca-draggable.no-quadro'));
    if(all.length === 0) return;
    
    let boardW = quadroOuter.clientWidth / zoomLevel; let boardH = quadroOuter.clientHeight / zoomLevel;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    all.forEach(p => {
        let x = parseFloat(p.style.left); let y = parseFloat(p.style.top);
        if(x < minX) minX = x; if(y < minY) minY = y;
        if(x + p.offsetWidth > maxX) maxX = x + p.offsetWidth;
        if(y + p.offsetHeight > maxY) maxY = y + p.offsetHeight;
    });

    let shiftX = 0, shiftY = 0;
    if (minX < 0) shiftX = -minX; else if (maxX > boardW) shiftX = boardW - maxX;
    if (minY < 0) shiftY = -minY; else if (maxY > boardH) shiftY = boardH - maxY;

    if (shiftX !== 0 || shiftY !== 0) {
        all.forEach(p => { p.style.left = (parseFloat(p.style.left) + shiftX) + "px"; p.style.top = (parseFloat(p.style.top) + shiftY) + "px"; });
    }
}

function checarValidacaoAtomo(atomo) {
    let max = parseInt(atomo.dataset.valencia); let uso = parseInt(atomo.dataset.valUso);
    atomo.classList.remove("atomo-erro", "atomo-sucesso");
    void atomo.offsetWidth; 
    
    if(uso > max) {
        atomo.classList.add("atomo-erro"); atomo.dataset.tocado = "false";
        somErro.currentTime = 0; somErro.play().catch(()=>{}); mostrarMensagemGlob("🚨 Valência Excedida!");
    } else if (uso === max && uso > 0) {
        atomo.classList.add("atomo-sucesso");
        if(atomo.dataset.tocado !== "true") {
            somCorreto.currentTime = 0; somCorreto.play().catch(()=>{}); atomo.dataset.tocado = "true";
        }
    } else { atomo.dataset.tocado = "false"; }
}

// ==========================================
// FERRAMENTAS DO QUADRO E ATUALIZAÇÕES
// ==========================================
function mudarZoom(d) { 
    tocarSomClick(); zoomLevel = Math.max(0.5, Math.min(2, zoomLevel+d)); atualizarVisao(); resolverColisaoGlobal(); 
}
function resetarVisao() { 
    tocarSomClick(); zoomLevel = 1; atualizarVisao(); resolverColisaoGlobal(); 
}
function atualizarVisao() { quadroInner.style.transform = `scale(${zoomLevel})`; }

function limparQuadro() { 
    salvarEstado(); tocarSomClick(); quadroInner.innerHTML = ""; atualizarContadores(); 
}
function desfazerAcao() { 
    tocarSomClick(); if(historico.length > 0){ quadroInner.innerHTML = historico.pop(); verificarLigacoesQuimicas(); atualizarContadores(); } 
}

window.girarMoleculas = function() {
    salvarEstado(); tocarSomClick();
    let allPecas = Array.from(quadroInner.querySelectorAll('.peca-draggable.no-quadro'));
    if(allPecas.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    allPecas.forEach(p => {
        let x = parseFloat(p.style.left); let y = parseFloat(p.style.top); let w = p.offsetWidth; let h = p.offsetHeight;
        if(x < minX) minX = x; if(y < minY) minY = y; if(x+w > maxX) maxX = x+w; if(y+h > maxY) maxY = y+h;
    });

    let cx = (minX + maxX) / 2; let cy = (minY + maxY) / 2;

    allPecas.forEach(p => {
        let x = parseFloat(p.style.left); let y = parseFloat(p.style.top); let w = p.offsetWidth; let h = p.offsetHeight;
        let px = x + w/2 - cx; let py = y + h/2 - cy; let nx = -py; let ny = px;

        if (p.dataset.tipo === "ligacao") { p.classList.toggle("lig-vertical"); p.style.transform = ""; p.dataset.angle = 0; let temp = w; w = h; h = temp; }
        p.style.left = (cx + nx - w/2) + "px"; p.style.top = (cy + ny - h/2) + "px";
    });

    resolverColisaoGlobal(); verificarLigacoesQuimicas(); atualizarContadores();
};

function tirarFoto() {
  tocarSomClick(); mostrarMensagemGlob("📸 Processando...");
  html2canvas(document.getElementById("quadro-inner"), { backgroundColor: "#ffffff" }).then(c => {
    let l = document.createElement('a'); l.download = 'molecula.png'; l.href = c.toDataURL('image/png'); l.click(); mostrarMensagemGlob("✅ Foto salva!");
  });
}

function atualizarContadores() { 
    let allA = quadroInner.querySelectorAll('.atomo'); let t = 0, u = 0;
    allA.forEach(a => { t += parseInt(a.dataset.valencia||0); u += parseInt(a.dataset.valUso||0); });
    document.getElementById("cont-atomos").innerText = allA.length; document.getElementById("cont-valencias").innerText = (t - u);
}

function togglePainel(id) { 
    tocarSomClick(); let p = document.getElementById(id); p.classList.toggle("painel-recolhido"); let btn = p.querySelector("button");
    if(p.classList.contains("painel-recolhido")) { btn.innerText = "▶ Mostrar"; } else { btn.innerText = id === 'painelInfo' ? "📊 Ocultar" : "🛠️ Ferramentas ⬇"; }
}