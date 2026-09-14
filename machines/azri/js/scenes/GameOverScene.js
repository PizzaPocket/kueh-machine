import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config.js';
import { createPixelButton, createIconButton, PIXEL_FONT } from '../ui.js';
import { formatTime } from '../runTimer.js';
import { isSignedIn } from '../progress.js';
import { getSavedNicknameSync, saveNicknameSync, submitLeaderboardTimeIfBest } from '../leaderboard.js';
import { promptForNickname } from '../nicknamePrompt.js';

const CAR_TAUNTS = [
  'Come back, human! We haven’t had dessert yet!',
  'You eat me before. Now my turn!',
  'Don’t run! I’m only slightly chewy!',
];

const CAUGHT_TAUNTS = [
  'Standing still? Rude. We were starving.',
  'Dawdling is how dessert happens.',
  'You had one job: keep walking.',
];

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  create(data) {
    const { result, timeMs, cause, isNewBest } = data;
    const cx = GAME_WIDTH / 2;
    const won = result === 'win';

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.background, 1).setOrigin(0);

    this.add.text(cx, 220, won ? 'YOU MADE IT!' : 'SAMPLED.', {
      fontFamily: PIXEL_FONT,
      fontSize: '34px',
      color: won ? COLORS.mint : COLORS.danger,
      align: 'center',
    }).setOrigin(0.5);

    const subtitle = won
      ? 'The Machine hums quietly. For now.'
      : Phaser.Utils.Array.GetRandom(cause === 'caught' ? CAUGHT_TAUNTS : CAR_TAUNTS);

    this.add.text(cx, 280, subtitle, {
      fontFamily: 'Syne, sans-serif',
      fontSize: '15px',
      color: '#cfc9e8',
      align: 'center',
      wordWrap: { width: 300 },
    }).setOrigin(0.5);

    this.add.text(cx, 370, `TIME: ${formatTime(timeMs)}`, {
      fontFamily: PIXEL_FONT,
      fontSize: '18px',
      color: COLORS.hudGold,
    }).setOrigin(0.5);

    if (won && isNewBest) {
      this.add.text(cx, 398, 'NEW BEST!', {
        fontFamily: PIXEL_FONT,
        fontSize: '13px',
        color: COLORS.mint,
      }).setOrigin(0.5);
    }

    createPixelButton(this, cx, 500, 240, 68, 'RETRY', {
      fontSize: '26px',
      // Explicit {level: 1} rather than a bare scene.start('Game') —
      // Phaser retains a scene's previous start-data when none is passed,
      // so omitting this would silently resume wherever the run left off
      // instead of actually restarting from Level 1.
      onClick: () => this.scene.start('Game', { level: 1 }),
    });

    // Three actions, full width, pinned near the bottom of the screen — a
    // compact secondary-actions row below the main RETRY CTA. Home keeps
    // its icon button; Characters/Scoreboard are secondary filled buttons
    // (same dark fill/cream text language as the old UNLOCK CHARACTERS
    // button). All three share one row width, edge to edge with a 16px
    // gap between each, rather than floating with uneven gaps between them.
    const footerY = 700;
    const footerMargin = 20;
    const footerGap = 16;
    const footerHeight = 56;
    const footerButtonWidth = (GAME_WIDTH - footerMargin * 2 - footerGap * 2) / 3;
    const footerX1 = footerMargin + footerButtonWidth / 2;
    const footerX2 = footerX1 + footerButtonWidth + footerGap;
    const footerX3 = footerX2 + footerButtonWidth + footerGap;

    createPixelButton(this, footerX1, footerY, footerButtonWidth, footerHeight, 'Characters', {
      fontSize: '13px',
      fillColor: 0x2a2450,
      textColor: COLORS.hudCream,
      // Passes this screen's own data through as returnTo — the shop
      // hands it straight back on its own Back button, so "come back
      // from browsing chefs" lands on the exact same result screen
      // rather than a blank/default one.
      onClick: () => this.scene.start('CharacterSelect', { returnTo: { result, timeMs, cause } }),
    });

    createIconButton(this, footerX2, footerY, footerButtonWidth, footerHeight, 'icon_home', null, {
      onClick: () => this.scene.start('Start'),
    });

    createPixelButton(this, footerX3, footerY, footerButtonWidth, footerHeight, 'Scoreboard', {
      fontSize: '13px',
      fillColor: 0x2a2450,
      textColor: COLORS.hudCream,
      onClick: () => this.scene.start('Leaderboard', {
        returnTo: { scene: 'GameOver', data: { result, timeMs, cause, isNewBest } },
      }),
    });

    // A qualifying win (a genuine new best, while signed in) offers the
    // one-time nickname prompt before submitting to the public board —
    // fire-and-forget, same as every other remote call in this project;
    // it never blocks the screen from being usable.
    if (won && isNewBest && isSignedIn()) {
      this.submitToLeaderboard(timeMs);
    }
  }

  async submitToLeaderboard(timeMs) {
    let nickname = getSavedNicknameSync();
    if (!nickname) {
      nickname = await promptForNickname();
      if (!nickname) return; // skipped — no name saved, nothing submitted
      saveNicknameSync(nickname);
    }
    submitLeaderboardTimeIfBest(nickname, timeMs);
  }
}
