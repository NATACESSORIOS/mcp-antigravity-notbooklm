const sqlite3 = require('sqlite3');

const DB_PATH = 'C:\\Users\\gilbe\\AppData\\Local\\Google\\DriveFS\\111089556279935298242\\mirror_metadata_sqlite.db';

const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
    if (err) { console.error('Erro:', err.message); return; }

    // Primeiro: schema da tabela stable_ids
    db.all("PRAGMA table_info(stable_ids)", [], (err, cols) => {
        if (err) { console.error(err.message); return; }
        console.log('Colunas stable_ids:', cols.map(c => c.name).join(', '));

        // Buscar o mapeamento para stable_id=237920
        db.get("SELECT * FROM stable_ids WHERE stable_id = 237920", [], (err, row) => {
            if (err) { console.error(err.message); return; }
            console.log('\nMapeamento para 237920:', JSON.stringify(row, null, 2));

            // Tenta a tabela items com coluna 'id' (pode ser o Drive ID real)
            db.get("SELECT id, stable_id, local_title FROM items WHERE stable_id = 237920", [], (err, item) => {
                if (err) { console.error(err.message); return; }
                console.log('\nItem completo:', JSON.stringify(item, null, 2));

                // Decodifica o proto (pode conter o file ID real)
                db.get("SELECT stable_id, id, local_title, proto FROM items WHERE stable_id = 237920", [], (err, full) => {
                    if (err) { console.error(err.message); return; }
                    console.log('\nColuna id (Drive File ID candidato):', full ? full.id : 'não encontrado');
                    db.close();
                });
            });
        });
    });
});
