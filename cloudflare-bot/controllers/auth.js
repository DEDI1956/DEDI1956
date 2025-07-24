const db = require('../services/database');
const logger = require('../services/logger');
const { verifyCredentials } = require('../services/cloudflare');

const handleStart = (bot, msg) => {
  const chatId = msg.chat.id;
  const message = `
Selamat datang di Bot Deploy Cloudflare!

**Peraturan & Risiko:**
- Bot ini akan menyimpan kredensial Cloudflare Anda.
- Gunakan dengan risiko Anda sendiri.

Klik "Saya Setuju" untuk melanjutkan.
  `;
  const opts = {
    reply_markup: {
      inline_keyboard: [[{ text: '✅ Saya Setuju', callback_data: 'agree' }]],
    },
  };
  bot.sendMessage(chatId, message, opts);
};

const handleAgree = (bot, msg) => {
  const chatId = msg.chat.id;
  db.run('INSERT OR REPLACE INTO users (telegram_id, state) VALUES (?, ?)', [chatId, 'awaiting_token'], (err) => {
    if (err) {
      logger.error('Database error:', err);
      return;
    }
    bot.sendMessage(chatId, 'Silakan masukkan API Token Cloudflare Anda.');
  });
};

const handleToken = (bot, msg) => {
  const chatId = msg.chat.id;
  const token = msg.text;
  db.run('UPDATE users SET api_token = ?, state = ? WHERE telegram_id = ?', [token, 'awaiting_account_id', chatId], (err) => {
    if (err) {
      logger.error('Database error:', err);
      return;
    }
    bot.sendMessage(chatId, 'API Token disimpan. Sekarang masukkan Account ID Cloudflare Anda.');
  });
};

const handleAccountId = (bot, msg) => {
  const chatId = msg.chat.id;
  const accountId = msg.text;
  db.run('UPDATE users SET account_id = ?, state = ? WHERE telegram_id = ?', [accountId, 'awaiting_zone_id', chatId], (err) => {
    if (err) {
      logger.error('Database error:', err);
      return;
    }
    bot.sendMessage(chatId, 'Account ID disimpan. Sekarang masukkan Zone ID Cloudflare Anda.');
  });
};

const handleZoneId = async (bot, msg) => {
  const chatId = msg.chat.id;
  const zoneId = msg.text;
  db.run('UPDATE users SET zone_id = ? WHERE telegram_id = ?', [zoneId, chatId], async (err) => {
    if (err) {
      logger.error('Database error:', err);
      return;
    }
    bot.sendMessage(chatId, 'Memverifikasi kredensial...');
    try {
      const user = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE telegram_id = ?', [chatId], (err, row) => {
          if (err) reject(err);
          resolve(row);
        });
      });
      const { accountName, plan, domain } = await verifyCredentials(user.api_token, user.account_id, user.zone_id);
      db.run('UPDATE users SET state = ? WHERE telegram_id = ?', ['authenticated', chatId]);
      bot.sendMessage(chatId, `Verifikasi berhasil!\n\nNama Akun: ${accountName}\nPaket: ${plan}\nDomain: ${domain}`);
      showMainMenu(bot, chatId);
    } catch (error) {
      bot.sendMessage(chatId, 'Verifikasi gagal. Silakan mulai lagi dengan /start.');
      db.run('UPDATE users SET state = ? WHERE telegram_id = ?', ['awaiting_agreement', chatId]);
    }
  });
};

const showMainMenu = (bot, chatId) => {
  const message = 'Menu Utama:';
  const opts = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🚀 Deploy Worker', callback_data: 'deploy' }],
        [{ text: '📋 List Workers', callback_data: 'list_workers' }],
        [{ text: '🗑️ Hapus Worker', callback_data: 'delete_worker_menu' }],
      ],
    },
  };
  bot.sendMessage(chatId, message, opts);
};

module.exports = {
  handleStart,
  handleAgree,
  handleToken,
  handleAccountId,
  handleZoneId,
  showMainMenu,
};
