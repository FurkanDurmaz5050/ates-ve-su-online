# 🔥💧 Ateş ve Su Online

İki farklı bilgisayardan internet üzerinden oynanan çok oyunculu Ateş ve Su platform oyunu.

## 🎮 Oyna

**[▶️ Canlı Oyun Linki](#)** *(deploy sonrası güncellenecek)*

## 🚀 Hızlı Deploy (Ücretsiz)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/FurkanDurmaz5050/ates-ve-su-online)

## 📋 Özellikler

- 🌐 **Online Multiplayer** — İki farklı bilgisayardan internet üzerinden oynayın
- 🔥 **Ateş Karakteri** — Su havuzlarından kaçmalı, ateş kapısına ulaşmalı
- 💧 **Su Karakteri** — Ateş havuzlarından kaçmalı, su kapısına ulaşmalı
- ☠️ **Zehirli Havuzlar** — Her iki karakter için de ölümcül
- 🚪 **Kooperatif** — Her iki oyuncu da kapısına ulaşınca level tamamlanır
- ⚡ **Gerçek Zamanlı** — 30 Hz sunucu tick rate ile senkronize fizik
- 🎯 **Otomatik Eşleşme** — Oyun ara butonuna bas ve rakibini bekle

## 🎮 Kontroller

| Tuş | Aksiyon |
|-----|---------|
| ⬆️ / W | Zıpla |
| ⬅️ / A | Sola git |
| ➡️ / D | Sağa git |

## 🛠️ Yerel Kurulum

```bash
# Klonla
git clone https://github.com/FurkanDurmaz5050/ates-ve-su-online.git
cd ates-ve-su-online

# Bağımlılıkları kur
npm install

# Sunucuyu başlat
npm start
```

Tarayıcıda `http://localhost:3000` adresine git.

## 🏗️ Mimari

- **Sunucu:** Node.js + Express + Socket.IO
- **İstemci:** Vanilla JS + HTML5 Canvas
- **Fizik:** Server-authoritative tile-based AABB çarpışma sistemi
- **Ağ:** Socket.IO ile gerçek zamanlı input gönderme + durum yayını

## 📁 Proje Yapısı

```
├── server/
│   ├── index.js          # Express + Socket.IO giriş noktası
│   ├── GameRoom.js       # Oda yönetimi ve oyun döngüsü
│   ├── GameState.js      # Oyuncu durumları
│   ├── Physics.js        # Fizik motoru
│   └── levels/
│       └── level1.json   # Tile haritası
├── public/
│   ├── index.html        # Lobi + oyun sayfası
│   ├── css/style.css     # Stiller
│   └── js/               # İstemci JS dosyaları
├── shared/
│   └── constants.js      # Ortak sabitler
└── render.yaml           # Render.com deploy yapılandırması
```

## 📄 Lisans

MIT
