module.exports = async function (req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const { fraseJogador } = req.body;
    
    // Agora usamos a chave específica que você criou pra assistente!
    const API_KEY = process.env.CHAVE_DA_ASSISTENTE;

    if (!API_KEY) {
        return res.status(500).json({ error: 'Chave da Assistente não configurada.' });
    }

    // ==========================================
    // O "CARDÁPIO" (CÉREBRO DA IA)
    // ==========================================
    const instrucaoSistema = `
Você é o motor de reconhecimento de intenção de um jogo educativo de química.
A sua ÚNICA função é ler o que o jogador falou e classificar a ação no formato JSON.
NÃO RESPONDA COMO UM HUMANO. Responda APENAS com um objeto JSON.

LISTA DE AÇÕES PERMITIDAS:
- "DIMINUIR_MUSICA", "DIMINUIR_EFEITOS"
- "DESLIGAR_VISUAIS", "LIGAR_VISUAIS"
- "TEMA_CLARO", "TEMA_ESCURO"
- "MUTAR_SOM", "DESMUTAR_SOM"
- "IR_MODOS", "IR_TUTORIAL", "VOLTAR"
- "ABRIR_TABELA", "ABRIR_CONFIG", "ABRIR_CONQUISTAS", "ABRIR_CHAT", "ABRIR_ADM"
- "LER_TELA", "LER_ENUNCIADO", "LER_ALTERNATIVAS", "LER_TUTORIAL"
- "DESLIGAR_ASSISTENTE"
- "STATUS_TROFEUS", "STATUS_CONQUISTAS", "STATUS_CATALOGO"
- "INFO_ATOMOS", "INFO_LIGACOES", "INFO_FERRAMENTAS"
- "JOGAR_ESTRUTURANDO"
- "JOGAR_INCLUSIVO"
- "COMANDO_ADM"
- "DESCONHECIDO"

REGRAS ESPECIAIS (O campo "detalhe"):
1. Se for JOGAR_ESTRUTURANDO, o "detalhe" deve ser: "livre", "facil", "medio", "dificil", "impossivel". Se o jogador não falar qual quer, o detalhe deve ser "perguntar".
2. Se for JOGAR_INCLUSIVO, o "detalhe" deve ser: "reconhecer", "relacionar", "interpretar". Se não falar, o detalhe deve ser "perguntar".
3. Se for STATUS_CONQUISTAS ou STATUS_CATALOGO, o "detalhe" deve ser "ganhas", "faltam" ou "todas".
4. Se for COMANDO_ADM, o "detalhe" deve ser o comando exato falado (ex: "\\platinar").

EXEMPLO DE RESPOSTA OBRIGATÓRIA:
{"acao": "JOGAR_ESTRUTURANDO", "detalhe": "facil"}
{"acao": "DIMINUIR_MUSICA", "detalhe": ""}
    `;

    try {
        const respostaGoogle = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: instrucaoSistema }] },
                contents:[{ parts: [{ text: `O JOGADOR FALOU: "${fraseJogador}"` }] }],
                // Força o Google a responder sempre em JSON, sem gracinhas.
                generationConfig: { responseMimeType: "application/json" } 
            })
        });

        if (!respostaGoogle.ok) {
            const erroDetalhado = await respostaGoogle.json();
            return res.status(respostaGoogle.status).json(erroDetalhado);
        }

        const dados = await respostaGoogle.json();
        
        // Extrai o JSON gerado pela IA
        const textoResposta = dados.candidates[0].content.parts[0].text;
        const intencaoJSON = JSON.parse(textoResposta);
        
        // Devolve o JSON bonitinho pro front-end do jogo
        return res.status(200).json(intencaoJSON);

    } catch (error) {
        console.error("Erro no classificador da Assistente:", error);
        return res.status(500).json({ error: "Erro ao interpretar o comando." });
    }
};
