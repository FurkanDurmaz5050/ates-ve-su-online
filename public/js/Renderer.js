/**
 * Renderer - Klasik Ateş ve Su (Fireboy & Watergirl) görünümüne sadık Canvas renderer
 * Tapınak teması: taş duvarlar, lav/su/asit havuzları, elmas kapılar
 */
class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.tiles = null;
    this.bgCanvas = null; // Arka plan önbelleği

    // Animasyon zamanlayıcı
    this.animTime = 0;
  }

  /**
   * Tile haritasını ayarla ve arka planı önbelleğe al
   */
  setTiles(tiles) {
    this.tiles = tiles;
    this.prerenderBackground();
  }

  /**
   * Arka planı offscreen canvas'a çiz (performans için)
   */
  prerenderBackground() {
    this.bgCanvas = document.createElement('canvas');
    this.bgCanvas.width = this.canvas.width;
    this.bgCanvas.height = this.canvas.height;
    const ctx = this.bgCanvas.getContext('2d');

    const { TILE_SIZE, TILES } = CONSTANTS;

    // Arka plan - koyu tapınak rengi
    ctx.fillStyle = '#1a0f0a';
    ctx.fillRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);

    // Hafif doku (arka plan noktaları)
    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = `rgba(255,200,100,${Math.random() * 0.02})`;
      ctx.fillRect(
        Math.random() * this.bgCanvas.width,
        Math.random() * this.bgCanvas.height,
        Math.random() * 3 + 1,
        Math.random() * 3 + 1
      );
    }

    // Statik tile'ları çiz (duvarlar)
    for (let row = 0; row < this.tiles.length; row++) {
      for (let col = 0; col < this.tiles[row].length; col++) {
        const tile = this.tiles[row][col];
        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;

        if (tile === TILES.SOLID) {
          this.drawWallTile(ctx, x, y, TILE_SIZE, row, col);
        }
      }
    }
  }

  /**
   * Taş duvar tile'ı çiz - klasik tapınak bloğu
   */
  drawWallTile(ctx, x, y, size, row, col) {
    // Kenar mı iç mi?
    const isEdge = row === 0 || row === this.tiles.length - 1 ||
                   col === 0 || col === this.tiles[0].length - 1;

    // Ana taş rengi
    const baseR = isEdge ? 70 : 85;
    const baseG = isEdge ? 55 : 70;
    const baseB = isEdge ? 45 : 55;

    // Hafif rastgele varyasyon
    const seed = (row * 31 + col * 17) % 20;
    const r = baseR + seed - 10;
    const g = baseG + seed - 10;
    const b = baseB + seed - 10;

    // Ana blok
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(x, y, size, size);

    // Üst kenar vurgusu (açık)
    ctx.fillStyle = `rgba(255,220,180,0.15)`;
    ctx.fillRect(x, y, size, 2);
    ctx.fillRect(x, y, 2, size);

    // Alt/sağ kenar gölge (koyu)
    ctx.fillStyle = `rgba(0,0,0,0.3)`;
    ctx.fillRect(x, y + size - 2, size, 2);
    ctx.fillRect(x + size - 2, y, 2, size);

    // Tuğla çizgileri
    ctx.strokeStyle = `rgba(0,0,0,0.2)`;
    ctx.lineWidth = 1;

    // Yatay çizgi
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.5);
    ctx.lineTo(x + size, y + size * 0.5);
    ctx.stroke();

    // Dikey çizgi (tuğla offset)
    const offset = (row % 2 === 0) ? size * 0.5 : 0;
    if (offset > 0) {
      ctx.beginPath();
      ctx.moveTo(x + offset, y);
      ctx.lineTo(x + offset, y + size * 0.5);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(x + (offset > 0 ? 0 : size * 0.5), y + size * 0.5);
    ctx.lineTo(x + (offset > 0 ? 0 : size * 0.5), y + size);
    ctx.stroke();

    // Çatlak/nokta detayları
    if (seed > 14) {
      ctx.fillStyle = `rgba(0,0,0,0.15)`;
      ctx.fillRect(x + 8, y + 8, 3, 2);
      ctx.fillRect(x + 18, y + 22, 2, 3);
    }
  }

  /**
   * Tüm ekranı çiz
   */
  render(gameState) {
    const ctx = this.ctx;
    this.animTime = Date.now();

    // Önbelleklenmiş arka planı çiz
    if (this.bgCanvas) {
      ctx.drawImage(this.bgCanvas, 0, 0);
    } else {
      ctx.fillStyle = '#1a0f0a';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Animasyonlu tile'ları çiz (havuzlar, kapılar)
    if (this.tiles) {
      this.drawAnimatedTiles();
    }

    // Oyuncuları çiz
    if (gameState && gameState.players) {
      this.drawPlayer(gameState.players.fire, 'fire');
      this.drawPlayer(gameState.players.water, 'water');
    }
  }

  /**
   * Animasyonlu tile'lar (havuzlar + kapılar)
   */
  drawAnimatedTiles() {
    const { TILE_SIZE, TILES } = CONSTANTS;
    const ctx = this.ctx;

    for (let row = 0; row < this.tiles.length; row++) {
      for (let col = 0; col < this.tiles[row].length; col++) {
        const tile = this.tiles[row][col];
        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;

        switch (tile) {
          case TILES.WATER_POOL:
            this.drawWaterPool(x, y, TILE_SIZE);
            break;
          case TILES.FIRE_POOL:
            this.drawLavaPool(x, y, TILE_SIZE);
            break;
          case TILES.POISON_POOL:
            this.drawAcidPool(x, y, TILE_SIZE);
            break;
          case TILES.FIRE_DOOR:
            this.drawDoor(x, y, TILE_SIZE, 'fire');
            break;
          case TILES.WATER_DOOR:
            this.drawDoor(x, y, TILE_SIZE, 'water');
            break;
        }
      }
    }
  }

  /**
   * Lav havuzu (ateş havuzu) - klasik turuncu/kırmızı lav
   */
  drawLavaPool(x, y, size) {
    const ctx = this.ctx;
    const t = this.animTime / 400;

    // Koyu lav arka planı
    ctx.fillStyle = '#8b1a00';
    ctx.fillRect(x, y, size, size);

    // Orta katman
    ctx.fillStyle = '#cc3300';
    ctx.fillRect(x, y + 4, size, size - 4);

    // Dalgalı lav yüzeyi
    ctx.fillStyle = '#ff6600';
    ctx.beginPath();
    ctx.moveTo(x, y + 8);
    for (let i = 0; i <= size; i += 1) {
      const waveY = y + 5 + Math.sin(t + i * 0.25 + col_hash(x)) * 3
                       + Math.sin(t * 1.5 + i * 0.15) * 2;
      ctx.lineTo(x + i, waveY);
    }
    ctx.lineTo(x + size, y + size);
    ctx.lineTo(x, y + size);
    ctx.closePath();
    ctx.fill();

    // Parlak lav parçacıkları
    ctx.fillStyle = '#ffaa00';
    ctx.globalAlpha = 0.6 + Math.sin(t * 3) * 0.3;
    const p1x = x + 6 + Math.sin(t * 2) * 3;
    const p1y = y + 10 + Math.sin(t * 1.7) * 2;
    ctx.fillRect(p1x, p1y, 3, 2);
    const p2x = x + 18 + Math.sin(t * 2.5 + 1) * 4;
    const p2y = y + 15 + Math.sin(t * 1.3 + 2) * 3;
    ctx.fillRect(p2x, p2y, 2, 2);
    ctx.globalAlpha = 1.0;

    // Üst kenar parıltı
    ctx.fillStyle = '#ffcc00';
    ctx.globalAlpha = 0.3 + Math.sin(t * 2) * 0.15;
    ctx.fillRect(x, y + 2, size, 2);
    ctx.globalAlpha = 1.0;
  }

  /**
   * Su havuzu - klasik mavi su
   */
  drawWaterPool(x, y, size) {
    const ctx = this.ctx;
    const t = this.animTime / 500;

    // Koyu su arka planı
    ctx.fillStyle = '#0a2a5a';
    ctx.fillRect(x, y, size, size);

    // Orta katman
    ctx.fillStyle = '#1050a0';
    ctx.fillRect(x, y + 4, size, size - 4);

    // Dalgalı su yüzeyi
    ctx.fillStyle = '#2080e0';
    ctx.beginPath();
    ctx.moveTo(x, y + 8);
    for (let i = 0; i <= size; i += 1) {
      const waveY = y + 6 + Math.sin(t + i * 0.2 + col_hash(x) * 0.5) * 2.5
                       + Math.sin(t * 0.8 + i * 0.12) * 1.5;
      ctx.lineTo(x + i, waveY);
    }
    ctx.lineTo(x + size, y + size);
    ctx.lineTo(x, y + size);
    ctx.closePath();
    ctx.fill();

    // Parlak yansıma
    ctx.fillStyle = '#60b0ff';
    ctx.globalAlpha = 0.3 + Math.sin(t * 1.5) * 0.15;
    ctx.fillRect(x + 4, y + 3, 8, 1);
    ctx.fillRect(x + 20, y + 5, 5, 1);
    ctx.globalAlpha = 1.0;
  }

  /**
   * Asit/zehir havuzu - klasik yeşil asit
   */
  drawAcidPool(x, y, size) {
    const ctx = this.ctx;
    const t = this.animTime / 450;

    // Koyu asit arka planı
    ctx.fillStyle = '#0a3a0a';
    ctx.fillRect(x, y, size, size);

    // Orta katman
    ctx.fillStyle = '#1a6a1a';
    ctx.fillRect(x, y + 4, size, size - 4);

    // Dalgalı asit yüzeyi
    ctx.fillStyle = '#30cc30';
    ctx.beginPath();
    ctx.moveTo(x, y + 8);
    for (let i = 0; i <= size; i += 1) {
      const waveY = y + 6 + Math.sin(t + i * 0.22 + col_hash(x) * 0.7) * 2
                       + Math.sin(t * 1.2 + i * 0.18) * 2;
      ctx.lineTo(x + i, waveY);
    }
    ctx.lineTo(x + size, y + size);
    ctx.lineTo(x, y + size);
    ctx.closePath();
    ctx.fill();

    // Kabarcıklar
    ctx.fillStyle = '#80ff80';
    ctx.globalAlpha = 0.5;
    const bub1Y = y + 12 + Math.sin(t * 2) * 4;
    ctx.beginPath();
    ctx.arc(x + 10, bub1Y, 2, 0, Math.PI * 2);
    ctx.fill();
    const bub2Y = y + 18 + Math.sin(t * 2.5 + 1) * 3;
    ctx.beginPath();
    ctx.arc(x + 22, bub2Y, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }

  /**
   * Elmas kapı - klasik kristal/elmas şeklinde kapı
   */
  drawDoor(x, y, size, type) {
    const ctx = this.ctx;
    const t = this.animTime / 800;
    const cx = x + size / 2;
    const cy = y + size / 2;

    // Parıltı efekti (arka plan ışık)
    const glowAlpha = 0.15 + Math.sin(t * 2) * 0.08;
    const glowColor = type === 'fire' ? '#ff6600' : '#0088ff';
    ctx.fillStyle = glowColor;
    ctx.globalAlpha = glowAlpha;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Kapı çerçevesi (koyu taş kenar)
    ctx.fillStyle = '#2a2018';
    ctx.fillRect(x + 2, y + 1, size - 4, size - 2);

    // Kapı iç alan
    ctx.fillStyle = type === 'fire' ? '#3a1500' : '#001a3a';
    ctx.fillRect(x + 4, y + 3, size - 8, size - 6);

    // Elmas/kristal şekli
    const dw = size * 0.45;
    const dh = size * 0.55;
    ctx.beginPath();
    ctx.moveTo(cx, cy - dh / 2);       // Üst
    ctx.lineTo(cx + dw / 2, cy);       // Sağ
    ctx.moveTo(cx, cy - dh / 2);
    ctx.lineTo(cx - dw / 2, cy);       // Sol
    ctx.lineTo(cx, cy + dh / 2);       // Alt
    ctx.lineTo(cx + dw / 2, cy);       // Sağ
    ctx.closePath();

    // Elmas gradient
    if (type === 'fire') {
      const grad = ctx.createLinearGradient(cx - dw / 2, cy - dh / 2, cx + dw / 2, cy + dh / 2);
      grad.addColorStop(0, '#ffcc00');
      grad.addColorStop(0.3, '#ff8800');
      grad.addColorStop(0.7, '#ff4400');
      grad.addColorStop(1, '#cc2200');
      ctx.fillStyle = grad;
    } else {
      const grad = ctx.createLinearGradient(cx - dw / 2, cy - dh / 2, cx + dw / 2, cy + dh / 2);
      grad.addColorStop(0, '#88ddff');
      grad.addColorStop(0.3, '#4488ff');
      grad.addColorStop(0.7, '#2266dd');
      grad.addColorStop(1, '#1144aa');
      ctx.fillStyle = grad;
    }
    ctx.fill();

    // Elmas kenar çizgisi
    ctx.strokeStyle = type === 'fire' ? '#ffdd44' : '#88ccff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // İç parıltı çizgileri
    ctx.strokeStyle = type === 'fire' ? 'rgba(255,255,150,0.4)' : 'rgba(150,200,255,0.4)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy - dh / 2);
    ctx.lineTo(cx, cy + dh / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - dw / 2, cy);
    ctx.lineTo(cx + dw / 2, cy);
    ctx.stroke();

    // Parlama noktası
    ctx.fillStyle = type === 'fire' ? '#fff8cc' : '#ccddff';
    ctx.globalAlpha = 0.6 + Math.sin(t * 3) * 0.3;
    ctx.beginPath();
    ctx.arc(cx - 3, cy - 5, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
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
      ctx.globalAlpha = 0.25;
    }

    if (role === 'fire') {
      this.drawFireboy(x, y, PLAYER_WIDTH, PLAYER_HEIGHT, player.vx);
    } else {
      this.drawWatergirl(x, y, PLAYER_WIDTH, PLAYER_HEIGHT, player.vx);
    }

    // Kapıya ulaştıysa parıltı
    if (player.reachedDoor && player.alive) {
      const sparkColor = role === 'fire' ? '#ffcc00' : '#00ccff';
      ctx.fillStyle = sparkColor;
      ctx.globalAlpha = 0.4 + Math.sin(this.animTime / 150) * 0.3;
      for (let i = 0; i < 5; i++) {
        const angle = (this.animTime / 500 + i * Math.PI * 2 / 5);
        const radius = 18 + Math.sin(this.animTime / 200 + i) * 4;
        const sx = x + PLAYER_WIDTH / 2 + Math.cos(angle) * radius;
        const sy = y + PLAYER_HEIGHT / 2 + Math.sin(angle) * radius;
        ctx.beginPath();
        ctx.arc(sx, sy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1.0;
  }

  /**
   * Fireboy (Ateş çocuk) - klasik tasarım
   */
  drawFireboy(x, y, w, h, vx) {
    const ctx = this.ctx;
    const t = this.animTime / 150;
    const cx = x + w / 2;

    // === GÖVDE ===
    // Ana gövde gradient (turuncu-kırmızı)
    const bodyGrad = ctx.createLinearGradient(x, y + 8, x, y + h);
    bodyGrad.addColorStop(0, '#ff7700');
    bodyGrad.addColorStop(0.5, '#ee5500');
    bodyGrad.addColorStop(1, '#cc3300');
    ctx.fillStyle = bodyGrad;

    // Gövde (yuvarlak üst, düz alt)
    ctx.beginPath();
    ctx.moveTo(x + 3, y + h);         // Sol alt
    ctx.lineTo(x + 3, y + 12);        // Sol kenar
    ctx.quadraticCurveTo(x + 3, y + 6, cx, y + 6); // Sol üst yuvarlak
    ctx.quadraticCurveTo(x + w - 3, y + 6, x + w - 3, y + 12); // Sağ üst yuvarlak
    ctx.lineTo(x + w - 3, y + h);     // Sağ kenar
    ctx.closePath();
    ctx.fill();

    // Gövde kenar çizgisi
    ctx.strokeStyle = '#aa2200';
    ctx.lineWidth = 1;
    ctx.stroke();

    // === ALEV SAÇLAR ===
    const flameColors = ['#ffdd00', '#ffaa00', '#ff6600', '#ff4400'];
    for (let i = 0; i < 5; i++) {
      const fx = x + 3 + i * (w - 6) / 4;
      const fh = 7 + Math.sin(t + i * 1.8) * 4 + Math.sin(t * 1.5 + i * 0.7) * 3;
      const fw = 5 + Math.sin(t + i) * 1;

      ctx.fillStyle = flameColors[i % flameColors.length];
      ctx.beginPath();
      ctx.moveTo(fx, y + 8);
      ctx.quadraticCurveTo(fx + fw / 2, y + 8 - fh, fx + fw, y + 8);
      ctx.fill();
    }

    // === GÖZLER ===
    // Göz beyazı
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(x + 7, y + 15, 3.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + w - 7, y + 15, 3.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Göz bebekleri (bakış yönü)
    const lookX = vx > 0 ? 1 : (vx < 0 ? -1 : 0);
    ctx.fillStyle = '#331100';
    ctx.beginPath();
    ctx.arc(x + 7 + lookX, y + 15, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + w - 7 + lookX, y + 15, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // === BACAKLAR ===
    ctx.fillStyle = '#cc3300';
    ctx.fillRect(x + 5, y + h - 1, 5, 1);
    ctx.fillRect(x + w - 10, y + h - 1, 5, 1);
  }

  /**
   * Watergirl (Su kız) - klasik tasarım
   */
  drawWatergirl(x, y, w, h, vx) {
    const ctx = this.ctx;
    const t = this.animTime / 200;
    const cx = x + w / 2;

    // === GÖVDE ===
    const bodyGrad = ctx.createLinearGradient(x, y + 6, x, y + h);
    bodyGrad.addColorStop(0, '#44aaff');
    bodyGrad.addColorStop(0.5, '#2288ee');
    bodyGrad.addColorStop(1, '#1155bb');
    ctx.fillStyle = bodyGrad;

    // Gövde
    ctx.beginPath();
    ctx.moveTo(x + 3, y + h);
    ctx.lineTo(x + 3, y + 12);
    ctx.quadraticCurveTo(x + 3, y + 6, cx, y + 6);
    ctx.quadraticCurveTo(x + w - 3, y + 6, x + w - 3, y + 12);
    ctx.lineTo(x + w - 3, y + h);
    ctx.closePath();
    ctx.fill();

    // Gövde kenar çizgisi
    ctx.strokeStyle = '#0044aa';
    ctx.lineWidth = 1;
    ctx.stroke();

    // === SU DAMLASI SAÇLAR ===
    // Ana damla
    ctx.fillStyle = '#66ccff';
    ctx.beginPath();
    const dropH = 8 + Math.sin(t) * 2;
    ctx.moveTo(cx, y + 6 - dropH);
    ctx.quadraticCurveTo(cx + 7, y + 4, cx + 5, y + 8);
    ctx.quadraticCurveTo(cx, y + 11, cx - 5, y + 8);
    ctx.quadraticCurveTo(cx - 7, y + 4, cx, y + 6 - dropH);
    ctx.fill();

    // Damla parıltı
    ctx.fillStyle = '#aaddff';
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(cx - 2, y + 4 - dropH / 2, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Yanlarda küçük damlacıklar
    const d1y = y + 5 + Math.sin(t * 1.5) * 2;
    const d2y = y + 4 + Math.sin(t * 1.5 + 2) * 2;
    ctx.fillStyle = '#55bbff';
    ctx.beginPath();
    ctx.arc(x + 4, d1y, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + w - 4, d2y, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // === GÖZLER ===
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(x + 7, y + 15, 3.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + w - 7, y + 15, 3.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Göz bebekleri
    const lookX = vx > 0 ? 1 : (vx < 0 ? -1 : 0);
    ctx.fillStyle = '#001144';
    ctx.beginPath();
    ctx.arc(x + 7 + lookX, y + 15, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + w - 7 + lookX, y + 15, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // === BACAKLAR ===
    ctx.fillStyle = '#1155bb';
    ctx.fillRect(x + 5, y + h - 1, 5, 1);
    ctx.fillRect(x + w - 10, y + h - 1, 5, 1);
  }

  /**
   * Geri sayım ekranı
   */
  drawCountdown(count) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(10, 5, 2, 0.75)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Sayı
    ctx.fillStyle = '#ffaa00';
    ctx.font = 'bold 120px "Georgia", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 40;
    ctx.fillText(count, this.canvas.width / 2, this.canvas.height / 2);
    ctx.shadowBlur = 0;
  }

  /**
   * Mesaj ekranı
   */
  drawMessage(title, subtitle, color = '#ffcc00') {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(10, 5, 2, 0.8)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = color;
    ctx.font = 'bold 42px "Georgia", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = color;
    ctx.shadowBlur = 25;
    ctx.fillText(title, this.canvas.width / 2, this.canvas.height / 2 - 20);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ccaa88';
    ctx.font = '18px "Georgia", serif';
    ctx.fillText(subtitle, this.canvas.width / 2, this.canvas.height / 2 + 25);
  }
}

// Yardımcı: pozisyondan basit hash (dalga desenleri için)
function col_hash(x) {
  return ((x * 7) % 100) / 100 * Math.PI * 2;
}
