/**
 * PROCESSAR FILA - MCP NotebookLM + Antigravity
 * ================================================
 * Varre as pastas do Google Drive, detecta PDFs novos,
 * extrai o texto de cada um e salva a fila para o
 * Antigravity processar via MCP do NotebookLM.
 *
 * USO: node scripts/processar_fila.js
 */

const fs   = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// ─── CONFIGURAÇÃO ────────────────────────────────────────────────
const MAP_FILE      = path.join(__dirname, '..', 'notebooks_map.json');
const EXTRACT_SCRIPT = path.join(__dirname, 'extract_pdf.js');
const QUEUE_FILE    = path.join(__dirname, '..', 'fila_pendente.json');
const LOG_FILE      = path.join(__dirname, '..', 'fila.log');
const DONE_FOLDER   = '_processados';

// ─── UTILITÁRIOS ─────────────────────────────────────────────────
function log(msg) {
    const line = `[${new Date().toLocaleString('pt-BR')}] ${msg}`;
    console.log(line);
    fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
}

function loadMap() {
    return JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));
}

// ─── EXTRAÇÃO DE TEXTO ───────────────────────────────────────────
function extractPDF(pdfPath) {
    const outPath = pdfPath.replace(/\.pdf$/i, '.txt');
    try {
        execFileSync('node', [EXTRACT_SCRIPT, pdfPath, outPath]);
        return { success: true, txtPath: outPath };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

// ─── VARREDURA PRINCIPAL ─────────────────────────────────────────
async function processarFila() {
    console.log('\n🔍 ====== VARRENDO PASTAS DO GOOGLE DRIVE ======\n');

    const config    = loadMap();
    const baseDir   = config._drive_base;
    const notebooks = config.notebooks;
    const fila      = [];
    let   total     = 0;
    let   erros     = 0;

    if (!fs.existsSync(baseDir)) {
        console.error(`❌ Pasta base não encontrada:\n   ${baseDir}`);
        process.exit(1);
    }

    for (const entry of notebooks) {
        const folderPath = path.join(baseDir, entry.folder);
        if (!fs.existsSync(folderPath)) continue;

        // Ignora a subpasta _processados
        const arquivos = fs.readdirSync(folderPath).filter(f => {
            const full = path.join(folderPath, f);
            return f.toLowerCase().endsWith('.pdf') &&
                   fs.statSync(full).isFile();
        });

        if (arquivos.length === 0) continue;

        console.log(`📂 ${entry.folder}`);
        console.log(`   → ${arquivos.length} PDF(s) encontrado(s)`);

        for (const pdfFile of arquivos) {
            total++;
            const pdfPath  = path.join(folderPath, pdfFile);
            const txtPath  = pdfPath.replace(/\.pdf$/i, '.txt');
            const donePath = path.join(folderPath, DONE_FOLDER);

            process.stdout.write(`   ⚙️  Extraindo: ${pdfFile} ... `);
            const resultado = extractPDF(pdfPath);

            if (!resultado.success) {
                console.log('❌ FALHOU');
                log(`ERRO ao extrair ${pdfFile}: ${resultado.error}`);
                erros++;
                continue;
            }

            console.log('✅ OK');
            log(`Extraído: ${pdfFile} → ${path.basename(txtPath)}`);

            // Mover PDF para _processados
            if (!fs.existsSync(donePath)) fs.mkdirSync(donePath, { recursive: true });
            const destPdf = path.join(donePath, pdfFile);
            fs.renameSync(pdfPath, destPdf);

            // Adicionar à fila para o Antigravity processar via MCP
            fila.push({
                caderno:    entry.folder,
                notebookId: entry.id,
                pdfOrigem:  destPdf,
                txtParaUpload: txtPath,
                status:     'PENDENTE_MCP'
            });
        }
    }

    // Salvar fila estruturada
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(fila, null, 2), 'utf8');

    // Resumo final
    console.log('\n══════════════════════════════════════════════════');
    console.log(`📊 RESUMO:`);
    console.log(`   Total processados : ${total}`);
    console.log(`   Erros de extração : ${erros}`);
    console.log(`   Prontos para MCP  : ${fila.length}`);
    console.log(`\n📋 Fila salva em: fila_pendente.json`);
    console.log('══════════════════════════════════════════════════');

    if (fila.length > 0) {
        console.log('\n✅ PRÓXIMO PASSO:');
        console.log('   Me diga "Processar fila" no Antigravity.');
        console.log('   Eu vou usar o MCP para analisar cada processo');
        console.log('   e salvar os resultados nas pastas do Drive.\n');
    } else {
        console.log('\n💤 Nenhum PDF novo encontrado nas pastas.\n');
    }
}

processarFila().catch(err => {
    console.error('Erro crítico:', err);
    process.exit(1);
});
