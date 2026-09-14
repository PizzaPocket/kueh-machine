import { GAME_WIDTH, GAME_HEIGHT, SAFE_TOP, COLORS } from '../config.js';
import { PIXEL_FONT } from '../ui.js';
import { formatTime } from '../runTimer.js';
import { fetchLeaderboard } from '../leaderboard.js';

const RANK_COLORS = [COLORS.hudGold, '#e0dcf0', '#d8935a'];

export default class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super('Leaderboard');
  }

  create(data = {}) {
    // Same returnTo shape used across the shop/game-over flow — where to
    // land on Back, since this scene can be opened from either the Start
    // Screen or the Game Over screen.
    this.returnTo = data.returnTo ?? { scene: 'Start' };

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.background, 1).setOrigin(0);

    const backBtn = this.add.text(20, SAFE_TOP - 40, '‹ BACK', {
      fontFamily: 'Syne, sans-serif',
      fontSize: '14px',
      color: COLORS.hudCream,
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.scene.start(this.returnTo.scene, this.returnTo.data));

    this.add.text(GAME_WIDTH / 2, SAFE_TOP - 40, 'FASTEST TIMES', {
      fontFamily: PIXEL_FONT,
      fontSize: '15px',
      color: COLORS.hudGold,
    }).setOrigin(0.5);

    this.listContainer = this.add.container(0, 0);
    this.statusText = this.add.text(GAME_WIDTH / 2, SAFE_TOP + 120, 'Loading times…', {
      fontFamily: 'Syne, sans-serif',
      fontSize: '14px',
      color: '#8b84b0',
    }).setOrigin(0.5);

    fetchLeaderboard(10).then((rows) => this.renderRows(rows));
  }

  renderRows(rows) {
    this.statusText.destroy();

    if (!rows.length) {
      this.add.text(GAME_WIDTH / 2, SAFE_TOP + 120, 'No times recorded yet —\nbe the first!', {
        fontFamily: 'Syne, sans-serif',
        fontSize: '14px',
        color: '#8b84b0',
        align: 'center',
      }).setOrigin(0.5);
      return;
    }

    const top = SAFE_TOP + 70;
    const rowHeight = 46;

    rows.forEach((row, i) => {
      const y = top + i * rowHeight;
      const color = RANK_COLORS[i] ?? COLORS.hudCream;

      this.add.text(30, y, `#${i + 1}`, {
        fontFamily: PIXEL_FONT,
        fontSize: '15px',
        color,
      }).setOrigin(0, 0.5);

      this.add.text(80, y, row.display_name, {
        fontFamily: PIXEL_FONT,
        fontSize: '15px',
        color,
        wordWrap: { width: 160 },
      }).setOrigin(0, 0.5);

      this.add.text(GAME_WIDTH - 30, y, formatTime(row.best_time_ms), {
        fontFamily: PIXEL_FONT,
        fontSize: '15px',
        color,
      }).setOrigin(1, 0.5);

      if (i > 0) {
        this.add.rectangle(GAME_WIDTH / 2, y - rowHeight / 2, GAME_WIDTH - 40, 1, 0xffffff, 0.08);
      }
    });
  }
}
