require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const config = require('./config/config');
const logger = require('./services/logger');
const db = require('./services/database');
const { handleStart, handleAgree, handleToken, handleAccountId, handleZoneId, showMainMenu } = require('./controllers/auth');
const { handleDeploy, handleWorkerName, handleRepoUrl } = require('./controllers/deploy');
const { handleListWorkers, handleDeleteWorker, handleConfirmDelete } = require('./controllers/list');

const bot = new TelegramBot(config.telegramToken, { polling: true });

bot.onText(/\/start/, (msg) => handleStart(bot, msg));

bot.on('callback_query', (query) => {
  const { data, message } = query;
  const chatId = message.chat.id;

  if (data === 'agree') {
    handleAgree(bot, message);
  } else if (data === 'deploy') {
    handleDeploy(bot, message);
  } else if (data === 'list_workers') {
    handleListWorkers(bot, message);
  } else if (data.startsWith('delete_')) {
    const workerName = data.split('_')[1];
    handleDeleteWorker(bot, message, workerName);
  } else if (data.startsWith('confirm_delete_')) {
    const workerName = data.split('_')[2];
    handleConfirmDelete(bot, message, workerName);
  } else if (data === 'cancel_delete') {
    bot.editMessageText('Penghapusan dibatalkan.', {
      chat_id: chatId,
      message_id: message.message_id,
    });
  }
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  if (msg.text.startsWith('/')) return;

  db.get('SELECT state FROM users WHERE telegram_id = ?', [chatId], (err, row) => {
    if (err || !row) return;

    const state = row.state;
    if (state === 'awaiting_token') {
      handleToken(bot, msg);
    } else if (state === 'awaiting_account_id') {
      handleAccountId(bot, msg);
    } else if (state === 'awaiting_zone_id') {
      handleZoneId(bot, msg);
    } else if (state === 'awaiting_worker_name') {
      handleWorkerName(bot, msg);
    } else if (state.startsWith('awaiting_repo_url_')) {
      const workerName = state.split('_')[3];
      handleRepoUrl(bot, msg, workerName);
    }
  });
});

bot.on('polling_error', (error) => logger.error(error));

logger.info('Bot started...');
