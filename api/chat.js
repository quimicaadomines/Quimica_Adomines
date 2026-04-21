// Este código roda escondido no servidor da Vercel. Ninguém tem acesso a ele.
module.exports = async function (req, res) {
    // 1. Só aceita requisições POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    // 2. Pega a pergunta enviada pelo front-end (global.js)
    const { pergunta } = req.body;
    
    // 3. Puxa a chave de API do "cofre" da Vercel (Variáveis de Ambiente)
    const API_KEY = process.env.GEMINI_API_KEY;

    // Se a chave não existir lá na Vercel, avisa o erro
    if (!API_KEY) {
        return res.status(500).json({ error: 'Chave da API não configurada no servidor.' });
    }

    // 4. Regra de comportamento da IA (O Prompt)
    let promptCompleto = "REGRA: Você é a Adômines, assistente de química de um jogo. Responda APENAS perguntas sobre química de forma simples, direta e para jovens estudantes. Se a pergunta NÃO for sobre química, responda EXATAMENTE: 'Desculpe, eu só posso responder a perguntas relacionadas à química.'\n\nPERGUNTA DO JOGADOR: " + pergunta;

    try {
        // 5. O servidor da Vercel faz a requisição pro Google (MODELO ATUALIZADO AQUI)
        const respostaGoogle = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptCompleto }] }]
            })
        });

        // Se o Google reclamar de algo, devolvemos o erro exato
        if (!respostaGoogle.ok) {
            const erroDetalhado = await respostaGoogle.json();
            return res.status(respostaGoogle.status).json(erroDetalhado);
        }

        const dados = await respostaGoogle.json();
        
        // 6. Devolve a resposta pronta pro seu Front-end
        return res.status(200).json(dados);

    } catch (error) {
        console.error("Erro no servidor da Vercel:", error);
        return res.status(500).json({ error: "Erro de conexão com o laboratório do Google." });
    }
};
