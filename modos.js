function abrirSubmenu(tipo) {
  tocarSomClick(); 
  let menuNormal = document.getElementById("submenu-normal");
  let menuInclusao = document.getElementById("submenu-inclusao");
  let menuDificuldades = document.getElementById("submenu-dificuldades");

  menuNormal.classList.add("escondido");
  menuInclusao.classList.add("escondido");
  menuDificuldades.classList.add("escondido");

  if (tipo === 'normal') {
    menuNormal.classList.remove("escondido");
  } else if (tipo === 'inclusao') {
    menuInclusao.classList.remove("escondido");
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

  // Se for o modo inclusivo, vai pra tela nova. Se não, vai pro Estruturando!
  if(modoEscolhido.includes("inclusao")) {
      mudarTela("inclusao.html");
  } else {
      mudarTela("estruturando.html");
  }
}