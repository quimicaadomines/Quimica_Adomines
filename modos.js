// ==========================================
// TELA DE SELEÇÃO DE MODOS - QUÍMICA ADÔMINES
// ==========================================

function abrirSubmenu(tipo) {
  if (typeof tocarSomClick === "function") tocarSomClick();
  let menuNormal = document.getElementById("submenu-normal");
  let menuInclusao = document.getElementById("submenu-inclusao");
  let menuDificuldades = document.getElementById("submenu-dificuldades");
  let menuBalanceando = document.getElementById("submenu-balanceando");

  if (menuNormal) menuNormal.classList.add("escondido");
  if (menuInclusao) menuInclusao.classList.add("escondido");
  if (menuDificuldades) menuDificuldades.classList.add("escondido");
  if (menuBalanceando) menuBalanceando.classList.add("escondido");

  if (tipo === 'normal' && menuNormal) {
    menuNormal.classList.remove("escondido");
  } else if (tipo === 'inclusao' && menuInclusao) {
    menuInclusao.classList.remove("escondido");
  } else if (tipo === 'balanceando' && menuBalanceando) {
    menuBalanceando.classList.remove("escondido");
  }
}

function mostrarDificuldades() {
  if (typeof tocarSomClick === "function") tocarSomClick();
  let menuDificuldades = document.getElementById("submenu-dificuldades");
  if (!menuDificuldades) return;
  
  if (menuDificuldades.classList.contains("escondido")) {
    menuDificuldades.classList.remove("escondido");
  } else {
    menuDificuldades.classList.add("escondido");
  }
}

function iniciarModo(modoEscolhido) {
  if (typeof tocarSomClick === "function") tocarSomClick();
 
  localStorage.setItem("modoAtual", modoEscolhido);

  if(modoEscolhido.includes("inclusao")) {
      mudarTela("inclusao.html");
  } else if(modoEscolhido.includes("balanceando")) {
      mudarTela("balanceando.html");
  } else {
      mudarTela("estruturando.html");
  }
}

// ==========================================
// ATUALIZAÇÃO DOS PLACARES DE ESTRELAS NOS BOTÕES
// ==========================================
function atualizarBadgesEstrelas() {
    const configuracaoModos = [
        { modo: "facil", max: 5 },
        { modo: "medio", max: 5 },
        { modo: "dificil", max: 5 },
        { modo: "impossivel", max: 5 },
        { modo: "balanceando-facil", max: 10 },
        { modo: "balanceando-medio", max: 10 },
        { modo: "balanceando-dificil", max: 10 },
        { modo: "balanceando-impossivel", max: 10 }
    ];

    configuracaoModos.forEach(cfg => {
        let btn = document.querySelector(`[data-modo="${cfg.modo}"]`);
        if (btn) {
            let recorde = typeof window.obterRecordeEstrelas === "function" 
                ? window.obterRecordeEstrelas(cfg.modo) 
                : parseInt(localStorage.getItem("recorde_estrelas_" + cfg.modo) || "0");
            
            let span = btn.querySelector('.badge-estrelas');
            if (!span) {
                span = document.createElement("span");
                span.className = "badge-estrelas";
                btn.appendChild(span);
            }
            
            span.innerText = `⭐ ${recorde}/${cfg.max}`;
            
            if (recorde >= cfg.max && cfg.max > 0) {
                span.classList.add("ouro");
            } else if (recorde > 0) {
                span.classList.add("parcial");
            }
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    atualizarBadgesEstrelas();
});

// Atualiza caso a página já tenha sido carregada em cache
if (document.readyState === "complete" || document.readyState === "interactive") {
    atualizarBadgesEstrelas();
}