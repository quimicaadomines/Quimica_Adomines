module.exports = async function (req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const { fraseJogador } = req.body;
    const API_KEY = process.env.CHAVE_DA_ASSISTENTE;

    if (!API_KEY) {
        return res.status(500).json({ error: 'Chave da Assistente não configurada.' });
    }

    const instrucaoSistema = `
Você é o tradutor de intenções de um jogo educativo de química.
A sua ÚNICA função é traduzir o que o jogador quer fazer para um formato JSON padronizado.
Você DEVE obrigatoriamente responder usando APENAS o JSON.

AÇÕES PERMITIDAS PARA O CAMPO "acao":
- "DIMINUIR_MUSICA", "DIMINUIR_EFEITOS"
- "DESLIGAR_VISUAIS", "LIGAR_VISUAIS"
- "TEMA_CLARO", "TEMA_ESCURO"
- "MUTAR_SOM" (Se ele disser mutar, tirar som, sem som)
- "DESMUTAR_SOM" (Se ele disser colocar som, voltar som, desmutar, ligar som)
- "IR_MODOS", "IR_TUTORIAL", "VOLTAR"
- "ABRIR_TABELA", "ABRIR_CONFIG", "ABRIR_CONQUISTAS", "ABRIR_CHAT", "ABRIR_ADM"
- "LER_TELA", "LER_ENUNCIADO", "LER_ALTERNATIVAS", "LER_TUTORIAL"
- "STATUS_TROFEUS", "STATUS_CONQUISTAS", "STATUS_CATALOGO", "STATUS_VIDAS", "STATUS_ESTRELAS", "STATUS_TEMPO"
- "JOGAR_ESTRUTURANDO" (detalhe: "livre", "facil", "medio", "dificil", "impossivel", ou "perguntar")
- "JOGAR_INCLUSIVO" (detalhe: "reconhecer", "relacionar", "interpretar", ou "perguntar")

NOVAS AÇÕES (Acessibilidade do Quadro):
- "CRIAR_ATOMO" (detalhe: nome do átomo. Ex: "Carbono")
- "CRIAR_LIGACAO" (detalhe: "simples", "dupla" ou "tripla")
- "LIGAR_ATOMOS" (detalhe: "Átomo A|Átomo B|Ligacao". Ex: "Carbono 1|Oxigênio 1|dupla")
- "COMPLETAR_VALENCIA", "DESVINCULAR_PECA", "EXCLUIR_PECA" (detalhe: Ex: "Carbono 1")
- "LIMPAR_QUADRO", "LER_QUADRO"
- "VERIFICAR_ESTRUTURA" (Se ele disser checar molécula, terminei, verificar)
- "CONFIRMAR_CLASSIFICACAO"

EXEMPLO DE RESPOSTA (Sempre neste formato):
{"acao": "DESMUTAR_SOM", "detalhe": ""}
    `;

    try {
        const respostaGoogle = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: instrucaoSistema }] },
                contents:[{ parts:[{ text: `O JOGADOR FALOU: "${fraseJogador}"` }] }],
                generationConfig: { responseMimeType: "application/json" } 
            })
        });

        if (!respostaGoogle.ok) {
            const erroDetalhado = await respostaGoogle.json();
            return res.status(respostaGoogle.status).json(erroDetalhado);
        }

        const dados = await respostaGoogle.json();
        const textoResposta = dados.candidates[0].content.parts[0].text;
        const intencaoJSON = JSON.parse(textoResposta);
        
        return res.status(200).json(intencaoJSON);

    } catch (error) {
        console.error("Erro no classificador da Assistente:", error);
        return res.status(500).json({ error: "Erro ao interpretar o comando na nuvem." });
    }
};
