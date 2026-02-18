const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const GameRoom = require('./GameRoom');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;

// Statik dosyaları sun
app.use(express.static(path.join(__dirname, '..', 'public')));

// shared klasörünü istemci tarafından erişilebilir yap
app.use('/shared', express.static(path.join(__dirname, '..', 'shared')));

// --- Eşleşme sistemi ---
let waitingPlayer = null;   // Eşleşme bekleyen oyuncu
const rooms = new Map();    // Aktif odalar: roomId -> GameRoom

io.on('connection', (socket) => {
  console.log(`[Bağlantı] ${socket.id} bağlandı.`);

  // Oyuncu oyun arama isteği
  socket.on('find-game', () => {
    console.log(`[Eşleşme] ${socket.id} oyun arıyor...`);

    // Eğer zaten bir oyundaysa, önce çık
    if (socket.gameRoom) {
      socket.emit('error-message', { message: 'Zaten bir oyundasınız.' });
      return;
    }

    // Bekleyen oyuncu var mı?
    if (waitingPlayer && waitingPlayer.connected && waitingPlayer.id !== socket.id) {
      // Eşleşme bulundu! Oda oluştur
      const room = waitingPlayer.gameRoom;
      room.addPlayer2(socket);
      rooms.set(room.id, room);
      waitingPlayer = null;

      console.log(`[Eşleşme] Eşleşme bulundu: ${room.sockets.fire.id} (Ateş) vs ${socket.id} (Su)`);
    } else {
      // Yeni oda oluştur ve bekle
      const room = new GameRoom(io, socket);
      rooms.set(room.id, room);
      waitingPlayer = socket;
      socket.emit('waiting', { message: 'Oyuncu aranıyor...' });
    }
  });

  // Yeniden oynama isteği
  socket.on('request-replay', () => {
    if (socket.gameRoom && socket.gameRoom.status === 'won') {
      socket.gameRoom.handleReplay();
    }
  });

  // Bağlantı kopması
  socket.on('disconnect', () => {
    console.log(`[Bağlantı] ${socket.id} ayrıldı.`);

    // Bekleyen oyuncuysa kuyruğu temizle
    if (waitingPlayer && waitingPlayer.id === socket.id) {
      // Odasını sil
      if (socket.gameRoom) {
        rooms.delete(socket.gameRoom.id);
      }
      waitingPlayer = null;
    }

    // Bir oyundaysa odayı yönet
    if (socket.gameRoom && socket.gameRoom.status !== 'destroyed') {
      const roomId = socket.gameRoom.id;
      socket.gameRoom.handleDisconnect(socket);
      rooms.delete(roomId);
    }
  });
});

// Sunucuyu başlat
server.listen(PORT, () => {
  console.log(`\n🔥💧 Ateş ve Su Online Sunucusu`);
  console.log(`   Adres: http://localhost:${PORT}`);
  console.log(`   Port: ${PORT}\n`);
});
