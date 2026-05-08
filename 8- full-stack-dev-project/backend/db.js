/**
 * Utilizza better-sqlite3 per una configurazione SQLite sincrona e zero-config.
 * In modalità test (NODE_ENV=test) viene utilizzato un database in memoria così i test
 * non toccano mai il filesystem e iniziano sempre con uno stato pulito.
 */

const Database = require('better-sqlite3');
const path = require('path');

// DB in memoria per i test, basata su file per sviluppo/produzione
const dbPath =
  process.env.NODE_ENV === 'test'
    ? ':memory:'
    : path.join(__dirname, 'scholarport.db');

const db = new Database(dbPath);

// Abilita modalità WAL per prestazioni di lettura concorrente migliori (solo modalità file)
if (dbPath !== ':memory:') {
  db.pragma('journal_mode = WAL');
}

// Forza vincoli di chiave esterna
db.pragma('foreign_keys = ON');

/**
 * Crea le tabelle dello schema se non esistono già.
 * Chiamata una volta all'avvio.
 */
db.exec(`
  CREATE TABLE IF NOT EXISTS papers (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    title            TEXT    NOT NULL,
    authors          TEXT    NOT NULL,
    abstract         TEXT    DEFAULT '',
    publication_date TEXT    DEFAULT '',
    doi              TEXT    DEFAULT '',
    created_at       TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS citations (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    paper_id   INTEGER NOT NULL,
    text       TEXT    NOT NULL,
    authors    TEXT    DEFAULT '',
    year       INTEGER,
    created_at TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
  );
`);

module.exports = db;
