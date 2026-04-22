/**
 * ESTEIRA AUTÔNOMA - MCP NotebookLM
 * ====================================
 * Varre as pastas do Google Drive, detecta PDFs novos,
 * extrai o texto, sobe para o caderno correto no NotebookLM,
 * salva o resultado na pasta e limpa o documento efêmero.
 *
 * MODO DE USO:
 *   node scripts/watcher.js              → Roda uma vez agora
 *   node scripts/watcher.js --loop 30   → Roda a cada 30 minutos em loop
 */

const fs = require('fs');
const path = require('path');
const { execSync, execFileSync } = require('child_process');

// ─── CONFIGURAÇÃO ────────────────────────────────────────────────
const MAP_FILE = path.join(__dirname, '..', 'notebooks_map.json');
const EXTRACT_SCRIPT = path.join(__dirname, 'extract_pdf.js');
const LOG_FILE = path.join(__dirname, '..', 'watcher.log');

// Marcador: PDFs dentro desta subpasta já foram processados
const DONE_FOLDER = '_processados';

// ─── UTILITÁRIOS ─────────────────────────────────────────────────
function log(msg) {
    const line = `[${new Date().toISOString()}] ${msg}`;
    console.log(line);
    fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
}

function loadMap() {
    const raw = fs.readFileSync(MAP_FILE, 'utf8');
    return JSON.parse(raw);
}

function extractText(pdfPath) {
    const outPath = pdfPath.replace(/\.pdf$/i, '_extracted.txt');
    execFileSync('node', [EXTRACT_SCRIPT, pdfPath, outPath], { stdio: 'inherit' });
    return outPath;
}

// ─── NÚCLEO DA ESTEIRA ────────────────────────────────────────────
async function processFolder(folderPath, notebookId, folderName) {
    const files = fs.readdirSync(folderPath);
    const pdfs = files.filter(f => f.toLowerCase().endsWith('.pdf'));

    if (pdfs.length === 0) return;

    log(`📂 [${folderName}] → ${pdfs.length} PDF(s) encontrado(s).`);

    for (const pdfFile of pdfs) {
        const pdfPath = path.join(folderPath, pdfFile);
        const donePath = path.join(folderPath, DONE_FOLDER);
        const resultPath = path.join(folderPath, pdfFile.replace(/\.pdf$/i, '_Analise.md'));

        log(`  ⚙️  Processando: ${pdfFile}`);

        // 1. EXTRAIR TEXTO DO PDF
        let txtPath;
        try {
            txtPath = extractText(pdfPath);
            log(`  ✅ Texto extraído: ${path.basename(txtPath)}`);
        } catch (err) {
            log(`  ❌ Falha na extração de ${pdfFile}: ${err.message}`);
            continue;
        }

        // 2. FAZER O UPLOAD PARA O NOTEBOOKLM (via MCP CLI)
        // O MCP NotebookLM é chamado via variável de ambiente ou CLI wrapper.
        // Aqui usamos o wrapper de chamada JSON-RPC que o Antigravity expõe.
        // Na prática, este script é chamado PELO Antigravity que tem acesso ao MCP.
        // Deixamos aqui o contrato esperado para integração futura.
        log(`  📤 Upload para caderno [${notebookId}] pendente de integração MCP.`);
        log(`      → Arquivo pronto: ${txtPath}`);
        log(`      → Caderno alvo:   ${notebookId}`);

        // 3. REGISTRAR RESULTADO PLACEHOLDER
        const analise = `# Análise Pendente\n\n- **Arquivo:** ${pdfFile}\n- **Caderno:** ${folderName} (${notebookId})\n- **Texto extraído:** ${path.basename(txtPath)}\n- **Status:** Aguardando execução pelo Antigravity via MCP.\n\n_Gerado automaticamente pelo Watcher em ${new Date().toLocaleString('pt-BR')}_\n`;
        fs.writeFileSync(resultPath, analise, 'utf8');
        log(`  📝 Resultado salvo: ${path.basename(resultPath)}`);

        // 4. MOVER PDF PARA _processados/
        if (!fs.existsSync(donePath)) fs.mkdirSync(donePath, { recursive: true });
        fs.renameSync(pdfPath, path.join(donePath, pdfFile));
        log(`  📦 PDF movido para _processados/.`);
    }
}

async function runPipeline() {
    log('🚀 ========== INICIANDO ESTEIRA AUTÔNOMA ==========');

    const config = loadMap();
    const baseDir = config._drive_base;
    const notebooks = config.notebooks;

    if (!fs.existsSync(baseDir)) {
        log(`❌ Pasta base não encontrada: ${baseDir}`);
        return;
    }

    for (const entry of notebooks) {
        const folderPath = path.join(baseDir, entry.folder);
        if (!fs.existsSync(folderPath)) continue;

        await processFolder(folderPath, entry.id, entry.folder);
    }

    log('✅ ========== ESTEIRA CONCLUÍDA ==========\n');
}

// ─── EXECUÇÃO ─────────────────────────────────────────────────────
const args = process.argv.slice(2);
const loopIdx = args.indexOf('--loop');

if (loopIdx !== -1) {
    const minutes = parseInt(args[loopIdx + 1]) || 30;
    log(`⏱️  Modo loop ativado: rodando a cada ${minutes} minutos.`);
    runPipeline();
    setInterval(runPipeline, minutes * 60 * 1000);
} else {
    runPipeline();
}
