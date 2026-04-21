# MCP Antigravity + NotebookLM

Configuração MCP (Model Context Protocol) para integração do **Antigravity** com **NotebookLM** e **Firebase**, incluindo scripts auxiliares para o pipeline de análise jurídica automatizada.

## 📋 O que é

Este repositório contém:

- **`mcp_config.json`** — Configuração dos servidores MCP (NotebookLM + Firebase) para uso com o Antigravity
- **`scripts/extract_pdf.js`** — Extrator de texto de PDFs usando `pdf-parse` para alimentar o pipeline RAG do NotebookLM
- **`docs/pipeline_overview.md`** — Documentação das arquiteturas de automação legal planejadas

## 🚀 Setup Rápido

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar o MCP no Antigravity

Copie o `mcp_config.json` para o diretório de configuração do Antigravity:

```
~/.gemini/antigravity/mcp_config.json
```

### 3. Extrair texto de PDF

```bash
node scripts/extract_pdf.js <caminho-do-pdf> [caminho-de-saida.txt]
```

## 🏗️ Arquitetura do Pipeline

```
PDF Local → extract_pdf.js → TXT → MCP NotebookLM (notebook_add_local_file) → RAG Analysis → Report
```

## 📦 Servidores MCP Configurados

| Servidor | Pacote | Descrição |
|----------|--------|-----------|
| **firebase-mcp-server** | `firebase-tools@latest` | Gerenciamento de projetos Firebase, Firestore, Auth, Storage |
| **notebooklm** | `notebooklm-mcp-server` | Integração com NotebookLM para RAG, pesquisa, e geração de conteúdo |

## 🔧 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `scripts/extract_pdf.js` | Extrai texto de arquivos PDF para `.txt` usando `pdf-parse` |

## 📄 Licença

MIT
