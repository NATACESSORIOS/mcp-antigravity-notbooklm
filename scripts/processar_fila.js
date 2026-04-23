/**
 * PROCESSAR FILA - MCP NotebookLM + Antigravity
 * ================================================
 * Varre as pastas do Google Drive, detecta PDFs novos,
 * extrai o texto de cada um e salva a fila para o
 * Antigravity processar via MCP do NotebookLM.
 *
 * REGRAS DE CLASSIFICAÇÃO DE ARQUIVOS:
 * - PDF com "fonte" no nome → tipo REGISTRAR_FONTE (referência permanente)
 * - PDF com número de processo (padrão XXXXXXX-XX.XXXX) → tipo PENDENTE_MCP (efêmero)
 *
 * USO: node scripts/processar_fila.js
 */

const fs   = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// ─── CONFIGURAÇÃO ────────────────────────────────────────────────
const MAP_FILE       = path.join(__dirname, '..', 'notebooks_map.json');
const EXTRACT_SCRIPT = path.join(__dirname, 'extract_pdf.js');
const QUEUE_FILE     = path.join(__dirname, '..', 'fila_pendente.json');
const LOG_FILE       = path.join(__dirname, '..', 'fila.log');
const DONE_FOLDER    = '_processados';

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
 * Classifica um arquivo PDF em dois tipos:
 *  - 'FONTE': nome contém a palavra "fonte" (case-insensitive)
 *  - 'PROCESSO': nome contém um número de processo trabalhista
 *  - null: arquivo ignorado (não se encaixa em nenhuma categoria)
 */
function classificarArquivo(nomeArquivo) {
    const lower = nomeArquivo.toLowerCase();
    if (lower.includes('fonte')) return 'FONTE';
    if (REGEX_NUMERO_PROCESSO.test(nomeArquivo)) return 'PROCESSO';
    return null; // ignora arquivos sem classificação clara
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
    let   totalProcessos = 0;
    let   totalFontes    = 0;
    let   erros          = 0;

    if (!fs.existsSync(baseDir)) {
        console.error(`❌ Pasta base não encontrada:\n   ${baseDir}`);
        process.exit(1);
    }

    for (const entry of notebooks) {
        const folderPath = path.join(baseDir, entry.folder);
        if (!fs.existsSync(folderPath)) continue;

        // Lista apenas PDFs (exclui a subpasta _processados)
        const arquivos = fs.readdirSync(folderPath).filter(f => {
            const full = path.join(folderPath, f);
            return f.toLowerCase().endsWith('.pdf') &&
                   fs.statSync(full).isFile();
        });

        if (arquivos.length === 0) continue;

        // Obtém fonte_source_ids do mapa (IDs de fontes já registradas)
        const fonteSourceIds = entry.fonte_source_ids || [];

        console.log(`📂 ${entry.folder}`);
        console.log(`   → ${arquivos.length} PDF(s) encontrado(s)`);
        if (fonteSourceIds.length > 0) {
            console.log(`   📌 ${fonteSourceIds.length} fonte(s) permanente(s) registrada(s) neste caderno`);
        }

        for (const pdfFile of arquivos) {
            const tipo = classificarArquivo(pdfFile);

            if (tipo === null) {
                console.log(`   ⚠️  Ignorado (sem classificação): ${pdfFile}`);
                log(`IGNORADO (sem classificação): ${pdfFile}`);
                continue;
            }

            const pdfPath  = path.join(folderPath, pdfFile);
            const donePath = path.join(folderPath, DONE_FOLDER);

            process.stdout.write(`   ${tipo === 'FONTE' ? '📌' : '⚙️ '} Extraindo [${tipo}]: ${pdfFile} ... `);
            const resultado = extractPDF(pdfPath);

            if (!resultado.success) {
                console.log('❌ FALHOU');
                log(`ERRO ao extrair ${pdfFile}: ${resultado.error}`);
                erros++;
                continue;
            }

            console.log('✅ OK');
            log(`Extraído [${tipo}]: ${pdfFile} → ${path.basename(resultado.txtPath)}`);

            if (tipo === 'PROCESSO') {
                totalProcessos++;
                // Move o PDF para _processados (fontes NÃO são movidas)
                if (!fs.existsSync(donePath)) fs.mkdirSync(donePath, { recursive: true });
                const destPdf = path.join(donePath, pdfFile);
                fs.renameSync(pdfPath, destPdf);

                fila.push({
                    tipo:            'PROCESSO',
                    caderno:         entry.folder,
                    notebookId:      entry.id,
                    fonteSourceIds:  fonteSourceIds, // IDs das fontes permanentes deste caderno
                    pdfOrigem:       destPdf,
                    txtParaUpload:   resultado.txtPath,
                    status:          'PENDENTE_MCP'
                });

            } else if (tipo === 'FONTE') {
                totalFontes++;
                // Fontes NÃO são movidas — ficam na pasta original
                // O Antigravity vai fazer upload e registrar o source_id no notebooks_map.json

                fila.push({
                    tipo:          'FONTE',
                    caderno:       entry.folder,
                    notebookId:    entry.id,
                    pdfOrigem:     pdfPath,
                    txtParaUpload: resultado.txtPath,
                    status:        'REGISTRAR_FONTE'
                });
            }
        }
    }

    // Salvar fila estruturada
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(fila, null, 2), 'utf8');

    // Resumo final
    const processos = fila.filter(i => i.tipo === 'PROCESSO').length;
    const fontes    = fila.filter(i => i.tipo === 'FONTE').length;

    console.log('\n══════════════════════════════════════════════════');
    console.log(`📊 RESUMO:`);
    console.log(`   Processos para análise  : ${processos}`);
    console.log(`   Fontes para registrar   : ${fontes}`);
    console.log(`   Erros de extração       : ${erros}`);
    console.log(`\n📋 Fila salva em: fila_pendente.json`);
    console.log('══════════════════════════════════════════════════');

    if (fila.length > 0) {
        console.log('\n✅ PRÓXIMO PASSO:');
        console.log('   Me diga "Processar fila" no Antigravity.\n');
    } else {
        console.log('\n💤 Nenhum PDF novo encontrado nas pastas.\n');
    }
}

processarFila().catch(err => {
    console.error('Erro crítico:', err);
    process.exit(1);
});
