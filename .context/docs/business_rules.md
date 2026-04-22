# Regras de Negócio Imutáveis

## Regras da Esteira de Análise

1. **Extração Local Obrigatória**: Todo PDF deve ser extraído localmente via `scripts/extract_pdf.js` (pdf-parse) antes de ser enviado ao NotebookLM. Não enviar PDFs diretamente — apenas o `.txt` extraído.

2. **Documentos Efêmeros**: Após o upload de um `.txt` ao NotebookLM e a conclusão da análise, o source criado DEVE ser deletado com `source_delete`. O NotebookLM é usado como motor de análise, não como arquivo permanente de processos avulsos.

3. **Mapa de Cadernos é a Fonte da Verdade**: O arquivo `notebooks_map.json` é a única referência válida para o mapeamento pasta → ID de caderno. Qualquer alteração de nome de pasta ou novo caderno deve ser atualizada neste arquivo.

4. **Pasta `_processados/`**: Após o processamento, o PDF original deve ser movido para `_processados/` dentro da mesma pasta. Nunca deletar o PDF original.

5. **Resultado na Pasta de Origem**: O arquivo de análise gerado (`NomeArquivo_Analise.md`) deve ser salvo **na mesma pasta do Drive** de onde veio o PDF, nunca em outro local.

6. **Caderno Certo para Cada Processo**: Cada PDF deve ser analisado **exclusivamente** no caderno que corresponde à pasta onde foi depositado. Não cruzar processos entre cadernos.

7. **Regra de Ouro CDD**: Nenhuma mudança no código, scripts, banco de dados ou estrutura do projeto pode ser finalizada sem a respectiva atualização dos documentos em `.context/`. A IA deve documentar e codificar simultaneamente.

## Contrato de Orquestração (Antigravity vs NotebookLM)

| Tarefa | Responsável |
|---|---|
| Varrer pastas e detectar PDFs novos | Antigravity (script) |
| Extrair texto do PDF | Antigravity (pdf-parse) |
| Fazer upload do .txt ao caderno | Antigravity (MCP) |
| Analisar o documento com contexto do caderno | NotebookLM |
| Salvar o resultado na pasta do Drive | Antigravity |
| Deletar o source efêmero | Antigravity (MCP) |
| Mover PDF para _processados/ | Antigravity (script) |
