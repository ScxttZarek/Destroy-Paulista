(function() {
    const API_URL = "http://localhost:3000/resolver"; // Seu servidor

    function encontrarResposta() {
        let opcoes = document.querySelectorAll('.MuiFormControlLabel-root');

        opcoes.forEach(opcao => {
            let texto = opcao.innerText.trim().toLowerCase();
            
            if (texto.includes("correta")) { // Verifica se a resposta contém a palavra "correta"
                let radioInput = opcao.querySelector('input[type="radio"]');
                
                if (radioInput) {
                    radioInput.click(); // Marca a opção correta
                    console.log("✅ Resposta correta marcada:", texto);
                }
            }
        });
    }

    async function responderQuestoes() {
        let questoes = document.querySelectorAll('[chavebase]');

        for (let questao of questoes) {
            let textoQuestao = questao.innerText.trim();
            console.log("📖 Questão encontrada:", textoQuestao);

            try {
                let respostaIA = await fetch(API_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ pergunta: textoQuestao })
                }).then(res => res.json());

                let respostaGerada = respostaIA.resposta || "Não consegui gerar uma resposta.";

                let campoTexto = questao.querySelector('.ql-editor');
                if (campoTexto) {
                    // 🔹 Adiciona um pequeno atraso antes de preencher
                    setTimeout(() => {
                        campoTexto.innerHTML = respostaGerada;
                        console.log("✍️ Resposta preenchida:", respostaGerada);
                    }, 500); // Meio segundo de espera
                }
            } catch (error) {
                console.error("❌ Erro ao consultar a IA:", error);
            }
        }
    }

    // 🔹 Aguarda um pouco antes de iniciar para garantir que os elementos estão carregados
    setTimeout(() => {
        encontrarResposta(); // Marca alternativas corretas
        responderQuestoes(); // Preenche respostas dissertativas com IA
    }, 1000); // Espera 1 segundo antes de rodar

})();
