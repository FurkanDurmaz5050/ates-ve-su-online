const CONSTANTS = require('../shared/constants');
const { TILE_SIZE, TILES, PLAYER_WIDTH, PLAYER_HEIGHT } = CONSTANTS;

class GameState {
  constructor(levelData) {
    this.tiles = levelData.tiles;
    this.players = {
      fire: null,
      water: null
    };

    // Doğuş noktalarını tile haritasından bul
    this.spawnPoints = this.findSpawnPoints();

    // Oyuncuları başlat
    this.resetPlayers();
  }

  /**
   * Tile haritasında doğuş noktalarını bul
   */
  findSpawnPoints() {
    const spawns = { fire: { x: 0, y: 0 }, water: { x: 0, y: 0 } };

    for (let row = 0; row < this.tiles.length; row++) {
      for (let col = 0; col < this.tiles[row].length; col++) {
        if (this.tiles[row][col] === TILES.FIRE_SPAWN) {
          spawns.fire = {
            x: col * TILE_SIZE + (TILE_SIZE - PLAYER_WIDTH) / 2,
            y: row * TILE_SIZE + (TILE_SIZE - PLAYER_HEIGHT)
          };
        }
        if (this.tiles[row][col] === TILES.WATER_SPAWN) {
          spawns.water = {
            x: col * TILE_SIZE + (TILE_SIZE - PLAYER_WIDTH) / 2,
            y: row * TILE_SIZE + (TILE_SIZE - PLAYER_HEIGHT)
          };
        }
      }
    }
    return spawns;
  }

  /**
   * Her iki oyuncuyu doğuş noktalarına sıfırla
   */
  resetPlayers() {
    this.players.fire = this.createPlayer(this.spawnPoints.fire);
    this.players.water = this.createPlayer(this.spawnPoints.water);
  }

  /**
   * Yeni oyuncu nesnesi oluştur
   */
  createPlayer(spawn) {
    return {
      x: spawn.x,
      y: spawn.y,
      vx: 0,
      vy: 0,
      alive: true,
      grounded: false,
      reachedDoor: false
    };
  }

  /**
   * İstemciye gönderilecek durum verisi
   */
  serialize() {
    return {
      players: {
        fire: { ...this.players.fire },
        water: { ...this.players.water }
      }
    };
  }
}

module.exports = GameState;
