const TelegramBot = require('node-telegram-bot-api');
const config = require('./config/config');
const { handleStart, handleMessage, showMainMenu } = require('./controllers/auth');
const { handleDeployMessage } = require('./controllers/deploy');
const { handleList, handleDelete } = require('./controllers/list');
const db = require('./services/database');
const logger = require('./services/logger');

const bot = new TelegramBot(config.telegramToken, { polling: true });

bot.onText(/\/start/, (msg) => {
  db.run('INSERT OR IGNORE INTO users (telegram_id, state) VALUES (?, ?)', [msg.chat.id, 'awaiting_agreement'], (err) => {
    if (err) {
      logger.error(err.message);
    }
  });
  handleStart(bot, msg);
});

bot.on('callback_query', (callbackQuery) => {
  const msg = callbackQuery.message;
  const data = callbackQuery.data;

  if (data === 'agree') {
    db.run('UPDATE users SET state = ? WHERE telegram_id = ?', ['awaiting_token'], (err) => {
      if (err) {
        logger.error(err.message);
        return;
      }
      bot.sendMessage(msg.chat.id, 'Terima kasih. Silakan masukkan API Token Cloudflare Anda.');
    });
  } else if (data === 'deploy') {
    db.run('UPDATE users SET state = ? WHERE telegram_id = ?', ['awaiting_worker_name'], (err) => {
      if(err) {
        logger.error(err.message);
        return;
      }
      bot.sendMessage(msg.chat.id, 'Masukkan nama untuk Worker Anda:');
    });
  } else if (data === 'list') {
    handleList(bot, msg.chat.id);
  } else if (data.startsWith('delete_')) {
    const workerName = data.split('_')[1];
    handleDelete(bot, msg.chat.id, workerName);
  }
});

bot.on('message', (msg) => {
  if (msg.text.startsWith('/')) return;
  db.get('SELECT state FROM users WHERE telegram_id = ?', [msg.chat.id], (err, row) => {
    if (err) {
      logger.error(err.message);
      return;
    }
    if (row) {
      if (row.state.startsWith('awaiting_')) {
        handleMessage(bot, msg);
      } else if (row.state === 'authenticated') {
        handleDeployMessage(bot, msg);
      }
    }
  });
});

logger.info('Bot server started...');
console.log('Bot server started...');
