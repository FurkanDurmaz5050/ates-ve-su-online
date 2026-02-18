/**
 * main.js - Uygulama giriş noktası
 */
document.addEventListener('DOMContentLoaded', () => {
  const lobbyScreen = document.getElementById('lobby-screen');
  const gameScreen = document.getElementById('game-screen');
  const canvas = document.getElementById('game-canvas');
  const findGameBtn = document.getElementById('find-game-btn');
  const statusText = document.getElementById('status-text');
  const overlayContainer = document.getElementById('overlay-container');

  let network = null;
  let input = null;
  let game = null;

  function showScreen(which) {
    lobbyScreen.style.display = which === 'lobby' ? 'flex' : 'none';
    gameScreen.style.display = which === 'game' ? 'flex' : 'none';
    if (which === 'game') {
      canvas.width = 960;
      canvas.height = 640;
    }
  }

  findGameBtn.addEventListener('click', () => {
    findGameBtn.disabled = true;
    findGameBtn.textContent = 'Aranıyor...';
    statusText.textContent = 'Eşleşme aranıyor...';
    findGameBtn.classList.add('searching');

    network = new NetworkManager();
    input = new InputHandler();

    network.on('connected', () => {
      statusText.textContent = 'Eşleşme aranıyor...';
      network.findGame();
    });

    network.on('role-assigned', (data) => {
      statusText.textContent = data.role === 'fire'
        ? 'Ateş karakteri olarak atandınız. Eşleşme bekleniyor...'
        : 'Su karakteri olarak atandınız. Eşleşme bekleniyor...';
    });

    network.on('game-init', () => {
      showScreen('game');
      game = new Game(canvas, network, input);
      game.start();
    });

    network.on('level-complete', (data) => {
      setTimeout(() => {
        if (overlayContainer) {
          const seconds = (data.ticks / 30).toFixed(1);
          overlayContainer.innerHTML = `
            <div class="overlay-panel">
              <h2 style="color:#ffcc00;">BÖLÜM TAMAMLANDI!</h2>
              <p>Süre: ${seconds} saniye</p>
              <button class="btn btn-replay" onclick="window.requestReplay()">Tekrar Oyna</button>
              <button class="btn btn-lobby" onclick="window.backToLobby()">Ana Menü</button>
            </div>
          `;
          overlayContainer.style.display = 'flex';
        }
      }, 1500);
    });

    network.on('partner-disconnected', () => {
      setTimeout(() => {
        if (overlayContainer) {
          overlayContainer.innerHTML = `
            <div class="overlay-panel">
              <h2 style="color:#cc8844;">BAĞLANTI KOPTU</h2>
              <p>Takım arkadaşınız ayrıldı</p>
              <button class="btn btn-lobby" onclick="window.backToLobby()">Ana Menü</button>
            </div>
          `;
          overlayContainer.style.display = 'flex';
        }
      }, 500);
    });

    network.connect();
  });

  window.requestReplay = function () {
    if (overlayContainer) {
      overlayContainer.style.display = 'none';
      overlayContainer.innerHTML = '';
    }
    if (network) network.requestReplay();
  };

  window.backToLobby = function () {
    if (overlayContainer) {
      overlayContainer.style.display = 'none';
      overlayContainer.innerHTML = '';
    }
    if (game) game.destroy();
    if (network) network.disconnect();
    game = null;
    network = null;
    input = null;
    findGameBtn.disabled = false;
    findGameBtn.textContent = 'Oyun Ara';
    findGameBtn.classList.remove('searching');
    statusText.textContent = '';
    showScreen('lobby');
  };

  showScreen('lobby');
});
