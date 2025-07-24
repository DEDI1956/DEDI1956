const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/cloudflare.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      telegram_id INTEGER PRIMARY KEY,
      cloudflare_api_token TEXT,
      cloudflare_account_id TEXT,
      cloudflare_zone_id TEXT,
      state TEXT
    )
  `);
});

module.exports = db;
