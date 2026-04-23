/**
 * PROCESSAR FILA - MCP NotebookLM + Antigravity
 * ================================================
 * Varre as pastas do Google Drive, detecta PDFs novos,
 * resolve o Google Drive File ID via banco de metadados local,
 * e prepara a fila para upload via notebook_add_drive.
 *
 * ✅ PDFs enviados via Google Drive File ID (notebook_add_drive)
 * ✅ NotebookLM usa seu próprio motor de OCR — qualidade máxima
 * ✅ Funciona com PDFs escaneados, digitais, protegidos
 * ✅ Não há extração local de texto
 *
 * REGRAS DE CLASSIFICAÇÃO:
 * - PDF com "fonte" no nome → tipo FONTE (referência permanente)
 * - PDF com número de processo → tipo PROCESSO (efêmero)
 * - Outros PDFs → ignorados
 *
 * USO: node scripts/processar_fila.js
 */

const fs      = require('fs');
const path    = require('path');
const sqlite3 = require('sqlite3');

// ─── CONFIGURAÇÃO ────────────────────────────────────────────────
const MAP_FILE    = path.join(__dirname, '..', 'notebooks_map.json');
const QUEUE_FILE  = path.join(__dirname, '..', 'fila_pendente.json');
const LOG_FILE    = path.join(__dirname, '..', 'fila.log');
const DONE_FOLDER = '_processados';

// Banco de metadados do Google Drive for Desktop
const DRIVE_DB = 'C:\\Users\\gilbe\\AppData\\Local\\Google\\DriveFS\\111089556279935298242\\mirror_metadata_sqlite.db';

// Padrão de número de processo trabalhista
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

function classificarArquivo(nomeArquivo) {
    const lower = nomeArquivo.toLowerCase();
    if (lower.includes('fonte')) return 'FONTE';
    if (REGEX_NUMERO_PROCESSO.test(nomeArquivo)) return 'PROCESSO';
    return null;
}

/**
 * Consulta o banco local do Drive for Desktop e retorna o File ID real do Google Drive.
 * A tabela `items` tem a coluna `id` que é o cloud_id (ex: "1McFC0jY...").
 */
function getDriveFileId(nomeArquivo) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(DRIVE_DB)) {
            return reject(new Error('Banco do Google Drive não encontrado: ' + DRIVE_DB));
        }
        const db = new sqlite3.Database(DRIVE_DB, sqlite3.OPEN_READONLY, (err) => {
            if (err) return reject(err);
            db.get(
                `SELECT id FROM items WHERE local_title = ? AND is_tombstone = 0 ORDER BY modified_date DESC LIMIT 1`,
                [nomeArquivo],
                (err, row) => {
                    db.close();
                    if (err) return reject(err);
                    if (!row) return resolve(null);
                    resolve(row.id);
                }
            );
        });
    });
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

        const arquivos = fs.readdirSync(folderPath).filter(f => {
            const full = path.join(folderPath, f);
            return f.toLowerCase().endsWith('.pdf') && fs.statSync(full).isFile();
        });

        if (arquivos.length === 0) continue;

        const fonteSourceIds = entry.fonte_source_ids || [];

        console.log(`📂 ${entry.folder}`);
        console.log(`   → ${arquivos.length} PDF(s) encontrado(s)`);
        if (fonteSourceIds.length > 0) {
            console.log(`   📌 ${fonteSourceIds.length} fonte(s) permanente(s)`);
        }

        for (const pdfFile of arquivos) {
            const tipo = classificarArquivo(pdfFile);

            if (tipo === null) {
                console.log(`   ⚠️  Ignorado (sem classificação): ${pdfFile}`);
                log(`IGNORADO: ${pdfFile}`);
                continue;
            }

            const pdfPath  = path.join(folderPath, pdfFile);
            const donePath = path.join(folderPath, DONE_FOLDER);

            // Resolve o Google Drive File ID via banco local
            process.stdout.write(`   ${tipo === 'FONTE' ? '📌 [FONTE]' : '📄 [PROCESSO]'} ${pdfFile} → buscando Drive ID... `);
            let driveFileId = null;
            try {
                driveFileId = await getDriveFileId(pdfFile);
            } catch (e) {
                console.log(`❌ Erro ao buscar ID: ${e.message}`);
                log(`ERRO Drive ID: ${pdfFile} — ${e.message}`);
                erros++;
                continue;
            }

            if (!driveFileId) {
                console.log(`❌ ID não encontrado no banco do Drive`);
                log(`ERRO Drive ID não encontrado: ${pdfFile}`);
                erros++;
                continue;
            }

            console.log(`✅ ${driveFileId}`);
            log(`Detectado [${tipo}]: ${pdfFile} → Drive ID: ${driveFileId}`);

            if (tipo === 'PROCESSO') {
                // Move o PDF para _processados/
                if (!fs.existsSync(donePath)) fs.mkdirSync(donePath, { recursive: true });
                const destPdf = path.join(donePath, pdfFile);
                fs.renameSync(pdfPath, destPdf);
                log(`Movido para _processados: ${pdfFile}`);

                fila.push({
                    tipo:           'PROCESSO',
                    caderno:        entry.folder,
                    notebookId:     entry.id,
                    fonteSourceIds: fonteSourceIds,
                    driveFileId:    driveFileId,      // ← ID real do Google Drive
                    pdfNome:        pdfFile,
                    status:         'PENDENTE_MCP'
                });

            } else if (tipo === 'FONTE') {
                // Fontes NÃO são movidas
                fila.push({
                    tipo:        'FONTE',
                    caderno:     entry.folder,
                    notebookId:  entry.id,
                    driveFileId: driveFileId,
                    pdfNome:     pdfFile,
                    status:      'REGISTRAR_FONTE'
                });
            }
        }
    }

    fs.writeFileSync(QUEUE_FILE, JSON.stringify(fila, null, 2), 'utf8');

    const processos = fila.filter(i => i.tipo === 'PROCESSO').length;
    const fontes    = fila.filter(i => i.tipo === 'FONTE').length;

    console.log('\n══════════════════════════════════════════════════');
    console.log('📊 RESUMO:');
    console.log(`   Processos para análise : ${processos}`);
    console.log(`   Fontes para registrar  : ${fontes}`);
    console.log(`   Erros                  : ${erros}`);
    console.log('\n📋 Fila salva em: fila_pendente.json');
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
