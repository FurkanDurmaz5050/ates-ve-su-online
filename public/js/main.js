/**
 * main.js - Uygulama giriş noktası
 * Lobi yönetimi ve oyun başlatma
 */
(function () {
  // DOM elementleri
  const lobbyScreen = document.getElementById('lobby-screen');
  const gameScreen = document.getElementById('game-screen');
  const findGameBtn = document.getElementById('find-game-btn');
  const lobbyStatus = document.getElementById('lobby-status');
  const statusText = document.getElementById('status-text');
  const canvas = document.getElementById('game-canvas');
  const overlay = document.getElementById('overlay');
  const overlayContent = document.getElementById('overlay-content');
  const gameInfo = document.getElementById('game-info');

  // Bileşenler
  const network = new NetworkManager();
  const input = new InputHandler();
  let game = null;

  // Ağa bağlan
  network.connect();

  // --- Lobi olayları ---

  findGameBtn.addEventListener('click', () => {
    findGameBtn.disabled = true;
    lobbyStatus.classList.remove('hidden');
    statusText.textContent = 'Oyuncu aranıyor...';
    network.findGame();
  });

  // Bekleme durumu
  network.on('waiting', (data) => {
    statusText.textContent = data.message;
  });

  // Rol atandı → oyun ekranına geç
  network.on('role-assigned', (data) => {
    if (data.role === 'water') {
      // İkinci oyuncu - hemen oyun ekranına geç
      switchToGameScreen();
    } else {
      // İlk oyuncu - bekliyor
      statusText.textContent = data.message;
    }
  });

  // Oyun başlatma verisi geldiğinde (harita)
  network.on('game-init', () => {
    switchToGameScreen();
  });

  // Takım arkadaşı ayrıldı
  network.on('partner-disconnected', (data) => {
    showOverlay(`
      <h2 style="color: #ffaa00;">🔌 Bağlantı Koptu</h2>
      <p>${data.message}</p>
      <button class="btn btn-lobby" onclick="location.reload()">Lobiye Dön</button>
    `);
  });

  // Level tamamlandı
  network.on('level-complete', (data) => {
    const seconds = (data.ticks / 30).toFixed(1);
    showOverlay(`
      <h2 class="win-text">🎉 LEVEL TAMAMLANDI!</h2>
      <p>Süre: ${seconds} saniye</p>
      <div style="margin-top: 20px;">
        <button class="btn btn-replay" onclick="requestReplay()">🔄 Tekrar Oyna</button>
        <button class="btn btn-lobby" onclick="location.reload()">🏠 Lobiye Dön</button>
      </div>
    `);
  });

  // Bağlantı koptu
  network.on('disconnected', () => {
    if (game) {
      showOverlay(`
        <h2 style="color: #ff4444;">Bağlantı Koptu</h2>
        <p>Sunucu ile bağlantı kesildi.</p>
        <button class="btn btn-lobby" onclick="location.reload()">Yeniden Dene</button>
      `);
    }
  });

  // --- Fonksiyonlar ---

  function switchToGameScreen() {
    lobbyScreen.classList.remove('active');
    gameScreen.classList.add('active');

    if (!game) {
      game = new Game(canvas, network, input);
      game.start();
    }

    hideOverlay();
  }

  function showOverlay(html) {
    overlayContent.innerHTML = html;
    overlay.classList.remove('hidden');
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
  }

  // Global erişim (HTML butonları için)
  window.requestReplay = function () {
    hideOverlay();
    network.requestReplay();
  };

})();
