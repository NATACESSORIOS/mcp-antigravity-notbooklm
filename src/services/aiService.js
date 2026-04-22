const fs = require('fs');
const path = require('path');

/**
 * Retorna o conteúdo de um arquivo da pasta .context
 * @param {string} relativePath Caminho relativo a partir de .context (ex: 'agents/main_agent.md')
 * @returns {string} O conteúdo do arquivo markdown ou string vazia se falhar
 */
function getSystemContext(relativePath) {
    try {
        const fullPath = path.join(process.cwd(), '.context', relativePath);
        if (fs.existsSync(fullPath)) {
            return fs.readFileSync(fullPath, 'utf8');
        }
        return `[Aviso: Arquivo de contexto não encontrado: ${relativePath}]`;
    } catch (error) {
        console.error(`Erro ao carregar contexto de ${relativePath}:`, error);
        return '';
    }
}

/**
 * Constrói o System Prompt completo injetando os contextos CDD
 * @returns {string} System prompt compilado
 */
function buildSystemPrompt() {
    const agentContext = getSystemContext('agents/main_agent.md');
    const businessRulesContext = getSystemContext('docs/business_rules.md');
    
    return `
# CONTEXTO DO AGENTE
${agentContext}

# REGRAS DE NEGÓCIO
${businessRulesContext}

---
Por favor, aja de acordo com as regras imutáveis de negócio e com sua persona descrita acima.
`;
}

/**
 * Exemplo de função de envio de mensagem para o serviço LLM (Bridge).
 * Modifique isso para integrar com o SDK de preferência (ex: @google/genai).
 * 
 * @param {string} userInstruction A mensagem ou instrução do usuário
 * @returns {Promise<any>} Objeto simulado de resposta do modelo
 */
async function sendToLLM(userInstruction) {
    const systemPrompt = buildSystemPrompt();
    
    // Injeção de Prompt final: [CONTEXTO DO ARQUIVO .MD] + [INSTRUÇÃO DO USUÁRIO]
    const finalPrompt = `
[SYSTEM PROMPT]
${systemPrompt}

[USER INSTRUCTION]
${userInstruction}
`;

    // TODO: Inserir a integração real da API do Gemini, OpenAI ou NotebookLM aqui.
    // Exemplo: const response = await geminiModel.generateContent(finalPrompt);

    console.log("=== INJEÇÃO DE CONTEXTO REALIZADA COM SUCESSO ===");
    console.log("Prompt Resultante:\n", finalPrompt);

    return { success: true, message: "Prompt injetado e pronto para a chamada da LLM" };
}

module.exports = {
    getSystemContext,
    buildSystemPrompt,
    sendToLLM
};
