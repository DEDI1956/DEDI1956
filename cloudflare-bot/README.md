# Cloudflare Workers Telegram Bot

Bot Telegram untuk mendeploy Cloudflare Workers secara otomatis dari repositori GitHub.

## Fitur

-   Login aman dengan kredensial Cloudflare.
-   Deploy worker dari repositori GitHub publik.
-   Melihat daftar worker yang sudah di-deploy.
-   Menghapus worker.
-   Multi-user, setiap pengguna memiliki sesi dan data sendiri.

## Instalasi

1.  **Clone repositori ini:**
    ```bash
    git clone <URL_REPOSITORI_INI>
    cd cloudflare-bot
    ```

2.  **Install dependensi:**
    ```bash
    npm install
    ```

## Konfigurasi

1.  **Jalankan script setup untuk membuat file `.env`:**
    ```bash
    node setup.js
    ```
    Masukkan token bot Telegram Anda saat diminta.

## Menjalankan Bot

### Mode Development
```bash
node bot.js
```

### Mode Production dengan PM2
1.  **Install PM2 secara global:**
    ```bash
    npm install pm2 -g
    ```

2.  **Jalankan bot dengan PM2:**
    ```bash
    pm2 start bot.js --name cloudflare-bot
    ```

3.  **Melihat log:**
    ```bash
    pm2 logs cloudflare-bot
    ```

4.  **Menghentikan bot:**
    ```bash
    pm2 stop cloudflare-bot
    ```

## Struktur Proyek
```
cloudflare-bot/
├── bot.js
├── config/
│   └── config.js
├── controllers/
│   ├── auth.js
│   ├── deploy.js
│   └── list.js
├── services/
│   ├── database.js
│   ├── logger.js
│   └── cloudflare.js
├── .env
├── package.json
└── README.md
```
