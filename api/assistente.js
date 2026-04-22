module.exports = async function (req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const { fraseJogador } = req.body;
    const API_KEY = process.env.CHAVE_DA_ASSISTENTE;

    if (!API_KEY) {
        return res.status(500).json({ error: 'Chave da Assistente não configurada.' });
    }

    // ==========================================
    // O NOVO CÉREBRO CONSTRUTOR DA IA
    // ==========================================
    const instrucaoSistema = `
Você é o motor de reconhecimento de intenção de um jogo educativo de química.
NÃO RESPONDA COMO UM HUMANO. Responda APENAS com um objeto JSON.

LISTA DE AÇÕES PERMITIDAS:
- "DIMINUIR_MUSICA", "DIMINUIR_EFEITOS"
- "DESLIGAR_VISUAIS", "LIGAR_VISUAIS"
- "TEMA_CLARO", "TEMA_ESCURO", "MUTAR_SOM", "DESMUTAR_SOM"
- "IR_MODOS", "IR_TUTORIAL", "VOLTAR"
- "ABRIR_TABELA", "ABRIR_CONFIG", "ABRIR_CONQUISTAS", "ABRIR_CHAT", "ABRIR_ADM"
- "LER_TELA", "LER_ENUNCIADO", "LER_ALTERNATIVAS", "LER_TUTORIAL"
- "DESLIGAR_ASSISTENTE"
- "STATUS_TROFEUS", "STATUS_CONQUISTAS", "STATUS_CATALOGO"
- "STATUS_VIDAS", "STATUS_ESTRELAS"
- "JOGAR_ESTRUTURANDO", "JOGAR_INCLUSIVO"

>>> NOVAS AÇÕES DE MONTAGEM (ACESSIBILIDADE) <<<
- "CRIAR_ATOMO" (Detalhe: o nome do átomo pedido. Ex: "Carbono")
- "LIGAR_ATOMOS" (Detalhe DEVE TER O FORMATO: "Átomo A|Átomo B|TipoDaLigacao". Ex: "Carbono 1|Oxigênio 1|dupla". Se o jogador não falar o tipo de ligação, assuma "simples".)
- "COMPLETAR_VALENCIA" (Detalhe: "Atomo e Número". Ex: "Carbono 1")
- "DESVINCULAR_PECA" (Detalhe: "Atomo e Número". Ex: "Carbono 2")
- "EXCLUIR_PECA" (Detalhe: "Atomo e Número". Ex: "Oxigênio 1")
- "LIMPAR_QUADRO" (Se ele quiser apagar tudo)
- "LER_QUADRO" (Se o jogador perguntar o que tem na tela/quadro)

REGRAS ESPECIAIS (O campo "detalhe"):
1. JOGAR_ESTRUTURANDO: "livre", "facil", "medio", "dificil", "impossivel". Faltou? "perguntar".
2. JOGAR_INCLUSIVO: "reconhecer", "relacionar", "interpretar". Faltou? "perguntar".
3. STATUS_CONQUISTAS: "ganhas", "faltam" ou "todas".
4. STATUS_VIDAS / ESTRELAS: Para checar contagem.
5. Se for de incentivo genérico ("bora", "iniciar", "start"), devolva "IR_MODOS".

EXEMPLOS DE RESPOSTA OBRIGATÓRIA:
{"acao": "CRIAR_ATOMO", "detalhe": "Carbono"}
{"acao": "LIGAR_ATOMOS", "detalhe": "Carbono 1|Carbono 2|dupla"}
{"acao": "COMPLETAR_VALENCIA", "detalhe": "Carbono 1"}
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
        return res.status(500).json({ error: "Erro ao interpretar o comando." });
    }
};
