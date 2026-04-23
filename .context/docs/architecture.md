# Visão Geral da Arquitetura

Este projeto implementa uma **Esteira de Análise Jurídica Autônoma** integrando Google Drive, NotebookLM (via MCP) e Firebase (via MCP), orquestrados pelo Antigravity.

## Papel de Cada Componente

| Componente | Papel | Responsabilidade |
|---|---|---|
| **Google Drive** | Depósito de entrada/saída | Usuário dropa PDFs → resultados são salvos aqui |
| **Antigravity (Agente)** | Orquestrador | Roda scripts, chama MCP, formata e salva resultados |
| **NotebookLM** | Motor de análise (RAG) | Analisa documentos usando contexto acumulado nos cadernos |
| **Firebase MCP** | Persistência futura | Disponível para logging e armazenamento estruturado |

## Fluxo Operacional

```
Usuário dropa PDF na pasta do Drive
        ↓
Antigravity roda scripts/processar_fila.js
        ↓
Script resolve o Google Drive File ID via banco local do Drive FS
        ↓
Antigravity conecta o PDF nativo ao caderno (notebook_add_drive)
        ↓
NotebookLM aplica seu próprio OCR (funciona com PDFs escaneados)
        ↓
NotebookLM analisa com contexto dos seus cadernos (notebook_query)
        ↓
Resultado salvo como NomeArquivo_Analise.md na mesma pasta do Drive
        ↓
Source efêmero (se PROCESSO) deletado (source_delete) / Fontes são mantidas
        ↓
PDF movido para subpasta _processados/ (se PROCESSO)
```

## Mapa de Cadernos
- **79 cadernos** do NotebookLM mapeados em `notebooks_map.json`
- **79 pastas espelhadas** criadas em `G:\Meu Drive\ARMAZENAMENTO TOTAL (2025)\MCP NOTBOOKLM - ANTIGRAVITY`
- Mapeamento: nome da pasta → ID do caderno no NotebookLM

## Componentes Técnicos

### Scripts Locais (`/scripts`)
- `get_drive_file_id.js` e `query_drive_db.js` — Resolve IDs reais do Drive a partir do banco local SQLite (`mirror_metadata_sqlite.db`)
- `processar_fila.js` — Varredura das pastas, resolução de Drive IDs em lote, geração de `fila_pendente.json`
- `create_notebook_folders.js` — Script utilitário para criação das pastas no Drive

### Arquivos de Estado
- `notebooks_map.json` — Mapeamento pasta ↔ ID do caderno (fonte da verdade)
- `fila_pendente.json` — Gerado pelo `processar_fila.js`; consumido pelo Antigravity via MCP
- `fila.log` — Log de todas as extrações e processamentos

### Serviço de IA Bridge
- `src/services/aiService.js` — Injeta contexto CDD nos prompts antes de enviar à LLM

## Padrão CDD (Context-Driven Development)
Toda interação do LLM implementada no código deve obrigatoriamente buscar o contexto desta pasta (`.context/`) antes de enviar uma requisição para a IA. O Antigravity lê `CLAUDE.md` na raiz do projeto e os arquivos desta pasta como memória persistente entre sessões.
