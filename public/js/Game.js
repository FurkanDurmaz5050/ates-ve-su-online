/**
 * Game - İstemci tarafı oyun döngüsü ve durum yönetimi
 */
class Game {
  constructor(canvas, networkManager, inputHandler) {
    this.canvas = canvas;
    this.network = networkManager;
    this.input = inputHandler;
    this.renderer = new Renderer(canvas);

    this.state = null;
    this.status = 'idle';
    this.countdownValue = null;
    this.myRole = null;

    this.stateBuffer = [];
    this.interpolationDelay = 50;

    this.animFrameId = null;
    this.completionTicks = 0;

    this.setupNetworkListeners();
  }

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
      this.stateBuffer.push({ time: Date.now(), state: state });
      if (this.stateBuffer.length > 10) this.stateBuffer.shift();
      this.state = state;
    });

    this.network.on('player-died', () => { this.status = 'death'; });
    this.network.on('respawn', () => { this.status = 'playing'; });

    this.network.on('level-complete', (data) => {
      this.status = 'won';
      this.completionTicks = data.ticks;
    });

    this.network.on('partner-disconnected', () => {
      this.status = 'disconnected';
    });
  }

  start() { this.loop(); }

  loop() {
    this.animFrameId = requestAnimationFrame(() => this.loop());

    if (this.status === 'playing') {
      this.network.sendInput(this.input.getInput());
    }

    const renderState = this.getInterpolatedState();
    this.renderer.render(renderState || this.state);
    this.renderOverlay();
  }

  getInterpolatedState() {
    if (this.stateBuffer.length < 2) return this.state;

    const renderTime = Date.now() - this.interpolationDelay;
    let prev = null, next = null;

    for (let i = 0; i < this.stateBuffer.length - 1; i++) {
      if (this.stateBuffer[i].time <= renderTime && this.stateBuffer[i + 1].time >= renderTime) {
        prev = this.stateBuffer[i];
        next = this.stateBuffer[i + 1];
        break;
      }
    }

    if (!prev || !next) return this.stateBuffer[this.stateBuffer.length - 1].state;

    const td = next.time - prev.time;
    const t = td > 0 ? (renderTime - prev.time) / td : 0;
    return this.lerpState(prev.state, next.state, t);
  }

  lerpState(a, b, t) {
    if (!a || !b || !a.players || !b.players) return b || a;
    const lerp = (a, b, t) => a + (b - a) * t;
    return {
      ...b,
      players: {
        fire: {
          ...b.players.fire,
          x: lerp(a.players.fire.x, b.players.fire.x, t),
          y: lerp(a.players.fire.y, b.players.fire.y, t)
        },
        water: {
          ...b.players.water,
          x: lerp(a.players.water.x, b.players.water.x, t),
          y: lerp(a.players.water.y, b.players.water.y, t)
        }
      }
    };
  }

  renderOverlay() {
    switch (this.status) {
      case 'countdown':
        if (this.countdownValue !== null) {
          if (this.countdownValue > 0) {
            this.renderer.drawCountdown(this.countdownValue);
          } else {
            this.renderer.drawMessage('BAŞLA!', '', '#ffcc00');
          }
        }
        break;
      case 'death':
        this.renderer.drawMessage('ÖLDÜNÜZ!', 'Yeniden doğuluyor...', '#cc4422');
        break;
      case 'won':
        this.renderer.drawMessage(
          'BÖLÜM TAMAMLANDI!',
          `Süre: ${(this.completionTicks / 30).toFixed(1)} saniye`,
          '#ffcc00'
        );
        break;
      case 'disconnected':
        this.renderer.drawMessage('BAĞLANTI KOPTU', 'Takım arkadaşınız ayrıldı', '#cc8844');
        break;
    }
  }

  updateUI() {
    const badge = document.getElementById('player-role');
    if (badge && this.myRole) {
      badge.className = `role-badge ${this.myRole}`;
      badge.textContent = this.myRole === 'fire' ? 'ATEŞ' : 'SU';
    }
  }

  destroy() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
  }
}
