/**
 * Game - İstemci tarafı oyun döngüsü ve durum yönetimi
 */
class Game {
  constructor(canvas, networkManager, inputHandler) {
    this.canvas = canvas;
    this.network = networkManager;
    this.input = inputHandler;
    this.renderer = new Renderer(canvas);

    // Oyun durumu
    this.state = null;
    this.status = 'idle'; // idle, waiting, countdown, playing, death, won, disconnected
    this.countdownValue = null;
    this.myRole = null;

    // Interpolasyon için durum tamponu
    this.stateBuffer = [];
    this.interpolationDelay = 50; // ms

    // Animasyon
    this.animFrameId = null;
    this.lastRenderTime = 0;

    // Ağ olaylarını dinle
    this.setupNetworkListeners();
  }

  /**
   * Ağ olaylarını dinle
   */
  setupNetworkListeners() {
    this.network.on('role-assigned', (data) => {
      this.myRole = data.role;
      this.status = 'waiting';
      this.updateUI();
    });

    this.network.on('game-init', (data) => {
      this.renderer.setTiles(data.tiles);
      this.status = 'countdown';
    });

    this.network.on('countdown', (data) => {
      this.countdownValue = data.count;
      this.status = 'countdown';
    });

    this.network.on('game-start', () => {
      this.status = 'playing';
      this.stateBuffer = [];
    });

    this.network.on('game-state', (state) => {
      // Durum tamponuna ekle (interpolasyon için)
      this.stateBuffer.push({
        time: Date.now(),
        state: state
      });

      // Tampon çok büyürse eski durumları sil
      if (this.stateBuffer.length > 10) {
        this.stateBuffer.shift();
      }

      this.state = state;
    });

    this.network.on('player-died', (data) => {
      this.status = 'death';
    });

    this.network.on('respawn', () => {
      this.status = 'playing';
    });

    this.network.on('level-complete', (data) => {
      this.status = 'won';
      this.completionTicks = data.ticks;
    });

    this.network.on('partner-disconnected', (data) => {
      this.status = 'disconnected';
    });
  }

  /**
   * Oyun döngüsünü başlat
   */
  start() {
    this.loop();
  }

  /**
   * Ana render döngüsü (60 FPS)
   */
  loop() {
    this.animFrameId = requestAnimationFrame(() => this.loop());

    const now = Date.now();

    // Input gönder (oyun devam ediyorsa)
    if (this.status === 'playing') {
      const input = this.input.getInput();
      this.network.sendInput(input);
    }

    // Interpolasyon ile mevcut durumu hesapla
    const renderState = this.getInterpolatedState();

    // Çiz
    this.renderer.render(renderState || this.state);

    // Overlay çiz
    this.renderOverlay();
  }

  /**
   * İnterpolasyon ile pürüzsüz durum hesapla
   */
  getInterpolatedState() {
    if (this.stateBuffer.length < 2) {
      return this.state;
    }

    const now = Date.now();
    const renderTime = now - this.interpolationDelay;

    // renderTime'a en yakın iki durumu bul
    let prev = null;
    let next = null;

    for (let i = 0; i < this.stateBuffer.length - 1; i++) {
      if (this.stateBuffer[i].time <= renderTime && this.stateBuffer[i + 1].time >= renderTime) {
        prev = this.stateBuffer[i];
        next = this.stateBuffer[i + 1];
        break;
      }
    }

    if (!prev || !next) {
      // Tampondaki son durumu kullan
      return this.stateBuffer[this.stateBuffer.length - 1].state;
    }

    // Lineer interpolasyon
    const timeDiff = next.time - prev.time;
    const t = timeDiff > 0 ? (renderTime - prev.time) / timeDiff : 0;

    return this.lerpState(prev.state, next.state, t);
  }

  /**
   * İki durum arasında lineer interpolasyon
   */
  lerpState(stateA, stateB, t) {
    if (!stateA || !stateB || !stateA.players || !stateB.players) {
      return stateB || stateA;
    }

    const lerp = (a, b, t) => a + (b - a) * t;

    return {
      ...stateB,
      players: {
        fire: {
          ...stateB.players.fire,
          x: lerp(stateA.players.fire.x, stateB.players.fire.x, t),
          y: lerp(stateA.players.fire.y, stateB.players.fire.y, t)
        },
        water: {
          ...stateB.players.water,
          x: lerp(stateA.players.water.x, stateB.players.water.x, t),
          y: lerp(stateA.players.water.y, stateB.players.water.y, t)
        }
      }
    };
  }

  /**
   * Overlay mesajlarını çiz
   */
  renderOverlay() {
    switch (this.status) {
      case 'countdown':
        if (this.countdownValue !== null) {
          if (this.countdownValue > 0) {
            this.renderer.drawCountdown(this.countdownValue);
          } else {
            this.renderer.drawMessage('BAŞLA!', '', '#44ff44');
          }
        }
        break;

      case 'death':
        this.renderer.drawMessage(
          '💀 ÖLDÜNÜZ!',
          'Yeniden doğuluyor...',
          '#ff4444'
        );
        break;

      case 'won':
        const seconds = (this.completionTicks / 30).toFixed(1);
        this.renderer.drawMessage(
          '🎉 LEVEL TAMAMLANDI!',
          `Süre: ${seconds} saniye`,
          '#44ff44'
        );
        break;

      case 'disconnected':
        this.renderer.drawMessage(
          '🔌 BAĞLANTI KOPTU',
          'Takım arkadaşınız ayrıldı',
          '#ffaa00'
        );
        break;
    }
  }

  /**
   * UI güncellemeleri (HTML elementleri)
   */
  updateUI() {
    const roleBadge = document.getElementById('player-role');
    if (roleBadge && this.myRole) {
      roleBadge.className = `role-badge ${this.myRole}`;
      roleBadge.textContent = this.myRole === 'fire' ? '🔥 ATEŞ' : '💧 SU';
    }
  }

  /**
   * Temizlik
   */
  destroy() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
  }
}
