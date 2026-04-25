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
- "STATUS_TROFEUS", "STATUS_CONQUISTAS", "STATUS_CATALOGO", "STATUS_VIDAS", "STATUS_ESTRELAS"
- "STATUS_TEMPO" (Se o jogador perguntar quanto tempo falta)
- "JOGAR_ESTRUTURANDO", "JOGAR_INCLUSIVO"

>>> NOVAS AÇÕES DE MONTAGEM E DESAFIOS <<<
- "CRIAR_ATOMO" (Detalhe: o nome do átomo. Ex: "Carbono")
- "LIGAR_ATOMOS" (Detalhe: "Átomo A|Átomo B|Ligacao". Ex: "Carbono 1|Oxigênio 1|dupla")
- "COMPLETAR_VALENCIA", "DESVINCULAR_PECA", "EXCLUIR_PECA" (Detalhe: "Carbono 1")
- "LIMPAR_QUADRO", "LER_QUADRO"
- "VERIFICAR_ESTRUTURA" (Se ele disser "Verifique a molécula", "Terminei a fase", "Pode checar")
- "MARCAR_CLASSIFICACAO" (Detalhe: "Aberta", "Fechada", "Normal", "Ramificada", "Saturada", "Insaturada", "Homogênea" ou "Heterogênea")
- "CONFIRMAR_CLASSIFICACAO" (Se ele disser "Finalizar", "Confirmar respostas", "Terminei o questionário")

REGRAS ESPECIAIS:
1. Se a frase for de incentivo genérico para jogar ("bora", "iniciar", "start"), classifique como "IR_MODOS".
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
