const db = require('../services/database');
const logger = require('../services/logger');
const git = require('simple-git');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const { deployWorker } = require('../services/cloudflare');

const handleDeploy = (bot, msg) => {
  const chatId = msg.chat.id;
  db.run('UPDATE users SET state = ? WHERE telegram_id = ?', ['awaiting_worker_name'], (err) => {
    if (err) {
      logger.error('Database error:', err);
      return;
    }
    bot.sendMessage(chatId, 'Masukkan nama untuk Worker Anda:');
  });
};

const handleWorkerName = (bot, msg) => {
  const chatId = msg.chat.id;
  const workerName = msg.text;
  db.run('UPDATE users SET state = ? WHERE telegram_id = ?', [`awaiting_repo_url_${workerName}`, chatId], (err) => {
    if (err) {
      logger.error('Database error:', err);
      return;
    }
    bot.sendMessage(chatId, `Nama worker disimpan sebagai ${workerName}. Sekarang masukkan URL repositori GitHub:`);
  });
};

const handleRepoUrl = async (bot, msg, workerName) => {
  const chatId = msg.chat.id;
  const repoUrl = msg.text;
  bot.sendMessage(chatId, 'Memulai proses deployment...');
  const tempDir = path.join(__dirname, `../tmp/${chatId}_${Date.now()}`);

  try {
    await git().clone(repoUrl, tempDir);
    logger.info(`Cloned ${repoUrl} to ${tempDir}`);
    bot.sendMessage(chatId, 'Repositori berhasil di-clone.');

    const mainFile = findMainFile(tempDir);
    if (!mainFile) {
      throw new Error('File utama tidak ditemukan (index.js, app.js, main.ts, dll).');
    }

    if (mainFile.endsWith('.ts')) {
      bot.sendMessage(chatId, 'Membangun proyek TypeScript...');
      await buildProject(tempDir);
      logger.info(`Built TypeScript project in ${tempDir}`);
    }

    const builtFilePath = path.join(tempDir, 'dist', 'index.js'); // Assuming build output is in dist/index.js
    const scriptContent = await fs.readFile(builtFilePath, 'utf8');

    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE telegram_id = ?', [chatId], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    await deployWorker(user.api_token, user.account_id, workerName, scriptContent);

    db.run('INSERT INTO workers (telegram_id, worker_name, github_url, status) VALUES (?, ?, ?, ?)', [chatId, workerName, repoUrl, 'deployed']);
    db.run('UPDATE users SET state = ? WHERE telegram_id = ?', ['authenticated', chatId]);
    bot.sendMessage(chatId, `Worker ${workerName} berhasil di-deploy!`);
  } catch (error) {
    logger.error('Deployment error:', error);
    bot.sendMessage(chatId, `Deployment gagal: ${error.message}`);
  } finally {
    await fs.remove(tempDir);
    logger.info(`Cleaned up ${tempDir}`);
  }
};

const findMainFile = (dir) => {
    const commonMainFiles = ['index.js', 'app.js', 'main.js', 'worker.js', 'index.ts', 'app.ts', 'main.ts', 'worker.ts'];
    const files = fs.readdirSync(dir);
    return files.find(file => commonMainFiles.includes(file));
};

const buildProject = (dir) => {
  return new Promise((resolve, reject) => {
    const command = 'npm install && (npm run build || bun build)';
    exec(command, { cwd: dir }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Build failed: ${stderr}`));
      }
      resolve(stdout);
    });
  });
};

module.exports = {
  handleDeploy,
  handleWorkerName,
  handleRepoUrl,
};
