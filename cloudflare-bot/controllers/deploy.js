const db = require('../services/database');
const git = require('../services/git');
const wrangler = require('../services/wrangler');
const build = require('../services/build');
const cfApi = require('../services/cfApi');
const fs = require('fs');
const logger = require('../services/logger');

const handleDeployMessage = (bot, msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  db.get('SELECT state, worker_name FROM users WHERE telegram_id = ?', [chatId], (err, row) => {
    if (err) {
      logger.error(err.message);
      return;
    }

    if (row) {
      switch (row.state) {
        case 'awaiting_worker_name':
          db.run('UPDATE users SET worker_name = ?, state = ? WHERE telegram_id = ?', [text, 'awaiting_repo_url', chatId], (err) => {
            if (err) {
              logger.error(err.message);
              return;
            }
            bot.sendMessage(chatId, 'Nama worker disimpan. Sekarang masukkan URL repositori GitHub:');
          });
          break;
        case 'awaiting_repo_url':
          deployWorker(bot, chatId, text);
          break;
      }
    }
  });
};

const deployWorker = async (bot, chatId, repoUrl) => {
  bot.sendMessage(chatId, 'Memulai proses deployment...');
  const tempDir = `./tmp/${chatId}_${Date.now()}`;
  try {
    await git.clone(repoUrl, tempDir);
    bot.sendMessage(chatId, 'Repositori berhasil di-clone.');
    logger.info(`Cloned repository ${repoUrl} to ${tempDir}`);

    const mainFile = build.findMainFile(tempDir);
    if (!mainFile) {
      throw new Error('File utama (index.js, main.js, worker.js, atau file .ts) tidak ditemukan.');
    }

    if (mainFile.endsWith('.ts')) {
      bot.sendMessage(chatId, 'Membangun proyek TypeScript...');
      await build.buildTypeScript(tempDir);
      bot.sendMessage(chatId, 'Proyek TypeScript berhasil dibangun.');
      logger.info(`Built TypeScript project in ${tempDir}`);
    }

    db.get('SELECT cloudflare_account_id, worker_name FROM users WHERE telegram_id = ?', [chatId], async (err, row) => {
      if (err) {
        logger.error(err.message);
        return;
      }
      const wranglerConfig = wrangler.generateConfig(row.worker_name, mainFile, row.cloudflare_account_id);
      fs.writeFileSync(`${tempDir}/wrangler.toml`, wranglerConfig);

      bot.sendMessage(chatId, 'Mengunggah worker ke Cloudflare...');
      await cfApi.deployWorker(tempDir);
      bot.sendMessage(chatId, `Worker ${row.worker_name} berhasil di-deploy!`);
      logger.info(`Deployed worker ${row.worker_name} for user ${chatId}`);
    });
  } catch (error) {
    logger.error(`Deployment failed for user ${chatId}: ${error.message}`);
    bot.sendMessage(chatId, `Error: ${error.message}`);
  } finally {
    fs.rmdirSync(tempDir, { recursive: true });
    logger.info(`Cleaned up temporary directory ${tempDir}`);
  }
};

module.exports = {
  handleDeployMessage,
};
