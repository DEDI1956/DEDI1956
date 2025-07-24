const db = require('../services/database');
const cfApi = require('../services/cfApi');
const logger = require('../services/logger');

const handleStart = (bot, msg) => {
  const chatId = msg.chat.id;
  const message = `
Selamat datang di Bot Deploy Cloudflare!

**Peraturan:**
1. Bot ini hanya untuk keperluan edukasi dan uji coba.
2. Jangan gunakan bot ini untuk aktivitas ilegal.
3. Kami tidak bertanggung jawab atas penyalahgunaan bot ini.

**Tujuan Bot:**
Membantu Anda men-deploy script Cloudflare Worker secara otomatis dari repositori GitHub.

**Risiko:**
- Kerahasiaan API Token Anda.
- Kesalahan konfigurasi dapat menyebabkan worker tidak berjalan.

**Disclaimer:**
Dengan menggunakan bot ini, Anda setuju dengan semua risiko yang ada.

Silakan klik "Saya Setuju" untuk melanjutkan.
  `;

  const opts = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'Saya Setuju',
            callback_data: 'agree',
          },
        ],
      ],
    },
    parse_mode: 'Markdown',
  };

  bot.sendMessage(chatId, message, opts);
};

const showMainMenu = (bot, chatId) => {
  const message = 'Silakan pilih salah satu opsi berikut:';
  const opts = {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Deploy Repo GitHub', callback_data: 'deploy' }],
        [{ text: 'List Worker', callback_data: 'list' }],
        [{ text: 'Hapus Worker', callback_data: 'delete' }],
      ],
    },
  };
  bot.sendMessage(chatId, message, opts);
};

const handleMessage = (bot, msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  db.get('SELECT state, cloudflare_api_token, cloudflare_account_id FROM users WHERE telegram_id = ?', [chatId], (err, row) => {
    if (err) {
      logger.error(err.message);
      return;
    }

    if (row) {
      switch (row.state) {
        case 'awaiting_token':
          db.run('UPDATE users SET cloudflare_api_token = ?, state = ? WHERE telegram_id = ?', [text, 'awaiting_account_id', chatId], (err) => {
            if (err) {
              logger.error(err.message);
              return;
            }
            bot.sendMessage(chatId, 'API Token disimpan. Sekarang masukkan Account ID Cloudflare Anda.');
          });
          break;
        case 'awaiting_account_id':
          db.run('UPDATE users SET cloudflare_account_id = ?, state = ? WHERE telegram_id = ?', [text, 'awaiting_zone_id', chatId], (err) => {
            if (err) {
              logger.error(err.message);
              return;
            }
            bot.sendMessage(chatId, 'Account ID disimpan. Sekarang masukkan Zone ID Cloudflare Anda.');
          });
          break;
        case 'awaiting_zone_id':
          db.run('UPDATE users SET cloudflare_zone_id = ?, state = ? WHERE telegram_id = ?', [text, 'authenticated', chatId], async (err) => {
            if (err) {
              logger.error(err.message);
              return;
            }
            bot.sendMessage(chatId, 'Zone ID disimpan. Memverifikasi kredensial...');
            try {
              const accountInfo = await cfApi.verifyCredentials(row.cloudflare_api_token, row.cloudflare_account_id);
              bot.sendMessage(chatId, `Verifikasi berhasil! Selamat datang, ${accountInfo.name}.`);
              showMainMenu(bot, chatId);
            } catch (error) {
              logger.error(`Failed to verify credentials for user ${chatId}: ${error.message}`);
              bot.sendMessage(chatId, 'Verifikasi gagal. Silakan periksa kembali kredensial Anda dan mulai lagi dengan /start.');
              db.run('UPDATE users SET state = ? WHERE telegram_id = ?', ['awaiting_agreement', chatId]);
            }
          });
          break;
      }
    }
  });
};

module.exports = {
  handleStart,
  handleMessage,
  showMainMenu,
};
