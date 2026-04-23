/**
 * PROCESSAR FILA - MCP NotebookLM + Antigravity
 * ================================================
 * Varre as pastas do Google Drive, detecta PDFs novos,
 * e prepara a fila para upload direto no NotebookLM.
 *
 * ✅ PDFs são enviados DIRETAMENTE ao NotebookLM (sem extração para .txt)
 * ✅ O NotebookLM usa seu próprio motor de OCR para PDFs escaneados
 * ✅ Documentos escaneados, PDFs protegidos e nativos são todos suportados
 *
 * REGRAS DE CLASSIFICAÇÃO DE ARQUIVOS:
 * - PDF com "fonte" no nome → tipo FONTE (referência permanente do caderno)
 * - PDF com número de processo (padrão XXXXXXX-XX.XXXX) → tipo PROCESSO (efêmero)
 * - Outros PDFs → ignorados (sem classificação)
 *
 * USO: node scripts/processar_fila.js
 */

const fs   = require('fs');
const path = require('path');

// ─── CONFIGURAÇÃO ────────────────────────────────────────────────
const MAP_FILE    = path.join(__dirname, '..', 'notebooks_map.json');
const QUEUE_FILE  = path.join(__dirname, '..', 'fila_pendente.json');
const LOG_FILE    = path.join(__dirname, '..', 'fila.log');
const DONE_FOLDER = '_processados';

// Padrão de número de processo trabalhista (ex: 0001631-51.2012.5.03.0033)
const REGEX_NUMERO_PROCESSO = /\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/;

// ─── UTILITÁRIOS ─────────────────────────────────────────────────
function log(msg) {
    const line = `[${new Date().toLocaleString('pt-BR')}] ${msg}`;
    console.log(line);
    fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
}

function loadMap() {
    return JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));
}

/**
 * Classifica um arquivo PDF:
 *  - 'FONTE':    nome contém "fonte" (case-insensitive) → referência permanente
 *  - 'PROCESSO': nome contém número de processo trabalhista → análise efêmera
 *  - null:       não se encaixa → ignorado
 */
function classificarArquivo(nomeArquivo) {
    const lower = nomeArquivo.toLowerCase();
    if (lower.includes('fonte')) return 'FONTE';
    if (REGEX_NUMERO_PROCESSO.test(nomeArquivo)) return 'PROCESSO';
    return null;
}

// ─── VARREDURA PRINCIPAL ─────────────────────────────────────────
async function processarFila() {
    console.log('\n🔍 ====== VARRENDO PASTAS DO GOOGLE DRIVE ======\n');

    const config    = loadMap();
    const baseDir   = config._drive_base;
    const notebooks = config.notebooks;
    const fila      = [];
    let   erros     = 0;

    if (!fs.existsSync(baseDir)) {
        console.error(`❌ Pasta base não encontrada:\n   ${baseDir}`);
        process.exit(1);
    }

    for (const entry of notebooks) {
        const folderPath = path.join(baseDir, entry.folder);
        if (!fs.existsSync(folderPath)) continue;

        // Lista apenas PDFs da pasta raiz (ignora _processados/)
        const arquivos = fs.readdirSync(folderPath).filter(f => {
            const full = path.join(folderPath, f);
            return f.toLowerCase().endsWith('.pdf') && fs.statSync(full).isFile();
        });

        if (arquivos.length === 0) continue;

        const fonteSourceIds = entry.fonte_source_ids || [];

        console.log(`📂 ${entry.folder}`);
        console.log(`   → ${arquivos.length} PDF(s) encontrado(s)`);
        if (fonteSourceIds.length > 0) {
            console.log(`   📌 ${fonteSourceIds.length} fonte(s) permanente(s) registrada(s)`);
        }

        for (const pdfFile of arquivos) {
            const tipo = classificarArquivo(pdfFile);

            if (tipo === null) {
                console.log(`   ⚠️  Ignorado (sem classificação clara): ${pdfFile}`);
                log(`IGNORADO: ${pdfFile}`);
                continue;
            }

            const pdfPath  = path.join(folderPath, pdfFile);
            const donePath = path.join(folderPath, DONE_FOLDER);

            console.log(`   ${tipo === 'FONTE' ? '📌 [FONTE]' : '📄 [PROCESSO]'} ${pdfFile}`);
            log(`Detectado [${tipo}]: ${pdfFile}`);

            if (tipo === 'PROCESSO') {
                // Move o PDF para _processados/ (preserva o original, libera a pasta)
                if (!fs.existsSync(donePath)) fs.mkdirSync(donePath, { recursive: true });
                const destPdf = path.join(donePath, pdfFile);
                fs.renameSync(pdfPath, destPdf);
                log(`Movido para _processados: ${pdfFile}`);

                fila.push({
                    tipo:           'PROCESSO',
                    caderno:        entry.folder,
                    notebookId:     entry.id,
                    fonteSourceIds: fonteSourceIds,
                    pdfOrigem:      destPdf,      // caminho final em _processados/
                    fileParaUpload: destPdf,      // ← PDF enviado direto ao NotebookLM (com OCR)
                    status:         'PENDENTE_MCP'
                });

            } else if (tipo === 'FONTE') {
                // Fontes NÃO são movidas — ficam na pasta original
                fila.push({
                    tipo:          'FONTE',
                    caderno:       entry.folder,
                    notebookId:    entry.id,
                    pdfOrigem:     pdfPath,
                    fileParaUpload: pdfPath,      // ← PDF enviado direto ao NotebookLM (com OCR)
                    status:        'REGISTRAR_FONTE'
                });
            }
        }
    }

    // Salvar fila
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(fila, null, 2), 'utf8');

    const processos = fila.filter(i => i.tipo === 'PROCESSO').length;
    const fontes    = fila.filter(i => i.tipo === 'FONTE').length;

    console.log('\n══════════════════════════════════════════════════');
    console.log(`📊 RESUMO:`);
    console.log(`   Processos para análise : ${processos}`);
    console.log(`   Fontes para registrar  : ${fontes}`);
    console.log(`   Erros                  : ${erros}`);
    console.log(`\n📋 Fila salva em: fila_pendente.json`);
    console.log('══════════════════════════════════════════════════');

    if (fila.length > 0) {
        console.log('\n✅ PRÓXIMO PASSO: diga "Processar fila" no Antigravity.\n');
    } else {
        console.log('\n💤 Nenhum PDF novo encontrado nas pastas.\n');
    }
}

processarFila().catch(err => {
    console.error('Erro crítico:', err);
    process.exit(1);
});
