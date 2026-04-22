# Plano de Implementação Atual

## Fila de Planos (To-Do List)
- [x] Criar estrutura `.context` com CDD (Context-Driven Development).
- [x] Criar arquivo `CLAUDE.md` na raiz orientando a IA a verificar o contexto.
- [x] Implementar `src/services/aiService.js` (bridge de injeção de contexto).
- [x] Criar `notebooks_map.json` com mapeamento de 79 pastas → IDs de cadernos.
- [x] Criar `scripts/processar_fila.js` — varredura de PDFs e extração de texto.
- [x] Criar pastas espelhadas no Google Drive para cada caderno.

## Estratégia Operacional Vigente
O usuário acumula PDFs nas pastas do Google Drive correspondentes ao caderno desejado.
Quando quiser analisar (ex: a cada 10 processos), diz ao Antigravity: **"Processar fila"**.

O Antigravity então:
1. Roda `npm run processar` → gera `fila_pendente.json` com os .txt extraídos.
2. Lê o `fila_pendente.json`.
3. Para cada item: sobe o .txt ao caderno correto via MCP `notebook_add_local_file`.
4. Executa `notebook_query` com o prompt de análise padrão do caderno.
5. Salva `NomeDoProcesso_Analise.md` na pasta do Drive.
6. Deleta o source efêmero do NotebookLM (limpeza).

## Próximos Passos Opcionais
- [ ] Adicionar notificação por email ao final da fila (SMTP via nodemailer).
- [ ] Criar prompt padrão de análise por tipo de caderno (ex: 037 usa prompt de arquivamento).
