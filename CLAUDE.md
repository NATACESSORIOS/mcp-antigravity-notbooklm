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

## PASSO 2 — IDENTIFIQUE O GATILHO DO USUÁRIO

O usuário vai usar uma destas frases. Execute EXATAMENTE o que está descrito:

### Gatilho: "Processar fila"

Execute nesta ordem, SEM PULAR ETAPAS:

```
ETAPA 1: Rode o comando abaixo no terminal
   npm run processar
   (diretório: c:\Users\gilbe\.gemini\antigravity\scratch\MCP NotebookLM)

ETAPA 2: Leia o arquivo gerado
   Abra: fila_pendente.json
   Cada item tem: caderno, notebookId, txtParaUpload, status

ETAPA 3: Para CADA item com status "PENDENTE_MCP", faça:
   a) Use a ferramenta MCP: notebook_add_local_file
      - notebook_id = o campo "notebookId" do item
      - path = o campo "txtParaUpload" do item
   b) Aguarde a confirmação de upload
   c) Use a ferramenta MCP: notebook_query
      - notebook_id = o mesmo "notebookId"
      - query = "Faça uma análise completa deste documento jurídico"
   d) Salve o resultado como arquivo .md na mesma pasta do Drive
      - Nome: mesmo nome do .txt, mas com sufixo "_Analise.md"
      - Exemplo: processo_001.txt → processo_001_Analise.md
   e) Use a ferramenta MCP: source_delete
      - source_id = o ID retornado pelo notebook_add_local_file
      - confirm = true

ETAPA 4: Ao terminar todos os itens, informe o resumo:
   "Processados X de Y processos. Resultados salvos nas pastas do Drive."
```

---

### Gatilho: "Mapear cadernos"

Execute nesta ordem:

```
ETAPA 1: Use a ferramenta MCP: notebook_list
ETAPA 2: Abra o arquivo: notebooks_map.json
ETAPA 3: Compare a lista do MCP com o arquivo
ETAPA 4: Adicione cadernos novos que não estão no arquivo
ETAPA 5: Salve o arquivo atualizado
ETAPA 6: Informe quais cadernos foram adicionados
```

---

### Gatilho: "Atualizar engenharia de contexto"

Execute nesta ordem:

```
ETAPA 1: Pergunte ao usuário o que mudou no projeto (se não estiver claro)
ETAPA 2: Atualize APENAS os arquivos .context/ que precisam de mudança
ETAPA 3: Faça commit e push com mensagem descritiva
ETAPA 4: Informe quais arquivos foram atualizados
```

---

## REGRAS QUE VOCÊ NUNCA PODE QUEBRAR

1. NUNCA delete um PDF. Sempre mova para a pasta `_processados/`
2. NUNCA analise um processo no caderno errado. Use sempre o `notebookId` do `fila_pendente.json`
3. SEMPRE delete o source do NotebookLM após a análise (source_delete)
4. NUNCA modifique `notebooks_map.json` ou `mcp_config.json` sem confirmar com o usuário
5. SEMPRE salve o resultado `.md` na mesma pasta do Drive de onde veio o PDF

---

## SE ALGO DER ERRADO

- Se o `fila_pendente.json` estiver vazio → informe: "Nenhum PDF novo encontrado nas pastas."
- Se o `notebook_add_local_file` falhar → pule esse item, anote o erro e continue
- Se o `notebook_query` não retornar nada → salve o .md com a mensagem "Análise indisponível"
- Se não souber o que fazer → PERGUNTE ao usuário. Não adivinhe.
