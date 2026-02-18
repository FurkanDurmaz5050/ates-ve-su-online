const { v4: uuidv4 } = require('uuid');
const CONSTANTS = require('../shared/constants');
const GameState = require('./GameState');
const Physics = require('./Physics');
const level1 = require('./levels/level1.json');

const { TICK_INTERVAL, RESPAWN_DELAY, GAME_STATUS } = CONSTANTS;

class GameRoom {
  constructor(io, player1Socket) {
    this.id = uuidv4();
    this.io = io;
    this.status = GAME_STATUS.WAITING;
    this.tick = 0;
    this.respawnTimer = 0;
    this.gameLoop = null;

    // Oyuncular
    this.sockets = {
      fire: player1Socket,
      water: null
    };

    // Inputlar
    this.inputs = {
      fire: { left: false, right: false, jump: false },
      water: { left: false, right: false, jump: false }
    };

    // Oyun durumu ve fizik
    this.gameState = new GameState(level1);
    this.physics = new Physics(level1.tiles);

    // İlk oyuncuyu odaya ekle
    player1Socket.join(this.id);
    player1Socket.gameRoom = this;
    player1Socket.playerRole = 'fire';

    // İlk oyuncuya rolünü bildir
    player1Socket.emit('role-assigned', {
      role: 'fire',
      roomId: this.id,
      message: 'Ateş karakteri olarak atandınız. İkinci oyuncu bekleniyor...'
    });

    // İlk oyuncunun input olaylarını dinle
    this.setupInputListener(player1Socket, 'fire');

    console.log(`[Oda ${this.id.slice(0, 8)}] Oluşturuldu. Ateş oyuncusu bekleniyor.`);
  }

  /**
   * İkinci oyuncuyu odaya ekle ve oyunu başlat
   */
  addPlayer2(socket) {
    this.sockets.water = socket;
    socket.join(this.id);
    socket.gameRoom = this;
    socket.playerRole = 'water';

    // İkinci oyuncuya rolünü bildir
    socket.emit('role-assigned', {
      role: 'water',
      roomId: this.id,
      message: 'Su karakteri olarak atandınız. Oyun başlıyor!'
    });

    // İkinci oyuncunun input olaylarını dinle
    this.setupInputListener(socket, 'water');

    console.log(`[Oda ${this.id.slice(0, 8)}] Su oyuncusu katıldı. Oyun başlıyor.`);

    // Geri sayım başlat
    this.startCountdown();
  }

  /**
   * Oyuncu input olaylarını dinle
   */
  setupInputListener(socket, role) {
    socket.on('player-input', (input) => {
      if (this.status !== GAME_STATUS.PLAYING) return;
      this.inputs[role] = {
        left: !!input.left,
        right: !!input.right,
        jump: !!input.jump
      };
    });
  }

  /**
   * Geri sayım başlat (3-2-1)
   */
  startCountdown() {
    this.status = GAME_STATUS.COUNTDOWN;
    let count = 3;

    // Harita verisini her iki oyuncuya gönder
    this.io.to(this.id).emit('game-init', {
      tiles: level1.tiles,
      levelName: level1.name
    });

    const countdownInterval = setInterval(() => {
      this.io.to(this.id).emit('countdown', { count });
      count--;

      if (count < 0) {
        clearInterval(countdownInterval);
        this.startGame();
      }
    }, 1000);
  }

  /**
   * Oyunu başlat
   */
  startGame() {
    this.status = GAME_STATUS.PLAYING;
    this.tick = 0;
    this.gameState.resetPlayers();

    this.io.to(this.id).emit('game-start');

    // Oyun döngüsünü başlat (30 Hz)
    this.gameLoop = setInterval(() => {
      this.update();
    }, TICK_INTERVAL);

    console.log(`[Oda ${this.id.slice(0, 8)}] Oyun başladı!`);
  }

  /**
   * Her tick'te çağrılır - ana oyun döngüsü
   */
  update() {
    this.tick++;

    if (this.status === GAME_STATUS.DEATH) {
      // Ölüm sonrası yeniden doğuş bekleme
      this.respawnTimer--;
      if (this.respawnTimer <= 0) {
        this.gameState.resetPlayers();
        this.status = GAME_STATUS.PLAYING;
        this.io.to(this.id).emit('respawn');
      }
      this.broadcastState();
      return;
    }

    if (this.status !== GAME_STATUS.PLAYING) return;

    // Fiziği güncelle
    this.physics.updatePlayer(this.gameState.players.fire, this.inputs.fire, 'fire');
    this.physics.updatePlayer(this.gameState.players.water, this.inputs.water, 'water');

    // Ölüm kontrolü
    if (!this.gameState.players.fire.alive || !this.gameState.players.water.alive) {
      this.status = GAME_STATUS.DEATH;
      this.respawnTimer = RESPAWN_DELAY;
      this.io.to(this.id).emit('player-died', {
        fire: !this.gameState.players.fire.alive,
        water: !this.gameState.players.water.alive
      });
    }

    // Kazanma kontrolü - her iki oyuncu da kapısına ulaştı mı?
    if (this.gameState.players.fire.reachedDoor && this.gameState.players.water.reachedDoor) {
      this.status = GAME_STATUS.WON;
      this.io.to(this.id).emit('level-complete', {
        ticks: this.tick
      });
      this.stopGameLoop();
      console.log(`[Oda ${this.id.slice(0, 8)}] Level tamamlandı! (${this.tick} tick)`);
    }

    // Durumu yayınla
    this.broadcastState();
  }

  /**
   * Oyun durumunu her iki oyuncuya yayınla
   */
  broadcastState() {
    const state = this.gameState.serialize();
    state.tick = this.tick;
    state.status = this.status;
    this.io.to(this.id).emit('game-state', state);
  }

  /**
   * Oyun döngüsünü durdur
   */
  stopGameLoop() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }
  }

  /**
   * Oyuncunun bağlantısı koptuğunda
   */
  handleDisconnect(socket) {
    const role = socket.playerRole;
    console.log(`[Oda ${this.id.slice(0, 8)}] ${role} oyuncusu ayrıldı.`);

    this.stopGameLoop();

    // Diğer oyuncuyu bilgilendir
    const otherRole = role === 'fire' ? 'water' : 'fire';
    const otherSocket = this.sockets[otherRole];

    if (otherSocket && otherSocket.connected) {
      otherSocket.emit('partner-disconnected', {
        message: 'Takım arkadaşınız ayrıldı. Lobiye dönüyorsunuz...'
      });
      otherSocket.leave(this.id);
      otherSocket.gameRoom = null;
      otherSocket.playerRole = null;
    }

    this.status = 'destroyed';
  }

  /**
   * Yeniden oynama isteği
   */
  handleReplay() {
    this.gameState.resetPlayers();
    this.tick = 0;
    this.respawnTimer = 0;
    this.inputs.fire = { left: false, right: false, jump: false };
    this.inputs.water = { left: false, right: false, jump: false };
    this.startCountdown();
  }
}

module.exports = GameRoom;
