const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

const dbPath = path.resolve(__dirname, '../database');
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath, { recursive: true });
}

const dbFile = path.join(dbPath, 'cloudflare.db');
const db = new sqlite3.Database(dbFile, (err) => {
  if (err) {
    logger.error('Could not connect to database', err);
  } else {
    logger.info('Connected to database');
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      telegram_id INTEGER PRIMARY KEY,
      api_token TEXT,
      account_id TEXT,
      zone_id TEXT,
      state TEXT
    )
  `, (err) => {
    if (err) {
      logger.error('Error creating users table', err);
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS workers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id INTEGER,
      worker_name TEXT,
      github_url TEXT,
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (telegram_id) REFERENCES users (telegram_id)
    )
  `, (err) => {
    if (err) {
      logger.error('Error creating workers table', err);
    }
  });
});

module.exports = db;
