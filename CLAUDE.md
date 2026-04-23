# INSTRUÇÕES PARA O AGENTE DE IA — LEIA ANTES DE QUALQUER AÇÃO

> Este projeto usa o padrão CDD (Context-Driven Development).
> Você é um agente com memória limitada. Siga estas instruções EXATAMENTE como estão escritas.

---

## PASSO 1 — SEMPRE FAÇA ISSO PRIMEIRO

Antes de qualquer ação, leia estes arquivos nesta ordem:

1. `.context/agents/main_agent.md` → Seu papel e o que você pode/não pode fazer
2. `.context/docs/business_rules.md` → Regras que você NUNCA pode quebrar
3. `.context/docs/architecture.md` → Como o sistema funciona
4. `.context/plans/active.md` → O que está sendo feito agora

---

## PASSO 2 — IDENTIFICAÇÃO DOS TIPOS DE ARQUIVO (CRÍTICO)

O script classifica cada PDF da pasta em um dos dois tipos abaixo.
**Você DEVE tratar cada tipo de forma diferente.**

### TIPO 1 — PROCESSO (status: `PENDENTE_MCP`)
- **Como identificar:** O nome do arquivo contém um número de processo trabalhista (ex: `0001631-51.2012.5.03.0033`)
- **Como tratar:** Upload → Análise → Deletar source (efêmero)
- **O PDF:** Já foi movido para `_processados/` pelo script

### TIPO 2 — FONTE (status: `REGISTRAR_FONTE`)
- **Como identificar:** O nome do arquivo contém a palavra **"fonte"** (ex: `fonte_jurisprudencia.pdf`, `contexto_fonte.pdf`)
- **Como tratar:** Upload → Salvar source_id no `notebooks_map.json` → NUNCA deletar (permanente)
- **O PDF:** Permanece na pasta original (NÃO é movido para `_processados/`)
- **Para que serve:** É uma referência permanente que o caderno usa como contexto base para analisar processos

---

## PASSO 3 — GATILHO: "Processar fila"

Execute EXATAMENTE nesta ordem, SEM PULAR ETAPAS:

### ETAPA 1 — Rodar o scanner
```
Comando: npm run processar
Diretório: c:\Users\gilbe\.gemini\antigravity\scratch\MCP NotebookLM
```

### ETAPA 2 — Ler a fila gerada
```
Abra: fila_pendente.json
Verifique: quantos itens do tipo PROCESSO e quantos do tipo FONTE
```

### ETAPA 3A — Para cada item com status "REGISTRAR_FONTE"

Faça EM ORDEM:
```
a) Use a ferramenta MCP: notebook_add_drive
   - notebook_id = o campo "notebookId" do item
   - document_id = o campo "driveFileId" do item  ← ID real do Google Drive
   - title       = o campo "pdfNome" do item
   - doc_type    = "pdf"
   ✅ NotebookLM lê o PDF diretamente do Drive com OCR completo (PDFs escaneados incluídos)

b) Guarde o source_id retornado (ex: "abc123-...")

c) Abra o arquivo: notebooks_map.json

d) Encontre o notebook cujo "id" = "notebookId" do item

e) Adicione o source_id ao array "fonte_source_ids" deste notebook
   - Se não existir: "fonte_source_ids": ["abc123-..."]
   - Se já existir: adicione ao array

f) Salve o notebooks_map.json

g) ⚠️ NÃO execute source_delete. A fonte é permanente.

h) ⚠️ NÃO mova o PDF para _processados. Deixe na pasta original.
```

### ETAPA 3B — Para cada item com status "PENDENTE_MCP"

> ⚠️ **AVISO IMPORTANTE antes de executar:** O `source_ids` da MCP query filtra a resposta da IA, mas NÃO remove do caderno outros arquivos que já estejam lá. Se o caderno tiver outro processo permanente (não-fonte), a interface web do NotebookLM vai mostrá-lo como fonte selecionada mesmo assim. Para garantir isolamento total, cadernos de análise devem conter SOMENTE fontes com a palavra "fonte" no nome. Qualquer outro arquivo de processo que esteja permanentemente no caderno deve ser removido manualmente pelo usuário na interface do NotebookLM antes de usar.

Faça EM ORDEM:
```
a) Leia o campo "fonteSourceIds" do item no fila_pendente.json

b) Use a ferramenta MCP: notebook_add_drive
   - notebook_id = o campo "notebookId" do item
   - document_id = o campo "driveFileId" do item  ← ID real do Google Drive
   - title       = o campo "pdfNome" do item
   - doc_type    = "pdf"
   ✅ NotebookLM usa OCR interno. Funciona com PDFs escaneados e digitais.
   Guarde o source_id retornado (ex: "xyz789-...")

c) Use a ferramenta MCP: notebook_query
   - notebook_id = o mesmo "notebookId"
   - query       = "Faça uma análise jurídica completa e detalhada deste documento..."
   - source_ids  = [source_id_do_passo_b] + [todos os IDs de "fonteSourceIds"]
   ⚠️ IMPORTANTE: O source_ids DEVE conter o ID do processo recém-enviado
   E os IDs das fontes permanentes. Não inclua outros IDs.

d) Salve o resultado como arquivo .md na MESMA PASTA do Drive
   - Nome: mesmo nome do .txt, mas com sufixo "_Analise.md"
   - Exemplo: Processo_001.txt → Processo_001_Analise.md
   - Pasta: a pasta de origem do processo no Drive

e) Use a ferramenta MCP: source_delete
   - source_id = o source_id do passo b (SOMENTE o do processo)
   - confirm    = true
   ⚠️ NUNCA delete os IDs de fonteSourceIds. Apenas o ID do processo.
```

### ETAPA 4 — Resumo final
```
Informe: "Processados X processos e Y fontes registradas."
Liste os resultados salvos e qualquer erro ocorrido.
```

---

## GATILHO: "Mapear cadernos"

```
ETAPA 1: Use a ferramenta MCP: notebook_list
ETAPA 2: Abra o arquivo: notebooks_map.json
ETAPA 3: Compare a lista do MCP com o arquivo
ETAPA 4: Adicione cadernos novos que não estão no arquivo
ETAPA 5: Salve o arquivo atualizado
ETAPA 6: Informe quais cadernos foram adicionados
```

---

## GATILHO: "Atualizar engenharia de contexto"

```
ETAPA 1: Pergunte ao usuário o que mudou no projeto (se não estiver claro)
ETAPA 2: Atualize APENAS os arquivos .context/ que precisam de mudança
ETAPA 3: Faça commit e push com mensagem descritiva
ETAPA 4: Informe quais arquivos foram atualizados
```

---

## REGRAS ABSOLUTAS (NUNCA QUEBRE)

1. NUNCA delete um PDF. Processos vão para `_processados/`. Fontes ficam na pasta original.
2. NUNCA analise um processo com source_ids de outro processo. Use SOMENTE o ID do processo atual + fonteSourceIds.
3. SEMPRE delete o source do processo após a análise (source_delete). NUNCA delete fontes.
4. NUNCA modifique `notebooks_map.json` ou `mcp_config.json` sem confirmar com o usuário (exceto para adicionar fonte_source_ids, que é automático).
5. SEMPRE salve o resultado `.md` na mesma pasta do Drive de onde veio o PDF.

---

## SE ALGO DER ERRADO

- Se `fila_pendente.json` estiver vazio → informe: "Nenhum PDF novo encontrado nas pastas."
- Se `notebook_add_local_file` falhar → pule esse item, anote o erro e continue
- Se `notebook_query` não retornar nada → salve o .md com a mensagem "Análise indisponível"
- Se não souber o que fazer → PERGUNTE ao usuário. Não adivinhe.
