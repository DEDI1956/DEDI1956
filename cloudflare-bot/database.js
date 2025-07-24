const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

const dbPath = path.resolve(__dirname, 'database');
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
      cloudflare_api_token TEXT,
      cloudflare_account_id TEXT,
      cloudflare_zone_id TEXT,
      state TEXT,
      worker_name TEXT
    )
  `, (err) => {
    if (err) {
      logger.error('Error creating table', err);
    }
  });
});

module.exports = db;
