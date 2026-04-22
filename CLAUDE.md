# INSTRUÇÃO CRÍTICA PARA A IA (SISTEMA)

Você DEVE ler o conteúdo da pasta `.context/` ANTES de realizar qualquer alteração neste projeto.
A pasta `.context/` funciona como sua memória e contém as regras de negócio, arquitetura e estado atual do projeto.

1. Leia `.context/agents/main_agent.md` para entender seu papel.
2. Leia `.context/plans/active.md` para entender em qual tarefa estamos trabalhando agora.
3. Leia `.context/docs/business_rules.md` para conhecer as regras imutáveis.
4. Leia `.context/docs/architecture.md` para entender a estrutura completa do sistema.

## Gatilhos que o usuário usa com você

| Gatilho | Ação Esperada |
|---|---|
| **"Processar fila"** | Rodar `npm run processar`, ler `fila_pendente.json`, executar o pipeline MCP completo |
| **"Atualizar engenharia de contexto"** | Atualizar todos os arquivos da pasta `.context/` com o estado atual |
| **"Mapear cadernos"** | Chamar `notebook_list` via MCP e sincronizar com `notebooks_map.json` |

## A Regra de Ouro

🚨 **Sempre que você alterar a lógica, estrutura de banco de dados ou a arquitetura, você DEVE atualizar o arquivo correspondente na pasta `.context/` no mesmo commit/etapa. Não permita o "Context Drift".**
