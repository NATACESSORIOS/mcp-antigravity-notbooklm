# Pipeline de Automação Legal: NotebookLM + Antigravity

## Visão Geral

Este documento descreve as arquiteturas de automação legal desenvolvidas usando a stack **File System (Node.js) + MCP do NotebookLM**.

## Fluxos Implementados

### Pipeline P1 — Extração e Análise RAG

```
PDF Local → extract_pdf.js → TXT → MCP notebook_add_local_file → RAG Query → Report
```

**Status:** ✅ Validado em Prova de Conceito

### Etapas:
1. **Extração local** via `pdf-parse@1.1.1` (Node.js)
2. **Upload** do `.txt` extraído para um Notebook efêmero via MCP
3. **Análise RAG** usando `notebook_query` com prompts jurídicos especializados
4. **Limpeza** do notebook efêmero após geração do relatório

## Fluxos Planejados

### Escudo Cognitivo (Porta de Entrada e Saneamento)
- **Raio-X de Admissibilidade:** Filtro de iniciais contra requisitos do CPC
- **Destilador de Fatos Incontroversos:** Separação pedido vs. contestação

### Gabinete Algorítmico
- **Clone Cognitivo do Magistrado:** Pré-esboço de minutas usando histórico de sentenças
- **Detector de Fake Law:** Cruzamento de jurisprudências citadas contra decisões reais
- **Escudo Anti-Embargos de Declaração:** Reavaliação de minutas contra pedidos

### Matemática Judiciária
- **Mutirão Zero-Touch:** Varredura em lote de processos sobrestados
- **Auditoria de Contadoria Flash:** Recálculo automatizado de rubricas

---

> **Nota:** Todas as arquiteturas utilizam o MCP do NotebookLM como motor RAG central,
> com o Firebase como backend de persistência e gerenciamento de estado.
