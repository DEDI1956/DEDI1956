const db = require('../services/database');
const cfApi = require('../services/cfApi');
const logger = require('../services/logger');

const handleList = async (bot, chatId) => {
  try {
    db.get('SELECT cloudflare_api_token, cloudflare_account_id FROM users WHERE telegram_id = ?', [chatId], async (err, row) => {
      if (err) {
        logger.error(err.message);
        return;
      }
      const workers = await cfApi.listWorkers(row.cloudflare_api_token, row.cloudflare_account_id);
      if (workers.length === 0) {
        bot.sendMessage(chatId, 'Anda tidak memiliki worker yang di-deploy.');
        return;
      }
      const workerList = workers.map((worker) => `- ${worker.id}`).join('\n');
      bot.sendMessage(chatId, `Berikut adalah daftar worker Anda:\n${workerList}`);
    });
  } catch (error) {
    logger.error(`Failed to list workers for user ${chatId}: ${error.message}`);
    bot.sendMessage(chatId, `Error: ${error.message}`);
  }
};

const handleDelete = async (bot, chatId, workerName) => {
  try {
    db.get('SELECT cloudflare_api_token, cloudflare_account_id FROM users WHERE telegram_id = ?', [chatId], async (err, row) => {
      if (err) {
        logger.error(err.message);
        return;
      }
      await cfApi.deleteWorker(row.cloudflare_api_token, row.cloudflare_account_id, workerName);
      bot.sendMessage(chatId, `Worker ${workerName} berhasil dihapus.`);
      logger.info(`Deleted worker ${workerName} for user ${chatId}`);
    });
  } catch (error) {
    logger.error(`Failed to delete worker ${workerName} for user ${chatId}: ${error.message}`);
    bot.sendMessage(chatId, `Error: ${error.message}`);
  }
};

module.exports = {
  handleList,
  handleDelete,
};
