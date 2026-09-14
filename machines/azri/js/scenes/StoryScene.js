import { GAME_WIDTH, GAME_HEIGHT, SAFE_TOP, SAFE_BOTTOM, COLORS } from '../config.js';
import { STORY_PAGES, STORY_BEAT_COUNT } from '../storyData.js';
import { createPixelButton, PIXEL_FONT } from '../ui.js';
import { AudioManager, SFX_KEYS, MUSIC_KEYS } from '../audio.js';

// The beat illustrations are full-span, screen-filling art (853x1844,
// matching our 390:844 design ratio almost exactly) — a Pokemon-style
// dialogue box overlays the bottom of the image directly rather than
// splitting the screen into separate illustration/dialogue zones.
// Fixed position and size across all 6 beats so it never jumps around.
const TEXTBOX_WIDTH = GAME_WIDTH - 32;
const TEXTBOX_HEIGHT = 170;
const TEXTBOX_CENTER_X = GAME_WIDTH / 2;
const TEXTBOX_CENTER_Y = SAFE_BOTTOM - TEXTBOX_HEIGHT / 2; // bottom edge sits on the safe-area boundary
const TEXTBOX_BORDER = 12; // native px margin baked into textbox.png, for 9-slice corners
const TEXTBOX_PADDING_X = 24;

export default class StoryScene extends Phaser.Scene {
  constructor() {
    super('Story');
  }

  create() {
    this.pageIndex = 0;

    AudioManager.playMusic(MUSIC_KEYS.THEME_SONG, { volume: 0.3, fadeMs: 600 });

    // Tapping anywhere advances — attached to the background itself so
    // Phaser's own hit-testing naturally routes a tap on the Skip button
    // (drawn on top, its own interactive object) to that button instead,
    // with no coordinate math needed to avoid double-handling.
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.background, 1)
      .setOrigin(0)
      .setInteractive()
      .on('pointerdown', () => this.advance());

    this.illustration = null; // full-span background — swapped per beat, see renderPage()

    this.flashRect = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 0)
      .setOrigin(0).setDepth(4);

    // The textbox itself is one persistent, shared instance — created
    // once here, never recreated per page — so future style or copy
    // changes only ever happen in one place, and position/size can't
    // drift between beats.
    this.add.nineslice(
      TEXTBOX_CENTER_X, TEXTBOX_CENTER_Y, 'textbox', null,
      TEXTBOX_WIDTH, TEXTBOX_HEIGHT,
      TEXTBOX_BORDER, TEXTBOX_BORDER, TEXTBOX_BORDER, TEXTBOX_BORDER,
    ).setDepth(5);

    this.dialogueText = this.add.text(TEXTBOX_CENTER_X, TEXTBOX_CENTER_Y, '', {
      fontFamily: 'Syne, sans-serif',
      fontSize: '18px',
      color: COLORS.hudCream,
      align: 'center',
      wordWrap: { width: TEXTBOX_WIDTH - TEXTBOX_PADDING_X * 2 },
      lineSpacing: 8,
    }).setOrigin(0.5).setDepth(6);

    this.advanceIndicator = this.add.text(
      TEXTBOX_CENTER_X + TEXTBOX_WIDTH / 2 - 22,
      TEXTBOX_CENTER_Y + TEXTBOX_HEIGHT / 2 - 22,
      '▼', {
        fontFamily: PIXEL_FONT,
        fontSize: '18px',
        color: COLORS.hudGold,
      },
    ).setOrigin(0.5).setDepth(6);
    this.tweens.add({ targets: this.advanceIndicator, y: '+=6', duration: 500, yoyo: true, repeat: -1 });

    this.createProgressDots();

    // Bottom-right, floating over the illustration just above the
    // textbox — right-aligned with the box below it, with a clear gap so
    // it never touches the box or its own bottom-right advance indicator.
    createPixelButton(this, GAME_WIDTH - 20 - 40, TEXTBOX_CENTER_Y - TEXTBOX_HEIGHT / 2 - 20 - 20, 80, 40, 'SKIP', {
      fontSize: '14px',
      fillColor: 0x2a2450,
      textColor: COLORS.hudCream,
      onClick: () => this.goToGame(),
    }).setDepth(10);

    this.renderPage();
  }

  createProgressDots() {
    this.dots = [];
    const spacing = 16;
    const startX = 24;
    const y = SAFE_TOP - 40;
    for (let i = 0; i < STORY_BEAT_COUNT; i++) {
      this.dots.push(this.add.circle(startX + i * spacing, y, 4, 0xffffff, 0.25).setDepth(10));
    }
  }

  updateProgressDots(beatIndex) {
    this.dots.forEach((dot, i) => {
      dot.setFillStyle(i <= beatIndex ? COLORS.hudGold : 0xffffff, i <= beatIndex ? 1 : 0.25);
    });
  }

  renderPage() {
    const page = STORY_PAGES[this.pageIndex];
    const key = page.illustration;

    // The reference art is already composed at (almost exactly) our
    // design ratio, so it fills the whole screen directly — no fit/crop
    // math needed, unlike the earlier landscape story crops.
    if (!this.illustration || this.illustration.texture.key !== key) {
      if (this.illustration) this.illustration.destroy();
      this.illustration = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, key)
        .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
        .setDepth(0);
    }

    this.dialogueText.setText(page.lines.join('\n'));
    this.updateProgressDots(page.beatIndex);

    if (page.effect === 'flash') {
      this.flashRect.setAlpha(0.9);
      this.tweens.add({ targets: this.flashRect, alpha: 0, duration: 400 });
    }
  }

  advance() {
    if (this.pageIndex + 1 < STORY_PAGES.length) {
      AudioManager.playSfx(SFX_KEYS.TEXT_BLIP);
      this.pageIndex += 1;
      this.renderPage();
    } else {
      this.goToGame();
    }
  }

  goToGame() {
    // Explicit {level: 1, score: 0} — Phaser retains a scene's previous
    // start-data when none is passed, so a bare call here could inherit a
    // stale level/score left over from an earlier run (e.g. after
    // GameOver's "BACK TO MENU" then replaying the story) instead of
    // actually starting fresh.
    this.scene.start('Game', { level: 1 });
  }
}
