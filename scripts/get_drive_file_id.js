/**
 * get_drive_file_id.js
 * =====================
 * Consulta o banco de metadados local do Google Drive for Desktop
 * e retorna o File ID do Google Drive para um arquivo dado seu nome.
 *
 * USO: node scripts/get_drive_file_id.js "nome-do-arquivo.pdf"
 */

const sqlite3 = require('sqlite3');

const DB_PATH = 'C:\\Users\\gilbe\\AppData\\Local\\Google\\DriveFS\\111089556279935298242\\mirror_metadata_sqlite.db';
const target  = process.argv[2];

if (!target) {
    console.error('USO: node get_drive_file_id.js "nome-do-arquivo.pdf"');
    process.exit(1);
}

const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
    if (err) { console.error('Erro ao abrir DB:', err.message); process.exit(1); }

    db.all(
        `SELECT stable_id, local_title, mime_type, file_size, modified_date
         FROM items
         WHERE local_title LIKE ?
         AND is_tombstone = 0
         ORDER BY modified_date DESC
         LIMIT 5`,
        [`%${target}%`],
        (err, rows) => {
            if (err) { console.error('Erro query:', err.message); db.close(); return; }

            if (rows.length === 0) {
                console.log(`❌ Nenhum arquivo encontrado com "${target}" no nome.`);
            } else {
                console.log(`\n✅ ${rows.length} arquivo(s) encontrado(s):\n`);
                rows.forEach(r => {
                    const driveUrl = `https://drive.google.com/file/d/${r.stable_id}/view`;
                    console.log(`📄 Nome:      ${r.local_title}`);
                    console.log(`   File ID:   ${r.stable_id}`);
                    console.log(`   Tamanho:   ${(r.file_size / 1024).toFixed(1)} KB`);
                    console.log(`   Drive URL: ${driveUrl}`);
                    console.log('');
                });
            }
            db.close();
        }
    );
});
