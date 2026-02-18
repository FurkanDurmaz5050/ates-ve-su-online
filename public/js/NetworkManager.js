/**
 * NetworkManager - Socket.IO ile sunucu iletişimini yönetir
 */
class NetworkManager {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.role = null;
    this.roomId = null;

    // Olay dinleyicileri
    this.callbacks = {};

    // Son input durumu (gereksiz paket göndermemek için)
    this.lastSentInput = null;
  }

  /**
   * Sunucuya bağlan
   */
  connect() {
    this.socket = io();

    this.socket.on('connect', () => {
      this.connected = true;
      console.log('[Ağ] Sunucuya bağlandı:', this.socket.id);
      this._emit('connected');
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      console.log('[Ağ] Bağlantı koptu.');
      this._emit('disconnected');
    });

    // Bekleme durumu
    this.socket.on('waiting', (data) => {
      this._emit('waiting', data);
    });

    // Rol atandı
    this.socket.on('role-assigned', (data) => {
      this.role = data.role;
      this.roomId = data.roomId;
      console.log(`[Ağ] Rol: ${data.role}, Oda: ${data.roomId.slice(0, 8)}`);
      this._emit('role-assigned', data);
    });

    // Oyun başlatma verisi (harita)
    this.socket.on('game-init', (data) => {
      this._emit('game-init', data);
    });

    // Geri sayım
    this.socket.on('countdown', (data) => {
      this._emit('countdown', data);
    });

    // Oyun başladı
    this.socket.on('game-start', () => {
      this._emit('game-start');
    });

    // Oyun durumu güncellemesi (her tick)
    this.socket.on('game-state', (state) => {
      this._emit('game-state', state);
    });

    // Oyuncu öldü
    this.socket.on('player-died', (data) => {
      this._emit('player-died', data);
    });

    // Yeniden doğuş
    this.socket.on('respawn', () => {
      this._emit('respawn');
    });

    // Level tamamlandı
    this.socket.on('level-complete', (data) => {
      this._emit('level-complete', data);
    });

    // Takım arkadaşı ayrıldı
    this.socket.on('partner-disconnected', (data) => {
      this._emit('partner-disconnected', data);
    });

    // Hata
    this.socket.on('error-message', (data) => {
      this._emit('error-message', data);
    });
  }

  /**
   * Oyun arama isteği gönder
   */
  findGame() {
    this.socket.emit('find-game');
  }

  /**
   * Input gönder (yalnızca değişiklik varsa)
   */
  sendInput(input) {
    if (!this.connected) return;

    // Aynı inputu tekrar gönderme
    if (this.lastSentInput &&
        this.lastSentInput.left === input.left &&
        this.lastSentInput.right === input.right &&
        this.lastSentInput.jump === input.jump) {
      return;
    }

    this.lastSentInput = { ...input };
    this.socket.emit('player-input', input);
  }

  /**
   * Yeniden oynama isteği
   */
  requestReplay() {
    this.socket.emit('request-replay');
  }

  /**
   * Olay dinleyicisi ekle
   */
  on(event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
  }

  /**
   * İç olay yayınla
   */
  _emit(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(cb => cb(data));
    }
  }

  /**
   * Temizlik
   */
  destroy() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  disconnect() {
    this.destroy();
  }
}
