import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config.js';
import { createPixelButton, PIXEL_FONT } from '../ui.js';

const COUNTDOWN_STEP_MS = 700;

export default class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  create(data) {
    this.gameScene = data.gameScene;

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0a0820, 0.82).setOrigin(0);

    this.titleText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 90, 'PAUSED', {
      fontFamily: PIXEL_FONT,
      fontSize: '30px',
      color: COLORS.hudGold,
    }).setOrigin(0.5);

    this.resumeBtn = createPixelButton(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 200, 60, 'RESUME', {
      fontSize: '20px',
      onClick: () => this.startCountdown(),
    });
  }

  // The underlying GameScene stays paused for the whole countdown — the
  // point is giving the player a moment to get their thumb back on the
  // controls before the environment starts closing in again.
  startCountdown() {
    this.resumeBtn.destroy();
    this.titleText.setText('GET READY');

    const countText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '', {
      fontFamily: PIXEL_FONT,
      fontSize: '72px',
      color: COLORS.hudGold,
    }).setOrigin(0.5);

    const showNumber = (label) => {
      countText.setText(label);
      countText.setScale(1.4);
      countText.setAlpha(1);
      this.tweens.add({ targets: countText, scale: 1, duration: 220, ease: 'Back.easeOut' });
    };

    const sequence = ['3', '2', '1', 'GO!'];
    let i = 0;
    showNumber(sequence[i]);

    this.time.addEvent({
      delay: COUNTDOWN_STEP_MS,
      repeat: sequence.length - 1,
      callback: () => {
        i += 1;
        if (i < sequence.length) {
          showNumber(sequence[i]);
        } else {
          this.gameScene.resumeGame();
          this.scene.stop();
        }
      },
    });
  }
}
