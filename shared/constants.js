// Paylaşılan sabitler - hem sunucu hem istemci tarafında kullanılır

const CONSTANTS = {
  // Tile & Harita
  TILE_SIZE: 32,
  MAP_COLS: 30,
  MAP_ROWS: 20,
  CANVAS_WIDTH: 960,   // 30 * 32
  CANVAS_HEIGHT: 640,  // 20 * 32

  // Fizik
  GRAVITY: 0.6,
  MOVE_SPEED: 4,
  JUMP_VELOCITY: -11,
  MAX_FALL_SPEED: 12,

  // Oyuncu boyutu (tile'dan biraz dar, hata payı için)
  PLAYER_WIDTH: 24,
  PLAYER_HEIGHT: 30,

  // Sunucu tick hızı
  TICK_RATE: 30,
  TICK_INTERVAL: 1000 / 30, // ~33.3ms

  // Ölüm sonrası yeniden doğuş bekleme süresi (tick cinsinden)
  RESPAWN_DELAY: 45, // ~1.5 saniye

  // Tile türleri
  TILES: {
    EMPTY: 0,
    SOLID: 1,
    WATER_POOL: 2,
    FIRE_POOL: 3,
    POISON_POOL: 4,
    FIRE_DOOR: 5,
    WATER_DOOR: 6,
    FIRE_SPAWN: 7,
    WATER_SPAWN: 8
  },

  // Oyun durumları
  GAME_STATUS: {
    WAITING: 'waiting',
    COUNTDOWN: 'countdown',
    PLAYING: 'playing',
    DEATH: 'death',
    WON: 'won'
  }
};

// Node.js ve tarayıcı uyumluluğu
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONSTANTS;
}
