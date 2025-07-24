const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Masukkan token bot Telegram Anda: ', (token) => {
  fs.writeFileSync('.env', `TELEGRAM_BOT_TOKEN=${token}\n`);
  console.log('.env file berhasil dibuat!');
  rl.close();
});
