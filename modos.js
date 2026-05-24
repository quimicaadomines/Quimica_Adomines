function abrirSubmenu(tipo) {
  tocarSomClick();
  let menuNormal = document.getElementById("submenu-normal");
  let menuInclusao = document.getElementById("submenu-inclusao");
  let menuDificuldades = document.getElementById("submenu-dificuldades");
  let menuBalanceando = document.getElementById("submenu-balanceando");

  // Esconde tudo primeiro
  menuNormal.classList.add("escondido");
  menuInclusao.classList.add("escondido");
  menuDificuldades.classList.add("escondido");
  if(menuBalanceando) menuBalanceando.classList.add("escondido");

  // Abre apenas o clicado
  if (tipo === 'normal') {
    menuNormal.classList.remove("escondido");
  } else if (tipo === 'inclusao') {
    menuInclusao.classList.remove("escondido");
  } else if (tipo === 'balanceando') {
    menuBalanceando.classList.remove("escondido");
  }
}

function mostrarDificuldades() {
  tocarSomClick();
  let menuDificuldades = document.getElementById("submenu-dificuldades");
  if (menuDificuldades.classList.contains("escondido")) {
    menuDificuldades.classList.remove("escondido");
  } else {
    menuDificuldades.classList.add("escondido");
  }
}

function iniciarModo(modoEscolhido) {
  tocarSomClick();
 
  localStorage.setItem("modoAtual", modoEscolhido);

  // Redirecionamento correto conforme o prefixo do modo
  if(modoEscolhido.includes("inclusao")) {
      mudarTela("inclusao.html");
  } else if(modoEscolhido.includes("balanceando")) {
      mudarTela("balanceando.html");
  } else {
      mudarTela("estruturando.html");
  }
}