/**
 * InputHandler - Klavye girişlerini yakalar ve input durumunu yönetir
 * Hem ok tuşları hem WASD destekler
 */
class InputHandler {
  constructor() {
    this.keys = {
      left: false,
      right: false,
      jump: false
    };

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  _onKeyDown(e) {
    const changed = this._updateKey(e.code, true);
    if (changed) {
      e.preventDefault();
    }
  }

  _onKeyUp(e) {
    const changed = this._updateKey(e.code, false);
    if (changed) {
      e.preventDefault();
    }
  }

  /**
   * Tuş koduna göre input durumunu güncelle
   * @returns {boolean} Değişiklik oldu mu
   */
  _updateKey(code, pressed) {
    switch (code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.keys.left = pressed;
        return true;
      case 'ArrowRight':
      case 'KeyD':
        this.keys.right = pressed;
        return true;
      case 'ArrowUp':
      case 'KeyW':
        this.keys.jump = pressed;
        return true;
      default:
        return false;
    }
  }

  /**
   * Mevcut input durumunun bir kopyasını döndür
   */
  getInput() {
    return {
      left: this.keys.left,
      right: this.keys.right,
      jump: this.keys.jump
    };
  }

  /**
   * Temizlik
   */
  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }
}
