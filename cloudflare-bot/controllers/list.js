const db = require('../services/database');
const logger = require('../services/logger');
const { listWorkers, deleteWorker } = require('../services/cloudflare');

const handleListWorkers = async (bot, msg) => {
  const chatId = msg.chat.id;
  try {
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE telegram_id = ?', [chatId], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    const workers = await listWorkers(user.api_token, user.account_id);
    if (workers.length === 0) {
      bot.sendMessage(chatId, 'Anda tidak memiliki worker yang di-deploy.');
      return;
    }
    const inline_keyboard = workers.map(worker => ([
      { text: worker.id, callback_data: `worker_${worker.id}` },
      { text: '🗑️ Hapus', callback_data: `delete_${worker.id}` }
    ]));
    const opts = { reply_markup: { inline_keyboard } };
    bot.sendMessage(chatId, 'Berikut adalah daftar worker Anda:', opts);
  } catch (error) {
    logger.error('Error listing workers:', error);
    bot.sendMessage(chatId, 'Gagal mengambil daftar worker.');
  }
};

const handleDeleteWorker = async (bot, msg, workerName) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `Apakah Anda yakin ingin menghapus worker ${workerName}?`, {
    reply_markup: {
      inline_keyboard: [[
        { text: '✅ Ya', callback_data: `confirm_delete_${workerName}` },
        { text: '❌ Tidak', callback_data: 'cancel_delete' }
      ]]
    }
  });
};

const handleConfirmDelete = async (bot, msg, workerName) => {
  const chatId = msg.chat.id;
  try {
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE telegram_id = ?', [chatId], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    await deleteWorker(user.api_token, user.account_id, workerName);
    db.run('UPDATE workers SET status = ? WHERE telegram_id = ? AND worker_name = ?', ['deleted', chatId, workerName]);
    bot.editMessageText(`Worker ${workerName} berhasil dihapus.`, {
      chat_id: chatId,
      message_id: msg.message_id,
    });
  } catch (error) {
    logger.error('Error deleting worker:', error);
    bot.sendMessage(chatId, 'Gagal menghapus worker.');
  }
};

module.exports = {
  handleListWorkers,
  handleDeleteWorker,
  handleConfirmDelete,
};
