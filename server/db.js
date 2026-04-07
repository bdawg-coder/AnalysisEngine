const Database = require('better-sqlite3')
const path     = require('path')

const db = new Database(path.join(__dirname, 'data.sqlite'))

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT    UNIQUE NOT NULL,
    name          TEXT           NOT NULL,
    role          TEXT           NOT NULL DEFAULT 'guest'
                    CHECK (role IN ('admin', 'engineer', 'manager', 'guest')),
    password_hash TEXT           NOT NULL,
    is_active     INTEGER        NOT NULL DEFAULT 1,
    created_at    TEXT           NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      TEXT    NOT NULL UNIQUE,
    expires_at TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_token   ON sessions(token);
  CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
`)

// pg-compatible async wrapper so the rest of the codebase stays unchanged
const pool = {
  query(sql, params = []) {
    // Convert pg-style $1 $2 ... placeholders to ?
    const converted = sql.replace(/\$\d+/g, '?')
    const stmt      = db.prepare(converted)
    const upper     = sql.trimStart().toUpperCase()

    if (upper.startsWith('SELECT')) {
      return Promise.resolve({ rows: stmt.all(...params) })
    } else {
      const info = stmt.run(...params)
      return Promise.resolve({ rows: [], rowCount: info.changes, lastID: info.lastInsertRowid })
    }
  },
}

module.exports = pool
