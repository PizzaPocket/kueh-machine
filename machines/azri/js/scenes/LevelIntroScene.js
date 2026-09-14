import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config.js';
import { getLevelConfig } from '../levels.js';
import { PIXEL_FONT } from '../ui.js';

// A deliberately lightweight title-card beat between levels — not a
// reskin of StoryScene's illustrated 6-beat sequence, which would be
// disproportionate for a between-level transition with no new
// illustrated-art budget. Tap-anywhere matches StoryScene's own pattern;
// the auto-advance timer means it's never a dead end if the player
// doesn't realize to tap.
const AUTO_ADVANCE_MS = 1800;

export default class LevelIntroScene extends Phaser.Scene {
  constructor() {
    super('LevelIntro');
  }

  create(data) {
    this.level = data.level;
    // Phaser reuses the same scene instance across restarts rather than
    // creating a fresh one — this flag (and any input listener below)
    // must be reset here, or the SECOND time this scene is ever visited
    // (i.e. every run that reaches Level 3) both the tap and the
    // auto-advance timer silently no-op against the stale `true` left
    // over from the first visit.
    this.wentToGame = false;
    const cfg = getLevelConfig(this.level);
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.background, 1).setOrigin(0);
    // Bound to the scene's own input plugin rather than a specific
    // GameObject's hit area (StartScene's pattern) — no dependency on
    // hit-area/depth computation for any one object, the most bulletproof
    // of the tap-anywhere variants already used in this project. The
    // input plugin itself persists across scene restarts (unlike a
    // GameObject, which Phaser tears down on shutdown), so any listener
    // from a previous visit is explicitly cleared first rather than
    // stacking a second one alongside it.
    this.input.off('pointerdown');
    this.input.on('pointerdown', () => this.goToGame());

    this.add.text(cx, cy - 60, `LEVEL ${this.level}`, {
      fontFamily: PIXEL_FONT,
      fontSize: '16px',
      color: '#8b84b0',
      letterSpacing: 3,
    }).setOrigin(0.5);

    this.add.text(cx, cy - 20, cfg.name, {
      fontFamily: PIXEL_FONT,
      fontSize: '30px',
      color: COLORS.hudGold,
      align: 'center',
    }).setOrigin(0.5);

    this.add.text(cx, cy + 40, cfg.subtitle, {
      fontFamily: 'Syne, sans-serif',
      fontSize: '15px',
      color: COLORS.hudCream,
      align: 'center',
      wordWrap: { width: GAME_WIDTH - 80 },
    }).setOrigin(0.5);

    const prompt = this.add.text(cx, cy + 120, 'TAP TO CONTINUE', {
      fontFamily: 'Syne, sans-serif',
      fontSize: '11px',
      color: '#5b5480',
      letterSpacing: 1,
    }).setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.4, duration: 700, yoyo: true, repeat: -1 });

    this.time.delayedCall(AUTO_ADVANCE_MS, () => this.goToGame());
  }

  goToGame() {
    if (this.wentToGame) return;
    this.wentToGame = true;
    this.scene.start('Game', { level: this.level });
  }
}
