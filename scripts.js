document.addEventListener("DOMContentLoaded", () => {
  const botaoTema = document.getElementById("botaoTema");

  const form = document.getElementById("registerForm");

  const cepInput = document.getElementById("cep");
  const telefoneInput = document.getElementById("telefone");
  const cepMessage = document.getElementById("cepMessage");
  const cepWrapper = document.querySelector(".cep-wrapper");

  const clearButton = document.getElementById("clearButton");
  const savedStatus = document.getElementById("savedStatus");

  const themeIcon = document.getElementById("themeIcon");
  const themeText = document.getElementById("themeText");

  const STORAGE_KEY = "cadastroUsuario";
  const THEME_KEY = "tema";

  const campos = [
    "nome",
    "email",
    "telefone",
    "cep",
    "logradouro",
    "numero",
    "complemento",
    "bairro",
    "cidade",
    "uf"
  ];

  /*
  =================================
  TEMA CLARO E ESCURO
  =================================
  */

  function atualizarBotaoTema(tema) {
    const temaEscuro = tema === "dark";

    if (themeIcon) {
      themeIcon.textContent = temaEscuro ? "☀" : "☾";
    }

    if (themeText) {
      themeText.textContent = temaEscuro
        ? "Tema claro"
        : "Tema escuro";
    }

    if (botaoTema) {
      botaoTema.setAttribute(
        "aria-label",
        temaEscuro
          ? "Mudar para tema claro"
          : "Mudar para tema escuro"
      );
    }
  }

  function aplicarTema(tema) {
    const temaEscuro = tema === "dark";

    /*
      A classe dark é usada pelo código enviado.
      A classe dark-theme também é adicionada para funcionar
      com o CSS anterior do projeto.
    */
    document.body.classList.toggle("dark", temaEscuro);
    document.body.classList.toggle("dark-theme", temaEscuro);

    localStorage.setItem(THEME_KEY, tema);

    atualizarBotaoTema(tema);
  }

  if (botaoTema) {
    botaoTema.addEventListener("click", () => {
      const temaAtual = localStorage.getItem(THEME_KEY) || "light";

      const novoTema = temaAtual === "dark"
        ? "light"
        : "dark";

      aplicarTema(novoTema);
    });
  }

  function carregarTema() {
    const temaSalvo = localStorage.getItem(THEME_KEY);

    if (temaSalvo === "dark") {
      aplicarTema("dark");
    } else {
      aplicarTema("light");
    }
  }

  /*
  =================================
  LOCAL STORAGE DO FORMULÁRIO
  =================================
  */

  function obterDadosFormulario() {
    const dados = {};

    campos.forEach((campo) => {
      const elemento = document.getElementById(campo);

      if (elemento) {
        dados[campo] = elemento.value;
      }
    });

    return dados;
  }

  function salvarDados() {
    const dados = obterDadosFormulario();

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(dados)
    );

    if (savedStatus) {
      savedStatus.textContent = "● Dados salvos";
      savedStatus.style.color = "var(--success)";
    }
  }

  function restaurarDados() {
    const dadosSalvos = localStorage.getItem(STORAGE_KEY);

    if (!dadosSalvos) {
      return;
    }

    try {
      const dados = JSON.parse(dadosSalvos);

      campos.forEach((campo) => {
        const elemento = document.getElementById(campo);

        if (elemento && dados[campo] !== undefined) {
          elemento.value = dados[campo];
        }
      });

      if (cepInput && dados.cep) {
        cepInput.value = formatarCep(dados.cep);
      }

      if (telefoneInput && dados.telefone) {
        telefoneInput.value = formatarTelefone(
          dados.telefone
        );
      }

      if (cepMessage) {
        cepMessage.textContent =
          "Dados restaurados do navegador.";

        cepMessage.classList.remove(
          "message-normal",
          "message-error"
        );

        cepMessage.classList.add("message-success");
      }
    } catch (erro) {
      console.error(
        "Erro ao restaurar os dados:",
        erro
      );
    }
  }

  /*
  =================================
  MÁSCARA DE CEP
  =================================
  */

  function formatarCep(valor) {
    const numeros = valor
      .replace(/\D/g, "")
      .slice(0, 8);

    if (numeros.length > 5) {
      return `${numeros.slice(0, 5)}-${numeros.slice(5)}`;
    }

    return numeros;
  }

  /*
  =================================
  MÁSCARA DE TELEFONE
  =================================
  */

  function formatarTelefone(valor) {
    const numeros = valor
      .replace(/\D/g, "")
      .slice(0, 11);

    if (numeros.length <= 10) {
      return numeros
        .replace(/^(\d{2})(\d)/g, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }

    return numeros
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  }

  /*
  =================================
  MENSAGENS DO CEP
  =================================
  */

  function mostrarMensagemCep(mensagem, tipo = "normal") {
    if (!cepMessage) {
      return;
    }

    cepMessage.textContent = mensagem;

    cepMessage.classList.remove(
      "message-normal",
      "message-success",
      "message-error"
    );

    cepMessage.classList.add(`message-${tipo}`);
  }

  function limparEndereco() {
    const camposEndereco = [
      "logradouro",
      "bairro",
      "cidade",
      "uf"
    ];

    camposEndereco.forEach((campo) => {
      const elemento = document.getElementById(campo);

      if (elemento) {
        elemento.value = "";
      }
    });
  }

  /*
  =================================
  CONSULTA DA API VIA CEP
  =================================
  */

  async function buscarCep() {
    if (!cepInput) {
      return;
    }

    const cep = cepInput.value.replace(/\D/g, "");

    if (cep.length !== 8) {
      limparEndereco();

      cepInput.classList.remove("input-success");
      cepInput.classList.add("input-error");

      mostrarMensagemCep("CEP inválido", "error");

      return;
    }

    if (cepWrapper) {
      cepWrapper.classList.add("loading-active");
    }

    cepInput.classList.remove(
      "input-error",
      "input-success"
    );

    mostrarMensagemCep(
      "Consultando CEP...",
      "normal"
    );

    try {
      const resposta = await fetch(
        `https://viacep.com.br/ws/${cep}/json/`
      );

      if (!resposta.ok) {
        throw new Error(
          "Erro na comunicação com a API ViaCEP."
        );
      }

      const endereco = await resposta.json();

      if (endereco.erro) {
        limparEndereco();

        cepInput.classList.remove("input-success");
        cepInput.classList.add("input-error");

        mostrarMensagemCep(
          "CEP inválido",
          "error"
        );

        salvarDados();

        return;
      }

      document.getElementById("logradouro").value =
        endereco.logradouro || "";

      document.getElementById("bairro").value =
        endereco.bairro || "";

      document.getElementById("cidade").value =
        endereco.localidade || "";

      document.getElementById("uf").value =
        endereco.uf || "";

      cepInput.classList.remove("input-error");
      cepInput.classList.add("input-success");

      mostrarMensagemCep(
        "Endereço preenchido automaticamente.",
        "success"
      );

      salvarDados();
    } catch (erro) {
      console.error(
        "Erro ao consultar o CEP:",
        erro
      );

      limparEndereco();

      cepInput.classList.remove("input-success");
      cepInput.classList.add("input-error");

      mostrarMensagemCep(
        "CEP inválido",
        "error"
      );
    } finally {
      if (cepWrapper) {
        cepWrapper.classList.remove(
          "loading-active"
        );
      }
    }
  }

  /*
  =================================
  EVENTO DO CAMPO CEP
  =================================
  */

  if (cepInput) {
    cepInput.addEventListener("input", () => {
      cepInput.value = formatarCep(
        cepInput.value
      );

      cepInput.classList.remove(
        "input-error",
        "input-success"
      );

      const cep = cepInput.value.replace(
        /\D/g,
        ""
      );

      if (cep.length === 0) {
        mostrarMensagemCep(
          "Digite o CEP para buscar o endereço.",
          "normal"
        );
      }

      if (cep.length > 0 && cep.length < 8) {
        mostrarMensagemCep(
          "Digite um CEP com 8 números.",
          "normal"
        );
      }

      if (cep.length === 8) {
        buscarCep();
      }

      salvarDados();
    });
  }

  /*
  =================================
  EVENTO DO TELEFONE
  =================================
  */

  if (telefoneInput) {
    telefoneInput.addEventListener("input", () => {
      telefoneInput.value = formatarTelefone(
        telefoneInput.value
      );

      salvarDados();
    });
  }

  /*
  =================================
  SALVAMENTO AUTOMÁTICO
  =================================
  */

  campos.forEach((campo) => {
    const elemento = document.getElementById(campo);

    if (!elemento) {
      return;
    }

    elemento.addEventListener(
      "input",
      salvarDados
    );

    elemento.addEventListener(
      "change",
      salvarDados
    );
  });

  /*
  =================================
  BOTÃO SALVAR CADASTRO
  =================================
  */

  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const cep = cepInput
        ? cepInput.value.replace(/\D/g, "")
        : "";

      if (cep.length !== 8) {
        cepInput.classList.add("input-error");

        mostrarMensagemCep(
          "CEP inválido",
          "error"
        );

        cepInput.focus();

        return;
      }

      if (!form.checkValidity()) {
        form.reportValidity();

        return;
      }

      salvarDados();

      if (savedStatus) {
        savedStatus.textContent =
          "✓ Cadastro salvo com sucesso";

        savedStatus.style.color =
          "var(--success)";
      }

      alert(
        "Cadastro salvo com sucesso!"
      );

      setTimeout(() => {
        if (savedStatus) {
          savedStatus.textContent =
            "● Dados salvos";
        }
      }, 3000);
    });
  }

  /*
  =================================
  BOTÃO LIMPAR DADOS
  =================================
  */

  if (clearButton) {
    clearButton.addEventListener("click", () => {
      const confirmou = confirm(
        "Deseja realmente limpar todos os dados?"
      );

      if (!confirmou) {
        return;
      }

      if (form) {
        form.reset();
      }

      localStorage.removeItem(STORAGE_KEY);

      if (cepInput) {
        cepInput.classList.remove(
          "input-error",
          "input-success"
        );
      }

      mostrarMensagemCep(
        "Digite o CEP para buscar o endereço.",
        "normal"
      );

      if (savedStatus) {
        savedStatus.textContent =
          "Dados removidos";

        savedStatus.style.color =
          "#d64545";
      }

      setTimeout(() => {
        if (savedStatus) {
          savedStatus.textContent =
            "● Dados salvos";

          savedStatus.style.color =
            "var(--success)";
        }
      }, 3000);
    });
  }

  /*
  =================================
  INICIALIZAÇÃO
  =================================
  */

  carregarTema();
  restaurarDados();
});
