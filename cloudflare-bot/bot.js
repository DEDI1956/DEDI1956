const TelegramBot = require('node-telegram-bot-api');
const logger = require('./logger');
let db;

try {
  db = require('./database');
} catch (err) {
  logger.error('Failed to load database module.', err);
  // Bot can still run, but database functionality will be disabled.
}

// Replace with your bot token
const token = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN';

const bot = new TelegramBot(token, {
  polling: {
    interval: 300,
    autoStart: true,
    params: {
      timeout: 10
    }
  }
});

bot.on('polling_error', (error) => {
  logger.error(`Polling error: ${error.code} - ${error.message}`);
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  if (db) {
    const query = 'INSERT OR IGNORE INTO users (telegram_id, state) VALUES (?, ?)';
    db.run(query, [chatId, 'awaiting_agreement'], (err) => {
      if (err) {
        logger.error('Database error on /start', err);
        bot.sendMessage(chatId, 'Sorry, there was a database error.');
        return;
      }
      bot.sendMessage(chatId, 'Welcome! Please agree to the terms.');
    });
  } else {
    bot.sendMessage(chatId, 'Welcome! Database is currently unavailable.');
  }
});


bot.on('message', (msg) => {
  // This is a simple echo bot for demonstration
  const chatId = msg.chat.id;
  if(msg.text.toLowerCase() !== '/start'){
    bot.sendMessage(chatId, `Echo: ${msg.text}`);
  }
});

logger.info('Bot server started...');

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info("Caught interrupt signal, shutting down gracefully.");
  bot.stopPolling().then(() => {
    if (db) {
      db.close((err) => {
        if (err) {
          logger.error(err.message);
        }
        logger.info('Database connection closed.');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
});
