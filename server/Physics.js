const CONSTANTS = require('../shared/constants');
const { TILE_SIZE, GRAVITY, MOVE_SPEED, JUMP_VELOCITY, MAX_FALL_SPEED, PLAYER_WIDTH, PLAYER_HEIGHT, TILES } = CONSTANTS;

class Physics {
  constructor(tiles) {
    this.tiles = tiles;
    this.rows = tiles.length;
    this.cols = tiles[0].length;
  }

  /**
   * Verilen tile koordinatındaki tile türünü döndürür
   */
  getTile(col, row) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      return TILES.SOLID; // Harita dışı = duvar
    }
    return this.tiles[row][col];
  }

  /**
   * Bir tile katı mı? (geçilemez)
   */
  isSolid(col, row) {
    return this.getTile(col, row) === TILES.SOLID;
  }

  /**
   * Oyuncunun AABB'si ile çakışan tüm tile'ları döndürür
   */
  getOverlappingTiles(x, y, width, height) {
    const left = Math.floor(x / TILE_SIZE);
    const right = Math.floor((x + width - 1) / TILE_SIZE);
    const top = Math.floor(y / TILE_SIZE);
    const bottom = Math.floor((y + height - 1) / TILE_SIZE);

    const tiles = [];
    for (let row = top; row <= bottom; row++) {
      for (let col = left; col <= right; col++) {
        tiles.push({ col, row, type: this.getTile(col, row) });
      }
    }
    return tiles;
  }

  /**
   * Bir oyuncuyu bir tick ilerlet
   * @param {Object} player - {x, y, vx, vy, grounded, alive, reachedDoor}
   * @param {Object} input - {left, right, jump}
   * @param {string} role - 'fire' veya 'water'
   * @returns {Object} Güncellenmiş oyuncu durumu ve olaylar
   */
  updatePlayer(player, input, role) {
    if (!player.alive) return player;

    // --- Input uygula ---
    if (input.left) {
      player.vx = -MOVE_SPEED;
    } else if (input.right) {
      player.vx = MOVE_SPEED;
    } else {
      player.vx = 0;
    }

    if (input.jump && player.grounded) {
      player.vy = JUMP_VELOCITY;
      player.grounded = false;
    }

    // --- Yerçekimi ---
    player.vy += GRAVITY;
    if (player.vy > MAX_FALL_SPEED) {
      player.vy = MAX_FALL_SPEED;
    }

    // --- X ekseni hareket + çarpışma ---
    player.x += player.vx;
    this.resolveCollisionX(player);

    // --- Y ekseni hareket + çarpışma ---
    player.grounded = false;
    player.y += player.vy;
    this.resolveCollisionY(player);

    // --- Tehlike ve kapı kontrolü ---
    const hazardResult = this.checkHazards(player, role);
    if (hazardResult.died) {
      player.alive = false;
    }
    player.reachedDoor = hazardResult.reachedDoor;

    return player;
  }

  /**
   * X ekseni çarpışma çözümü
   */
  resolveCollisionX(player) {
    const overlapping = this.getOverlappingTiles(player.x, player.y, PLAYER_WIDTH, PLAYER_HEIGHT);

    for (const tile of overlapping) {
      if (!this.isSolid(tile.col, tile.row)) continue;

      const tileLeft = tile.col * TILE_SIZE;
      const tileRight = tileLeft + TILE_SIZE;

      // Sağa hareket ediyorsa
      if (player.vx > 0) {
        player.x = tileLeft - PLAYER_WIDTH;
      }
      // Sola hareket ediyorsa
      else if (player.vx < 0) {
        player.x = tileRight;
      }
      player.vx = 0;
    }
  }

  /**
   * Y ekseni çarpışma çözümü
   */
  resolveCollisionY(player) {
    const overlapping = this.getOverlappingTiles(player.x, player.y, PLAYER_WIDTH, PLAYER_HEIGHT);

    for (const tile of overlapping) {
      if (!this.isSolid(tile.col, tile.row)) continue;

      const tileTop = tile.row * TILE_SIZE;
      const tileBottom = tileTop + TILE_SIZE;

      // Aşağı düşüyorsa (yere iniyor)
      if (player.vy > 0) {
        player.y = tileTop - PLAYER_HEIGHT;
        player.grounded = true;
      }
      // Yukarı zıplıyorsa (tavana çarpıyor)
      else if (player.vy < 0) {
        player.y = tileBottom;
      }
      player.vy = 0;
    }
  }

  /**
   * Tehlike ve kapı kontrolü
   * Ateş: su havuzunda ölür, ateş kapısına ulaşır
   * Su: ateş havuzunda ölür, su kapısına ulaşır
   * İkisi de: zehir havuzunda ölür
   */
  checkHazards(player, role) {
    const result = { died: false, reachedDoor: false };

    // Oyuncunun merkezinin biraz altından kontrol (ayak bölgesi)
    // Geniş bir alan kontrol ederek daha iyi algılama
    const overlapping = this.getOverlappingTiles(
      player.x + 2, player.y + 2,
      PLAYER_WIDTH - 4, PLAYER_HEIGHT - 4
    );

    for (const tile of overlapping) {
      switch (tile.type) {
        case TILES.WATER_POOL:
          if (role === 'fire') result.died = true;
          break;
        case TILES.FIRE_POOL:
          if (role === 'water') result.died = true;
          break;
        case TILES.POISON_POOL:
          result.died = true;
          break;
        case TILES.FIRE_DOOR:
          if (role === 'fire') result.reachedDoor = true;
          break;
        case TILES.WATER_DOOR:
          if (role === 'water') result.reachedDoor = true;
          break;
      }
    }

    return result;
  }
}

module.exports = Physics;
