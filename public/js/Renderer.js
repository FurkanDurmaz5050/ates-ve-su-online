/**
 * Renderer - Canvas üzerine oyun dünyasını çizer
 */
class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.tiles = null;

    // Tile renkleri
    this.tileColors = {
      [CONSTANTS.TILES.EMPTY]: null, // Şeffaf
      [CONSTANTS.TILES.SOLID]: '#4a4a5a',
      [CONSTANTS.TILES.WATER_POOL]: '#1e90ff',
      [CONSTANTS.TILES.FIRE_POOL]: '#ff4500',
      [CONSTANTS.TILES.POISON_POOL]: '#32cd32',
      [CONSTANTS.TILES.FIRE_DOOR]: '#ff6347',
      [CONSTANTS.TILES.WATER_DOOR]: '#4169e1',
      [CONSTANTS.TILES.FIRE_SPAWN]: null, // Render edilmez
      [CONSTANTS.TILES.WATER_SPAWN]: null  // Render edilmez
    };

    // Duvar deseni için gradient önbelleği
    this.wallPattern = null;
  }

  /**
   * Tile haritasını ayarla
   */
  setTiles(tiles) {
    this.tiles = tiles;
  }

  /**
   * Tüm ekranı çiz
   */
  render(gameState) {
    const { TILE_SIZE } = CONSTANTS;
    const ctx = this.ctx;

    // Arka planı temizle
    ctx.fillStyle = '#14142a';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Tile haritasını çiz
    if (this.tiles) {
      this.drawTiles();
    }

    // Oyuncuları çiz
    if (gameState && gameState.players) {
      this.drawPlayer(gameState.players.fire, 'fire');
      this.drawPlayer(gameState.players.water, 'water');
    }
  }

  /**
   * Tile haritasını çiz
   */
  drawTiles() {
    const { TILE_SIZE, TILES } = CONSTANTS;
    const ctx = this.ctx;

    for (let row = 0; row < this.tiles.length; row++) {
      for (let col = 0; col < this.tiles[row].length; col++) {
        const tile = this.tiles[row][col];
        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;

        switch (tile) {
          case TILES.SOLID:
            this.drawWall(x, y, TILE_SIZE);
            break;
          case TILES.WATER_POOL:
            this.drawPool(x, y, TILE_SIZE, '#1e90ff', '#104e8b', 'water');
            break;
          case TILES.FIRE_POOL:
            this.drawPool(x, y, TILE_SIZE, '#ff4500', '#8b2500', 'fire');
            break;
          case TILES.POISON_POOL:
            this.drawPool(x, y, TILE_SIZE, '#32cd32', '#006400', 'poison');
            break;
          case TILES.FIRE_DOOR:
            this.drawDoor(x, y, TILE_SIZE, '#ff4500', '#ff6347');
            break;
          case TILES.WATER_DOOR:
            this.drawDoor(x, y, TILE_SIZE, '#1e90ff', '#4169e1');
            break;
        }
      }
    }
  }

  /**
   * Duvar tile'ı çiz
   */
  drawWall(x, y, size) {
    const ctx = this.ctx;

    // Ana renk
    ctx.fillStyle = '#3a3a4a';
    ctx.fillRect(x, y, size, size);

    // Kenar çizgileri (taş duvar efekti)
    ctx.strokeStyle = '#2a2a3a';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);

    // İç çizgi (tuğla efekti)
    ctx.strokeStyle = '#4a4a5a';
    ctx.beginPath();
    ctx.moveTo(x, y + size / 2);
    ctx.lineTo(x + size, y + size / 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + size / 2, y);
    ctx.lineTo(x + size / 2, y + size / 2);
    ctx.stroke();
  }

  /**
   * Havuz tile'ı çiz (su/ateş/zehir)
   */
  drawPool(x, y, size, color, darkColor, type) {
    const ctx = this.ctx;

    // Arka plan
    ctx.fillStyle = darkColor;
    ctx.fillRect(x, y, size, size);

    // Dalgalı üst kısım
    const time = Date.now() / 500;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.7;

    ctx.beginPath();
    ctx.moveTo(x, y + 6);
    for (let i = 0; i <= size; i += 2) {
      const waveY = y + 4 + Math.sin(time + i * 0.3 + x * 0.1) * 3;
      ctx.lineTo(x + i, waveY);
    }
    ctx.lineTo(x + size, y + size);
    ctx.lineTo(x, y + size);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 1.0;

    // Parıltı
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(x + 4, y + 2, 8, 2);
    ctx.fillRect(x + 18, y + 5, 6, 2);
    ctx.globalAlpha = 1.0;
  }

  /**
   * Kapı çiz
   */
  drawDoor(x, y, size, color, lightColor) {
    const ctx = this.ctx;
    const time = Date.now() / 1000;

    // Parıltı efekti
    const glowAlpha = 0.2 + Math.sin(time * 2) * 0.1;
    ctx.fillStyle = color;
    ctx.globalAlpha = glowAlpha;
    ctx.fillRect(x - 2, y - 2, size + 4, size + 4);
    ctx.globalAlpha = 1.0;

    // Kapı çerçevesi
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(x + 2, y + 2, size - 4, size - 4);

    // Kapı rengi
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.6;
    ctx.fillRect(x + 4, y + 4, size - 8, size - 8);
    ctx.globalAlpha = 1.0;

    // Kapı kolu
    ctx.fillStyle = lightColor;
    ctx.fillRect(x + size - 12, y + size / 2 - 2, 4, 4);

    // Kenar çizgisi
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 3, y + 3, size - 6, size - 6);
  }

  /**
   * Oyuncu karakterini çiz
   */
  drawPlayer(player, role) {
    if (!player) return;

    const ctx = this.ctx;
    const { PLAYER_WIDTH, PLAYER_HEIGHT } = CONSTANTS;
    const x = player.x;
    const y = player.y;

    // Ölü ise yarı saydam
    if (!player.alive) {
      ctx.globalAlpha = 0.3;
    }

    if (role === 'fire') {
      this.drawFireCharacter(x, y, PLAYER_WIDTH, PLAYER_HEIGHT);
    } else {
      this.drawWaterCharacter(x, y, PLAYER_WIDTH, PLAYER_HEIGHT);
    }

    // Kapıya ulaştıysa yıldız efekti
    if (player.reachedDoor) {
      ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 200) * 0.3;
      ctx.fillStyle = role === 'fire' ? '#ffcc00' : '#00ccff';
      ctx.beginPath();
      ctx.arc(x + PLAYER_WIDTH / 2, y - 5, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1.0;
  }

  /**
   * Ateş karakteri
   */
  drawFireCharacter(x, y, w, h) {
    const ctx = this.ctx;
    const time = Date.now() / 200;

    // Gövde
    const gradient = ctx.createLinearGradient(x, y, x, y + h);
    gradient.addColorStop(0, '#ff6600');
    gradient.addColorStop(0.5, '#ff4400');
    gradient.addColorStop(1, '#cc2200');
    ctx.fillStyle = gradient;

    // Yuvarlak köşeli dikdörtgen
    this.roundRect(x, y + 4, w, h - 4, 4);
    ctx.fill();

    // Alev efekti (kafa üstü)
    ctx.fillStyle = '#ffaa00';
    for (let i = 0; i < 3; i++) {
      const flameX = x + 4 + i * 8;
      const flameH = 6 + Math.sin(time + i * 2) * 4;
      ctx.beginPath();
      ctx.moveTo(flameX, y + 4);
      ctx.lineTo(flameX + 4, y - flameH);
      ctx.lineTo(flameX + 8, y + 4);
      ctx.fill();
    }

    // Gözler
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + 5, y + 12, 5, 5);
    ctx.fillRect(x + 14, y + 12, 5, 5);

    // Göz bebekleri
    ctx.fillStyle = '#220000';
    ctx.fillRect(x + 7, y + 13, 3, 3);
    ctx.fillRect(x + 16, y + 13, 3, 3);
  }

  /**
   * Su karakteri
   */
  drawWaterCharacter(x, y, w, h) {
    const ctx = this.ctx;
    const time = Date.now() / 300;

    // Gövde
    const gradient = ctx.createLinearGradient(x, y, x, y + h);
    gradient.addColorStop(0, '#4488ff');
    gradient.addColorStop(0.5, '#2266dd');
    gradient.addColorStop(1, '#1144aa');
    ctx.fillStyle = gradient;

    // Yuvarlak köşeli dikdörtgen
    this.roundRect(x, y + 2, w, h - 2, 6);
    ctx.fill();

    // Damla efekti (kafa üstü)
    ctx.fillStyle = '#66aaff';
    const dropY = y - 2 + Math.sin(time) * 3;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, dropY - 6);
    ctx.quadraticCurveTo(x + w / 2 + 6, dropY, x + w / 2, dropY + 4);
    ctx.quadraticCurveTo(x + w / 2 - 6, dropY, x + w / 2, dropY - 6);
    ctx.fill();

    // Gözler
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + 5, y + 10, 5, 5);
    ctx.fillRect(x + 14, y + 10, 5, 5);

    // Göz bebekleri
    ctx.fillStyle = '#000044';
    ctx.fillRect(x + 7, y + 11, 3, 3);
    ctx.fillRect(x + 16, y + 11, 3, 3);

    // Gülümseme
    ctx.strokeStyle = '#000044';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + 20, 5, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
  }

  /**
   * Yuvarlak köşeli dikdörtgen çiz
   */
  roundRect(x, y, w, h, r) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /**
   * Geri sayım numarasını çiz (canvas üstüne)
   */
  drawCountdown(count) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#ff8c00';
    ctx.font = 'bold 120px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ff4500';
    ctx.shadowBlur = 30;
    ctx.fillText(count, this.canvas.width / 2, this.canvas.height / 2);
    ctx.shadowBlur = 0;
  }

  /**
   * Mesaj overlay çiz
   */
  drawMessage(title, subtitle, color = '#fff') {
    const ctx = this.ctx;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = color;
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.fillText(title, this.canvas.width / 2, this.canvas.height / 2 - 20);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ccc';
    ctx.font = '20px sans-serif';
    ctx.fillText(subtitle, this.canvas.width / 2, this.canvas.height / 2 + 30);
  }
}
