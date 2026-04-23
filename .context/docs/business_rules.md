# Regras de Negócio — NUNCA QUEBRE ESTAS REGRAS

> Estas regras são absolutas. Não há exceções. Se uma situação parecer exigir quebrar uma regra, PARE e pergunte ao usuário.

**Atualizado em:** 2026-04-23 — Adicionadas Regras 8 e 9 sobre classificação de fontes.

---

## REGRA 1 — Extração local obrigatória
**O quê:** Todo PDF deve ser convertido em .txt antes de ir para o NotebookLM.
**Como:** Rodando `npm run processar` no terminal do projeto.
**Por quê:** O NotebookLM tem problemas com PDFs protegidos ou com formatação complexa.
**Erro proibido:** Nunca envie um .pdf diretamente para o NotebookLM. Sempre use o .txt extraído.

---

## REGRA 2 — Documentos efêmeros (limpeza obrigatória)
**O quê:** Após cada análise, o documento enviado ao NotebookLM DEVE ser deletado.
**Como:** Usando a ferramenta MCP `source_delete` com o `source_id` retornado pelo upload.
**Por quê:** Evita poluir o caderno com processos avulsos que não fazem parte da base permanente.
**Erro proibido:** Nunca termine uma análise sem executar o `source_delete`.

---

## REGRA 3 — Mapa de cadernos é a fonte da verdade
**O quê:** O arquivo `notebooks_map.json` define qual pasta do Drive corresponde a qual caderno.
**Como:** Sempre leia o `fila_pendente.json` gerado pelo script — ele já tem o `notebookId` correto.
**Por quê:** Evita analisar um processo no caderno errado.
**Erro proibido:** Nunca use um ID de caderno que não veio do `fila_pendente.json` ou do `notebooks_map.json`.

---

## REGRA 4 — Nunca deletar PDFs originais
**O quê:** O PDF original nunca deve ser apagado.
**Como:** Após o processamento, mova o PDF para a subpasta `_processados/` dentro da mesma pasta.
**Por quê:** O usuário pode precisar do arquivo original para consulta futura.
**Erro proibido:** Nunca use comandos de exclusão (delete, rm, unlink) em arquivos .pdf.

---

## REGRA 5 — Resultado sempre na pasta de origem
**O quê:** O arquivo de análise gerado deve ser salvo na mesma pasta do Drive de onde veio o PDF.
**Como:** Se o PDF veio de `039 - Análise para expedição de alvarás\`, salve o .md lá também.
**Por quê:** Mantém a organização e permite encontrar o resultado facilmente.
**Erro proibido:** Nunca salve resultados em uma pasta diferente da de origem.

---

## REGRA 6 — Um caderno por processo
**O quê:** Cada PDF é analisado exclusivamente no caderno da pasta onde foi depositado.
**Como:** O script `processar_fila.js` já garante isso automaticamente.
**Por quê:** Cada caderno tem um contexto específico (ex: homologação, alvará, IDPJ). Misturar contamina a análise.
**Erro proibido:** Nunca analise um processo de uma pasta em um caderno diferente do mapeado.

---

## REGRA 7 — Regra de Ouro CDD (Context Drift)
**O quê:** Toda mudança no código ou no fluxo deve ser documentada nos arquivos `.context/`.
**Como:** Ao alterar um script, atualize `architecture.md`. Ao mudar uma regra, atualize este arquivo.
**Por quê:** O agente (Gemini Flash) tem memória curta. Sem documentação atualizada, ele vai errar nas próximas sessões.
**Erro proibido:** Nunca finalize uma sessão com mudanças no código sem atualizar os arquivos `.context/` correspondentes.

---

---

## REGRA 8 — Nunca usar source de outro processo como contexto
**O quê:** Ao analisar um processo, o `source_ids` da query deve conter APENAS o ID do processo recém-enviado + os IDs de fontes permanentes (`fonte_source_ids`).
**Como:** O campo `fonteSourceIds` no `fila_pendente.json` já traz os IDs corretos de cada caderno.
**Por quê:** Se o caderno tiver outro processo acidentalmente, ele seria usado como contexto e contaminaria a análise com dados de outro caso.
**Erro proibido:** Nunca faça `notebook_query` sem o parâmetro `source_ids`. Nunca inclua IDs que não venham do `fila_pendente.json`.

---

## REGRA 9 — Fontes são permanentes, processos são efêmeros
**O quê:** Arquivos com a palavra **"fonte"** no nome são referências permanentes do caderno. Arquivos com número de processo são efêmeros.
**Como distinguir:**
- Nome contém `fonte` → tipo FONTE → upload + salvar ID em `notebooks_map.json` → NUNCA deletar
- Nome contém número de processo (ex: `0001631-51.2012.5.03.0033`) → tipo PROCESSO → upload + análise → deletar
**Por quê:** As fontes contêm contexto jurídico permanente (jurisprudência, modelos, instruções) que enriquecem todas as análises daquele caderno.
**Erro proibido:** Nunca execute `source_delete` em um source de fonte. Nunca mova um PDF de fonte para `_processados/`.

---

## Contrato de Responsabilidades

| Tarefa | Quem executa | Ferramenta |
|---|---|---|
| Varrer pastas e detectar PDFs novos | Antigravity | `npm run processar` (terminal) |
| Extrair texto do PDF | Antigravity | `scripts/extract_pdf.js` (via npm run processar) |
| Fazer upload do .txt ao caderno | Antigravity | MCP: `notebook_add_local_file` |
| Analisar o documento com contexto do caderno | **NotebookLM** | MCP: `notebook_query` |
| Salvar resultado na pasta do Drive | Antigravity | Escrita de arquivo local |
| Deletar o source efêmero | Antigravity | MCP: `source_delete` |
| Mover PDF para _processados/ | Script automático | `scripts/processar_fila.js` |
