import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

let db;

export function initDb() {
  const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'ide.db');
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      files TEXT NOT NULL DEFAULT '[]',
      wiring TEXT NOT NULL DEFAULT '{"nodes":[],"connections":[]}',
      owner_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );
  `);

  console.log('[03X IDE] Database initialized at', dbPath);
}

export function getDb() {
  if (!db) initDb();
  return db;
}
