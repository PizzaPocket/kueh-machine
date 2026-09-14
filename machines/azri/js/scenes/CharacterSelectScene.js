import { GAME_WIDTH, GAME_HEIGHT, SAFE_TOP, COLORS } from '../config.js';
import { PIXEL_FONT } from '../ui.js';
import { AudioManager, SFX_KEYS } from '../audio.js';
import { CHARACTERS, MYSTERY_CHARACTER } from '../characters.js';
import { getLocalCoinsSync, getOwnedCharactersSync, getSelectedCharacterSync, tryUnlockCharacter, setSelectedCharacter } from '../wallet.js';

const CARD_W = 169;
const CARD_H = 140;
const GAP_X = 12;
const GAP_Y = 12;
const GRID_LEFT = 20;
const GRID_TOP = 116;
const COLS = 2;

export default class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super('CharacterSelect');
  }

  create(data = {}) {
    // Carried through unchanged from GameOverScene and handed straight
    // back on Back (and preserved across this scene's own restart() when
    // a card is tapped) — so "browse chefs, then come back" always lands
    // on the exact result screen the player left, not a blank default.
    this.returnTo = data.returnTo ?? { result: 'lose', timeMs: 0, cause: null };

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.background, 1).setOrigin(0);

    const backBtn = this.add.text(20, SAFE_TOP - 40, '‹ BACK', {
      fontFamily: 'Syne, sans-serif',
      fontSize: '14px',
      color: COLORS.hudCream,
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.scene.start('GameOver', this.returnTo));

    this.add.text(GAME_WIDTH / 2, SAFE_TOP - 40, 'CHOOSE YOUR CHEF', {
      fontFamily: PIXEL_FONT,
      fontSize: '15px',
      color: COLORS.hudGold,
    }).setOrigin(0.5);

    // Centered below the title rather than top-right, which sits directly
    // under the fixed kuehmachine.com account badge (a real DOM element
    // on top of the canvas) — same conflict class already resolved once
    // for the in-game pause button and the story sequence's Skip button.
    const coins = getLocalCoinsSync();
    const coinY = SAFE_TOP - 14;
    this.add.image(GAME_WIDTH / 2 - 26, coinY, 'coin').setDisplaySize(16, 16);
    this.add.text(GAME_WIDTH / 2 - 14, coinY, `${coins}`, {
      fontFamily: PIXEL_FONT,
      fontSize: '14px',
      color: COLORS.hudGold,
    }).setOrigin(0, 0.5);

    const owned = getOwnedCharactersSync();
    const selected = getSelectedCharacterSync();
    const roster = [...CHARACTERS, MYSTERY_CHARACTER];

    roster.forEach((char, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = GRID_LEFT + col * (CARD_W + GAP_X) + CARD_W / 2;
      const y = GRID_TOP + row * (CARD_H + GAP_Y) + CARD_H / 2;
      this.createCard(x, y, char, {
        isOwned: owned.includes(char.id),
        isSelected: char.id === selected,
        coins,
      });
    });
  }

  createCard(x, y, char, { isOwned, isSelected, coins }) {
    const container = this.add.container(x, y);

    const isMystery = !!char.comingSoon;
    const affordable = !isMystery && coins >= char.price;
    const borderColor = isSelected ? COLORS.hudGold : (isMystery ? 0x3a3560 : 0x2a2450);

    const bg = this.add.rectangle(0, 0, CARD_W, CARD_H, 0x140f24, 0.9)
      .setStrokeStyle(isSelected ? 3 : 2, borderColor, isSelected ? 1 : 0.6);

    const portrait = this.add.image(0, -34, char.texture).setDisplaySize(56, 56);
    if (isMystery) portrait.setAlpha(0.9);
    if (!isMystery && !isOwned) portrait.setTint(0x555070); // locked = dimmed silhouette read

    container.add([bg, portrait]);

    container.add(this.add.text(0, 6, isMystery ? '???' : char.name, {
      fontFamily: PIXEL_FONT,
      fontSize: '11px',
      color: COLORS.hudCream,
      align: 'center',
      wordWrap: { width: CARD_W - 16 },
    }).setOrigin(0.5, 0));

    if (isMystery) {
      container.add(this.add.text(0, 34, 'COMING SOON', {
        fontFamily: 'Syne, sans-serif',
        fontSize: '10px',
        color: '#8b84b0',
      }).setOrigin(0.5, 0));
      return container; // deliberately non-interactive — pure teaser
    }

    container.add(this.add.text(0, 26, char.kueh, {
      fontFamily: 'Syne, sans-serif',
      fontSize: '9px',
      color: '#8b84b0',
      align: 'center',
      wordWrap: { width: CARD_W - 16 },
    }).setOrigin(0.5, 0));

    if (isSelected) {
      container.add(this.add.text(0, 46, 'EQUIPPED', {
        fontFamily: PIXEL_FONT,
        fontSize: '10px',
        color: COLORS.mint,
      }).setOrigin(0.5, 0));
      return container; // already the active chef — nothing to tap
    }

    if (isOwned) {
      const label = this.add.text(0, 46, 'TAP TO SELECT', {
        fontFamily: 'Syne, sans-serif',
        fontSize: '10px',
        color: COLORS.hudCream,
      }).setOrigin(0.5, 0);
      container.add(label);
      bg.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        setSelectedCharacter(char.id);
        this.scene.restart({ returnTo: this.returnTo });
      });
      return container;
    }

    // Locked
    const priceRow = this.add.container(0, 46);
    const priceIcon = this.add.image(-16, 4, 'coin').setDisplaySize(14, 14);
    const priceText = this.add.text(-6, 4, `${char.price}`, {
      fontFamily: PIXEL_FONT,
      fontSize: '13px',
      color: affordable ? COLORS.hudGold : '#8b84b0',
    }).setOrigin(0, 0.5);
    priceRow.add([priceIcon, priceText]);
    container.add(priceRow);

    bg.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      if (!affordable) {
        this.tweens.add({
          targets: container, x: '+=6', duration: 40, yoyo: true, repeat: 3,
        });
        return;
      }
      tryUnlockCharacter(char.id, char.price);
      AudioManager.playSfx(SFX_KEYS.WIN);
      this.cameras.main.flash(300, 255, 209, 102);
      this.time.delayedCall(320, () => this.scene.restart({ returnTo: this.returnTo }));
    });

    return container;
  }
}
