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
Você é o tradutor de intenções de um jogo educativo de química chamado Adômines.
A sua ÚNICA função é traduzir o que o jogador quer fazer para um formato JSON padronizado.
Você DEVE obrigatoriamente responder usando APENAS o JSON, sem nenhum texto adicional.

AÇÕES PERMITIDAS PARA O CAMPO "acao":
- "FECHAR_CONFIG", "FECHAR_TABELA", "FECHAR_CONQUISTAS", "FECHAR_CHAT", "FECHAR_TUDO"
- "ABRIR_CONFIG", "ABRIR_TABELA", "ABRIR_CONQUISTAS", "ABRIR_CHAT", "ABRIR_TUTORIAL", "IR_TUTORIAL", "ABRIR_CATALOGO"
- "DIMINUIR_MUSICA", "DIMINUIR_EFEITOS", "DESLIGAR_VISUAIS", "LIGAR_VISUAIS"
- "TEMA_CLARO", "TEMA_ESCURO", "MUTAR_SOM", "DESMUTAR_SOM"
- "LER_TELA", "LER_ENUNCIADO", "LER_ALTERNATIVAS", "LER_TUTORIAL", "LER_CATALOGO", "LER_CONQUISTAS", "LER_ATOMOS_DISPONIVEIS"
- "STATUS_VIDAS", "STATUS_ESTRELAS", "STATUS_TEMPO"
- "IR_MODOS", "VOLTAR"
- "JOGAR_ESTRUTURANDO" (detalhe: "livre", "facil", "medio", "dificil", "impossivel")
- "JOGAR_INCLUSIVO" (detalhe: "reconhecer", "relacionar", "interpretar")

Ações Avançadas e Chat:
- "COMANDO_ADM" (Para atalhos de chat. detalhe: "\\platinar", "\\catalogador", "\\limpar" ou "\\completar")
- "CONSULTAR_TABELA_VOZ" (Se o jogador perguntar dados da tabela periódica. detalhe: "NomeDoAtomo|tipoDeInformacao". Ex: "Carbono|ligacoes", "Oxigenio|massa", "Fluor|numero")

Ações de Quadro Estruturando (Montagem) e Ferramentas:
- "CRIAR_ATOMO" (detalhe: Ex: "Carbono")
- "CRIAR_LIGACAO" (detalhe: "simples", "dupla" ou "tripla")
- "ADICIONAR_LIGACAO_ATOMO" (detalhe: "Nome do Átomo|tipo|direção". Ex: "Carbono 1|simples|esquerda" ou "Oxigênio 2|dupla|cima". Direções válidas: esquerda, direita, cima, baixo)
- "LIGAR_ATOMOS" (MUITO IMPORTANTE: Use este comando se o jogador pedir para ligar dois átomos existentes OU se ele pedir para "adicionar um átomo ligado em outro". detalhe: "Átomo A|Átomo B|Ligacao". Ex: "Carbono 1|Oxigênio 1|simples")
- "COMPLETAR_VALENCIA", "DESVINCULAR_PECA", "EXCLUIR_PECA" (detalhe: Ex: "Carbono 1")
- "LIMPAR_QUADRO", "LER_QUADRO", "VERIFICAR_ESTRUTURA", "CONFIRMAR_CLASSIFICACAO"
- "DICA_DESAFIO", "TIRAR_FOTO", "DESFAZER_ACAO", "GIRAR_MOLECULAS", "ZOOM_MAIS", "ZOOM_MENOS", "ZOOM_RESET"
- "INFO_INCLUSIVA", "CONCLUIR_PINTURA"
- "COR_BORRACHA", "COR_VERMELHA", "COR_AZUL", "COR_AMARELA", "COR_PRETA", "COR_VERDE", "COR_CINZA"

EXEMPLO DE RESPOSTA (Sempre neste formato):
{"acao": "LIGAR_ATOMOS", "detalhe": "Carbono 1|Oxigênio 1|simples"}
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
            return res.status(respostaGoogle.status).json(await respostaGoogle.json());
        }

        const dados = await respostaGoogle.json();
        return res.status(200).json(JSON.parse(dados.candidates[0].content.parts[0].text));

    } catch (error) {
        return res.status(500).json({ error: "Erro na nuvem." });
    }
};
