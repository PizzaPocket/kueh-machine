import {
  GAME_WIDTH, GAME_HEIGHT, COLS, TILE, BOARD_TOP,
  SAFE_TOP, GOAL_ROW, START_COL,
  MOVE_DURATION, COLORS, colToX, CAMERA_FOLLOW_Y,
  ENVIRONMENT_ADVANCE_SPEED, START_GRACE_MS,
  INITIAL_BUFFER_PX, MAX_BUFFER_PX, BUFFER_REFILL_PX, CAMERA_SMOOTH,
} from '../config.js';
import { InputManager } from '../input.js';
import { LEVELS, getLevelConfig, buildLaneLayout, buildCoinLayout } from '../levels.js';
import { reportTime } from '../progress.js';
import { RunTimer, formatTime } from '../runTimer.js';
import { PIXEL_FONT } from '../ui.js';
import { AudioManager, SFX_KEYS, MUSIC_KEYS } from '../audio.js';
import { getCharacterConfig } from '../characters.js';
import { getSelectedCharacterSync, getLocalCoinsSync, addCoins } from '../wallet.js';

const SPRITE_SIZE = TILE * 0.8;
const CAR_WIDTH = TILE * 0.9;
const CAR_HEIGHT = TILE * 0.55;
// A humanoid/blob kueh monster forced into a car's wide, flat box would
// read wrong — live monster-lane hazards get their own, squarer footprint.
const MONSTER_WIDTH = SPRITE_SIZE * 0.85;
const MONSTER_HEIGHT = SPRITE_SIZE * 0.85;
const DEATH_MONSTER_TEXTURES = ['angkukueh', 'ondehondeh', 'kuehlapis'];

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create(data = {}) {
    this.level = data.level ?? 1;
    this.levelConfig = getLevelConfig(this.level);
    this.rows = this.levelConfig.rows;
    this.startRow = this.rows - 1;
    this.worldHeight = BOARD_TOP + this.rows * TILE + 40;
    this.maxScrollY = Math.max(0, this.worldHeight - GAME_HEIGHT);
    this.laneLayout = buildLaneLayout(this.levelConfig);
    this.coinLayout = buildCoinLayout(this.levelConfig, this.laneLayout);

    this.gameEnded = false;
    this.isPaused = false;
    this.hazards = [];
    this.inputManager = new InputManager();
    this.buffer = INITIAL_BUFFER_PX;
    this.hasMoved = false;
    this.walletCoins = getLocalCoinsSync();

    this.cameras.main.setBounds(0, 0, GAME_WIDTH, this.worldHeight);

    this.drawBoard();
    this.createPlayer();
    this.setupHazardLanes();
    this.createHud();

    this.cameras.main.scrollY = this.scrollYForRow(this.player.row);
    this.cameraTargetY = this.cameras.main.scrollY;

    this.inputManager.attachKeyboard(this);
    this.inputManager.attachSwipe(this);

    this.playerDropIn();

    const onBlur = () => this.pauseGame();
    this.game.events.on(Phaser.Core.Events.BLUR, onBlur);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(Phaser.Core.Events.BLUR, onBlur);
    });
  }

  // Level size varies per level (js/levels.js), so these close over this
  // instance's own this.rows/this.worldHeight/this.maxScrollY rather than
  // being bare pure functions off config.js. colToX stays a shared pure
  // function in config.js — column count never varies per level.
  rowToY(row) {
    return BOARD_TOP + row * TILE + TILE / 2;
  }

  scrollYForRow(row) {
    return Phaser.Math.Clamp(this.rowToY(row) - CAMERA_FOLLOW_Y, 0, this.maxScrollY);
  }

  update(time, delta) {
    if (this.gameEnded) return;

    this.timeText.setText(formatTime(RunTimer.elapsedMs()));

    this.updateHazards(delta);
    // No collision checking while Leonard's still dropping in — he's
    // passing straight through lanes he hasn't actually arrived at yet,
    // and dying before the intro animation even finishes would feel
    // like a bug, not a loss.
    if (!this.isLanding) {
      this.checkHazardCollision();
      if (this.gameEnded) return;
    }

    if (this.hasMoved) {
      this.updateEnvironmentAdvance(time, delta);
      if (this.gameEnded) return;
    }

    if (!this.player.isMoving) {
      const next = this.inputManager.getNextIntent();
      if (next) this.tryMovePlayer(next);
    }
  }

  drawBoard() {
    const g = this.add.graphics();
    g.fillStyle(COLORS.background, 1).fillRect(0, 0, GAME_WIDTH, this.worldHeight);

    for (let r = 0; r < this.rows; r++) {
      const y = this.rowToY(r) - TILE / 2;
      const isGoalOrStart = r === GOAL_ROW || r === this.startRow;

      if (!isGoalOrStart) {
        const lane = this.laneLayout.find((l) => l.row === r);
        // A static prop row (Level 1's grass pathway strips, or Levels
        // 2-3's furniture rows) uses its own floor texture when the level
        // defines one — Level 1's pathTexture reads as a distinct safe
        // verge rather than more road. Everything else (traffic/monster
        // lanes) already reads as its own material — tinting it the way
        // the plain start/goal tile is tinted would muddy that, so it's
        // left untinted except to mark a live monster lane (see
        // monsterLaneOverlay below), the one thing that needs to read at
        // a glance in Levels 2-3 where every hazard row shares the same
        // office_tile texture.
        const rowTexture = lane?.type === 'obstacle'
          ? (this.levelConfig.pathTexture ?? this.levelConfig.hazardTexture)
          : this.levelConfig.hazardTexture;
        this.add.tileSprite(0, y, GAME_WIDTH, TILE, rowTexture).setOrigin(0, 0);
        if (lane && lane.type === 'monster') {
          this.add.rectangle(0, y, GAME_WIDTH, TILE, COLORS.monsterLaneOverlay, 0.14).setOrigin(0, 0);
        }
      } else {
        const tint = r === GOAL_ROW ? COLORS.goalLane : COLORS.laneA;
        this.add.tileSprite(0, y, GAME_WIDTH, TILE, this.levelConfig.floorTexture).setOrigin(0, 0).setTint(tint);
      }
    }

    // Static obstacle props (table/chair/plant) — built once here, never
    // updated per-frame, since they never move.
    this.laneLayout.forEach((lane) => {
      if (lane.type !== 'obstacle') return;
      lane.occupiedCols.forEach((col, idx) => {
        this.add.image(colToX(col), this.rowToY(lane.row), lane.propTypes[idx])
          .setDisplaySize(SPRITE_SIZE * 0.85, SPRITE_SIZE * 0.85);
      });
    });
    this.obstacleCells = new Set(
      this.laneLayout.filter((l) => l.type === 'obstacle')
        .flatMap((l) => l.occupiedCols.map((col) => `${l.row},${col}`)),
    );

    // Coins — a Map (not a Set, like obstacleCells) since each entry also
    // needs to carry the sprite to destroy on collection.
    this.coinCells = new Map();
    this.coinLayout.forEach(({ row, col }) => {
      const sprite = this.add.image(colToX(col), this.rowToY(row), 'coin')
        .setDisplaySize(SPRITE_SIZE * 0.5, SPRITE_SIZE * 0.5);
      this.tweens.add({
        targets: sprite, y: '+=6', duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
      this.coinCells.set(`${row},${col}`, sprite);
    });

    g.lineStyle(3, COLORS.goalGlow, 0.9);
    g.lineBetween(0, this.rowToY(GOAL_ROW) + TILE / 2, GAME_WIDTH, this.rowToY(GOAL_ROW) + TILE / 2);

    const goal = this.add.image(GAME_WIDTH / 2, this.rowToY(GOAL_ROW), this.levelConfig.goalTexture);
    goal.setDisplaySize(SPRITE_SIZE * 1.1, SPRITE_SIZE * 1.1);
  }

  createHud() {
    const HUD_DEPTH = 1000;

    this.add.rectangle(0, 0, GAME_WIDTH, SAFE_TOP + 70, 0x0a0820, 0.6)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(HUD_DEPTH - 1);

    this.add.text(20, SAFE_TOP - 18, 'TIME', {
      fontFamily: 'Syne, sans-serif',
      fontSize: '11px',
      color: '#8b84b0',
      letterSpacing: 2,
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(HUD_DEPTH);

    this.timeText = this.add.text(20, SAFE_TOP + 12, formatTime(RunTimer.elapsedMs()), {
      fontFamily: PIXEL_FONT,
      fontSize: '26px',
      color: COLORS.hudGold,
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(HUD_DEPTH);

    this.add.text(GAME_WIDTH - 20, SAFE_TOP - 18, `LEVEL ${this.level}`, {
      fontFamily: 'Syne, sans-serif',
      fontSize: '11px',
      color: '#8b84b0',
      letterSpacing: 2,
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(HUD_DEPTH);

    this.createCoinDisplay(HUD_DEPTH);
    this.createBufferMeter(HUD_DEPTH);
    this.createPauseButton(HUD_DEPTH);
    this.createGraceHint(HUD_DEPTH);
  }

  createCoinDisplay(depth) {
    // Directly under SCORE — true top-left, as its own compact secondary
    // readout rather than competing with SCORE for the same line.
    const y = SAFE_TOP + 42;
    this.add.image(26, y, 'coin').setDisplaySize(16, 16).setScrollFactor(0).setDepth(depth);
    this.coinText = this.add.text(40, y, `${this.walletCoins}`, {
      fontFamily: PIXEL_FONT,
      fontSize: '15px',
      color: COLORS.hudGold,
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(depth);
  }

  createBufferMeter(depth) {
    const width = 100;
    const height = 6;
    const x = GAME_WIDTH - 20 - width;
    const y = SAFE_TOP + 12;

    this.add.rectangle(x, y, width, height, 0x000000, 0.3)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(depth);
    this.bufferMeterFill = this.add.rectangle(x, y, width, height, COLORS.mint, 1)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(depth);
    this.bufferMeterWidth = width;
  }

  updateBufferMeter() {
    const ratio = Phaser.Math.Clamp(this.buffer / MAX_BUFFER_PX, 0, 1);
    this.bufferMeterFill.width = this.bufferMeterWidth * ratio;
    const color = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(COLORS.danger),
      Phaser.Display.Color.ValueToColor(COLORS.mint),
      100,
      ratio * 100,
    );
    this.bufferMeterFill.setFillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
  }

  createGraceHint(depth) {
    // Stays up until the player actually moves rather than fading on a
    // fixed timer — nothing else starts happening until then either, so
    // there's no rush to read it.
    this.graceHint = this.add.text(GAME_WIDTH / 2, SAFE_TOP + 95, 'SWIPE OR ARROW KEYS TO MOVE', {
      fontFamily: 'Syne, sans-serif',
      fontSize: '12px',
      color: '#cfc9e8',
      letterSpacing: 1,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth).setAlpha(0.85);
  }

  dismissGraceHint() {
    if (!this.graceHint) return;
    const hint = this.graceHint;
    this.graceHint = null;
    this.tweens.add({
      targets: hint,
      alpha: 0,
      duration: 400,
      onComplete: () => hint.destroy(),
    });
  }

  createPauseButton(depth) {
    const cx = GAME_WIDTH / 2;
    const cy = SAFE_TOP;
    const size = 44;
    const bevel = 4;

    const shadow = this.add.rectangle(cx + bevel, cy + bevel, size, size, 0x140f24, 1).setScrollFactor(0).setDepth(depth);
    const face = this.add.rectangle(cx, cy, size, size, 0xffffff, 0.12)
      .setStrokeStyle(2, 0xffffff, 0.35)
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0)
      .setDepth(depth);
    const barLeft = this.add.rectangle(cx - 6, cy, 5, 16, COLORS.hudCream).setScrollFactor(0).setDepth(depth);
    const barRight = this.add.rectangle(cx + 6, cy, 5, 16, COLORS.hudCream).setScrollFactor(0).setDepth(depth);

    const press = () => { [face, barLeft, barRight].forEach((o) => o.setPosition(o.x + bevel, o.y + bevel)); };
    const release = () => { face.setPosition(cx, cy); barLeft.setPosition(cx - 6, cy); barRight.setPosition(cx + 6, cy); };

    face.on('pointerdown', () => { press(); this.pauseGame(); });
    face.on('pointerup', release);
    face.on('pointerout', release);
  }

  createPlayer() {
    const landingY = this.rowToY(this.startRow);
    // Starts one full sprite-height above the visible top edge — computed
    // straight off scrollYForRow rather than the camera's own scrollY
    // (not assigned until after this runs), so it's off-screen regardless
    // of call order.
    const dropStartY = this.scrollYForRow(this.startRow) - SPRITE_SIZE;

    const container = this.add.container(colToX(START_COL), dropStartY);
    // Starts small and invisible, growing in as he falls — the usual
    // "shadow anticipates the landing" cue from platformers.
    const shadow = this.add.ellipse(0, SPRITE_SIZE * 0.32, SPRITE_SIZE * 0.7, SPRITE_SIZE * 0.28, 0x000000, 0.3)
      .setAlpha(0).setScale(0.4);
    const charTexture = getCharacterConfig(getSelectedCharacterSync()).texture;
    const sprite = this.add.image(0, 0, charTexture);
    sprite.setDisplaySize(SPRITE_SIZE, SPRITE_SIZE);
    container.add([shadow, sprite]);
    this.player = { container, col: START_COL, row: this.startRow, isMoving: false };
    this.playerShadow = shadow;
    this.playerSprite = sprite;
    this.playerLandingY = landingY;
  }

  // --- intro drop-in ----------------------------------------------------

  playerDropIn() {
    this.isLanding = true;
    this.player.isMoving = true; // reuses the same guard tryMovePlayer already checks

    const DROP_DURATION = 700;
    this.tweens.add({
      targets: this.player.container,
      y: this.playerLandingY,
      duration: DROP_DURATION,
      ease: 'Cubic.easeIn', // accelerates like gravity
      onComplete: () => this.playerLandingImpact(),
    });
    this.tweens.add({
      targets: this.playerShadow,
      alpha: 0.3,
      scale: 1,
      duration: DROP_DURATION,
      ease: 'Cubic.easeIn',
    });
  }

  playerLandingImpact() {
    this.player.isMoving = false;
    this.isLanding = false;
    this.cameras.main.shake(90, 0.004); // a light thud, distinct from the stronger death shakes
    AudioManager.playSfx(SFX_KEYS.LAND);
    // Anchored here (not create()) rather than at scene start, so it
    // fires exactly once per level, right as control is actually handed
    // to the player — and since it's the same key every level, this is a
    // no-op-that-continues on Levels 2-3, never a restart.
    AudioManager.playMusic(MUSIC_KEYS.GAMEPLAY, { volume: 0.4 });

    const sprite = this.playerSprite;
    this.tweens.add({
      targets: sprite,
      scaleX: sprite.scaleX * 1.25,
      scaleY: sprite.scaleY * 0.65,
      duration: 90,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  // --- hazard lanes (cars in Level 1, kueh monsters in Levels 2-3) -----
  //
  // A car and a monster are mechanically identical: a horizontally-moving
  // sprite with a direction, speed, hitbox, and spawn cadence. One engine
  // drives both — only spawnHazard() branches by lane.type (texture and
  // footprint), never the per-frame update/collision loops.

  setupHazardLanes() {
    this.laneLayout.forEach((lane) => {
      if (lane.type === 'obstacle') return; // static — no spawn loop
      const scheduleNext = (delay) => {
        this.time.delayedCall(delay, () => {
          if (this.gameEnded) return;
          this.spawnHazard(lane);
          scheduleNext(lane.spawnGapMs * Phaser.Math.FloatBetween(0.7, 1.3));
        });
      };
      scheduleNext(Phaser.Math.Between(0, lane.spawnGapMs));
    });
  }

  spawnHazard(lane) {
    const isTraffic = lane.type === 'traffic';
    const texture = isTraffic ? 'car' : Phaser.Utils.Array.GetRandom(DEATH_MONSTER_TEXTURES);
    const w = isTraffic ? CAR_WIDTH : MONSTER_WIDTH;
    const h = isTraffic ? CAR_HEIGHT : MONSTER_HEIGHT;
    const y = this.rowToY(lane.row);
    const startX = lane.dir === 1 ? -w : GAME_WIDTH + w;
    const sprite = this.add.image(startX, y, texture);
    sprite.setDisplaySize(w, h);
    sprite.setFlipX(lane.dir === -1);
    if (isTraffic) sprite.setTint(lane.isFast ? 0xffb0a8 : 0xbfe8ff);
    this.hazards.push({ sprite, dir: lane.dir, speed: lane.speed, halfW: w * 0.4, halfH: h * 0.4 });
  }

  updateHazards(delta) {
    const dt = delta / 1000;
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const hazard = this.hazards[i];
      hazard.sprite.x += hazard.dir * hazard.speed * dt;
      const w = hazard.halfW * 2;
      const outLeft = hazard.dir === -1 && hazard.sprite.x < -w;
      const outRight = hazard.dir === 1 && hazard.sprite.x > GAME_WIDTH + w;
      if (outLeft || outRight) {
        hazard.sprite.destroy();
        this.hazards.splice(i, 1);
      }
    }
  }

  checkHazardCollision() {
    const px = this.player.container.x;
    const py = this.player.container.y;
    const hitHalf = SPRITE_SIZE * 0.32;

    for (const hazard of this.hazards) {
      if (Math.abs(px - hazard.sprite.x) < hazard.halfW + hitHalf && Math.abs(py - hazard.sprite.y) < hazard.halfH + hitHalf) {
        this.killByHazard();
        return;
      }
    }
  }

  killByHazard() {
    this.gameEnded = true;
    if (this.level === 1) {
      this.playEagleGrab();
    } else {
      this.playMonsterLunge();
    }
  }

  // Levels 2-3 ("in the building"): the original kueh-monster lunge.
  playMonsterLunge() {
    const monsterRow = this.player.row + 1;
    const monster = this.spawnDeathMonster(this.player.col, monsterRow);
    this.tweens.add({
      targets: monster,
      x: this.player.container.x,
      y: this.player.container.y,
      duration: 260,
      ease: 'Quad.easeIn',
      onComplete: () => this.finishLose('hazard'),
    });
  }

  spawnDeathMonster(col, row) {
    const texture = Phaser.Utils.Array.GetRandom(DEATH_MONSTER_TEXTURES);
    const monster = this.add.image(colToX(col), this.rowToY(row), texture);
    monster.setDisplaySize(SPRITE_SIZE, SPRITE_SIZE);
    monster.setDepth(500);
    return monster;
  }

  // Level 1 ("crossing the road"): the hit registers immediately (the same
  // red shake+flash as any other hazard death), and only once that's read
  // does the eagle swoop in, grab the player, and carry them off the top
  // of the screen.
  playEagleGrab() {
    this.flashHazardHit();
    this.time.delayedCall(250, () => this.spawnEagleCarry());
  }

  spawnEagleCarry() {
    const px = this.player.container.x;
    const py = this.player.container.y;
    const eagleSize = SPRITE_SIZE * 1.7;
    // Swoops in from whichever side, at random, so it doesn't always read
    // identically — the carry-off continues in the opposite direction.
    const fromRight = Phaser.Math.Between(0, 1) === 1;
    const startX = px + (fromRight ? 1 : -1) * SPRITE_SIZE * 2.5;
    const startY = py - SPRITE_SIZE * 3;
    const grabY = py - SPRITE_SIZE * 0.1;

    const eagle = this.add.image(startX, startY, 'eagle');
    eagle.setDisplaySize(eagleSize, eagleSize);
    eagle.setDepth(500);
    eagle.setFlipX(fromRight);

    this.tweens.add({
      targets: eagle,
      x: px,
      y: grabY,
      duration: 220,
      ease: 'Quad.easeIn',
      onComplete: () => {
        eagle.setPosition(px, grabY);
        const exitX = px + (fromRight ? -1 : 1) * SPRITE_SIZE * 6;
        const exitY = this.cameras.main.scrollY - SPRITE_SIZE * 3;
        this.tweens.add({
          targets: [eagle, this.player.container],
          x: exitX,
          y: exitY,
          duration: 550,
          ease: 'Quad.easeIn',
          onComplete: () => this.finishLose('hazard', { skipImpactFx: true }),
        });
      },
    });
  }

  // --- environment auto-advance -----------------------------------------
  //
  // The survival "buffer" is an independent countdown, not something
  // derived from camera scrollY — scrollY is clamped to [0, this.maxScrollY]
  // for legitimate rendering reasons (can't scroll past the world edges)
  // and would hit that floor partway through a normal run, silently
  // disabling the danger for the rest of the game. Camera scrollY here is
  // purely cosmetic: a continuous auto-pan so the environment visibly
  // advances even when the player doesn't move, independent of whatever
  // is actually threatening them.

  updateEnvironmentAdvance(time, delta) {
    const dt = delta / 1000;

    if (time - this.gameplayStartAt > START_GRACE_MS) {
      this.buffer -= ENVIRONMENT_ADVANCE_SPEED * dt;
      this.updateBufferMeter();
      if (this.buffer <= 0) {
        this.triggerCaught();
        return;
      }
    }

    this.cameraTargetY = Phaser.Math.Clamp(
      this.cameraTargetY - ENVIRONMENT_ADVANCE_SPEED * dt,
      0, this.maxScrollY,
    );
    // Ease toward the target rather than jumping straight to it — the
    // target itself can move in sudden steps (chained moves each pull it
    // forward instantly), but the rendered camera always glides.
    this.cameras.main.scrollY = Phaser.Math.Linear(
      this.cameras.main.scrollY, this.cameraTargetY, CAMERA_SMOOTH,
    );

    // Safety net: scrollY only ever moves forward (the passive tick, plus
    // tryMovePlayer's forward-only pull), so a player who retreats after
    // banking forward progress can end up positioned below the visible
    // viewport while the buffer still has charge left — technically
    // alive but genuinely invisible. That's a loss regardless of buffer.
    const viewBottom = this.cameras.main.scrollY + GAME_HEIGHT;
    if (this.player.container.y - SPRITE_SIZE / 2 > viewBottom) {
      this.triggerCaught();
    }
  }

  triggerCaught() {
    this.gameEnded = true;
    // A subtle jolt right as the catch registers — gentler than the
    // hazard-collision shake, since this death is otherwise just a silent
    // fade with no other feedback that anything happened.
    this.cameras.main.shake(180, 0.006);
    const blackout = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(2000);
    this.tweens.add({
      targets: blackout,
      alpha: 1,
      duration: 350,
      onComplete: () => this.finishLose('caught'),
    });
  }

  // --- player movement -----------------------------------------------

  moveEntity(entity, targetCol, targetRow, duration, onComplete) {
    entity.isMoving = true;
    this.tweens.add({
      targets: entity.container,
      x: colToX(targetCol),
      y: this.rowToY(targetRow),
      duration,
      ease: 'Quad.easeOut',
      onComplete: () => {
        entity.col = targetCol;
        entity.row = targetRow;
        entity.isMoving = false;
        if (onComplete) onComplete();
      },
    });
  }

  tryMovePlayer(direction) {
    if (this.gameEnded || this.player.isMoving) return;
    let { col, row } = this.player;
    if (direction === 'up') row -= 1;
    else if (direction === 'down') row += 1;
    else if (direction === 'left') col -= 1;
    else if (direction === 'right') col += 1;

    col = Phaser.Math.Clamp(col, 0, COLS - 1);
    row = Phaser.Math.Clamp(row, 0, this.startRow);
    if (col === this.player.col && row === this.player.row) return;
    if (this.obstacleCells.has(`${row},${col}`)) return; // blocked by furniture — same as a no-op move

    // Every early-return above this line covers the "not actually
    // moving" cases (game over, mid-move, screen edge, blocked cell) — so
    // this fires exactly once per genuinely-accepted move. A touch of
    // pitch variation keeps it from sounding robotic on repeat.
    AudioManager.playSfx(SFX_KEYS.MOVE, { volume: 0.5, rate: Phaser.Math.FloatBetween(0.95, 1.05) });

    const coinKey = `${row},${col}`;
    if (this.coinCells.has(coinKey)) this.collectCoin(coinKey);

    if (!this.hasMoved) {
      // Nothing auto-advances until the player acts for the first time —
      // they get unlimited time to see where they are before any
      // pressure starts. The grace period below then applies from here,
      // not from scene start.
      this.hasMoved = true;
      this.gameplayStartAt = this.time.now;
      // The run's clock covers the whole 3-level run, not one level, so it
      // only ever starts on Level 1's first move — Levels 2-3 inherit the
      // already-running RunTimer untouched.
      if (this.level === 1) RunTimer.start();
      this.dismissGraceHint();
    }

    // Moving can only ever pull the camera target further forward than
    // wherever the passive auto-advance has already brought it — never
    // backward. The rendered camera eases toward this target every frame
    // in updateEnvironmentAdvance, rather than jumping to it here.
    this.cameraTargetY = Math.min(this.cameraTargetY, this.scrollYForRow(row));
    if (row < this.player.row) {
      this.buffer = Math.min(MAX_BUFFER_PX, this.buffer + BUFFER_REFILL_PX);
      this.updateBufferMeter();
    }

    this.moveEntity(this.player, col, row, MOVE_DURATION, () => this.onPlayerMoveComplete());
  }

  collectCoin(coinKey) {
    const sprite = this.coinCells.get(coinKey);
    this.coinCells.delete(coinKey);
    this.tweens.add({
      targets: sprite,
      scale: sprite.scale * 1.6,
      alpha: 0,
      duration: 180,
      ease: 'Quad.easeOut',
      onComplete: () => sprite.destroy(),
    });
    this.walletCoins = addCoins(1);
    this.coinText.setText(`${this.walletCoins}`);
    AudioManager.playSfx(SFX_KEYS.COIN);
  }

  onPlayerMoveComplete() {
    if (this.gameEnded) return;
    if (this.player.row === GOAL_ROW) this.reachGoal();
  }

  // --- end states ------------------------------------------------------

  reachGoal() {
    this.gameEnded = true;
    AudioManager.playSfx(SFX_KEYS.WIN);
    // Ducking (not stopping) is what makes this read as a transition
    // rather than a cut — the jingle plays over a softened, still-running
    // bed. Levels 1-2 auto-un-duck the instant the next level's
    // playerLandingImpact() calls playMusic() again (same key, idempotent
    // replay); the true Level-3 win never makes that call again, so the
    // bed stays softly audible under "YOU MADE IT!" rather than dying.
    AudioManager.duckMusic({ to: 0.25, fadeMs: 250 });
    this.cameras.main.flash(300, 56, 211, 159);
    if (this.level < LEVELS.length) {
      this.time.delayedCall(500, () =>
        this.scene.start('LevelIntro', { level: this.level + 1 }));
    } else {
      // The run's clock stops the instant the true final goal is reached,
      // not 500ms later when the scene actually transitions — the flash/
      // delay below is presentation, it shouldn't pad the recorded time.
      const timeMs = RunTimer.stop();
      reportTime(timeMs).then(({ isNewBest }) => {
        this.time.delayedCall(500, () =>
          this.scene.start('GameOver', { result: 'win', timeMs, isNewBest }));
      });
    }
  }

  // The shared "you got hit" shake+flash — pulled out of finishLose so the
  // eagle grab can fire it immediately on impact, well before finishLose
  // itself is called at the end of the carry-off animation.
  flashHazardHit() {
    this.cameras.main.shake(200, 0.01);
    this.cameras.main.flash(200, 255, 77, 109);
  }

  finishLose(cause, { skipImpactFx = false } = {}) {
    AudioManager.playSfx(SFX_KEYS.LOSE);
    // The 'caught' death already has its own dedicated visual (the
    // blackout fade in triggerCaught) — shake/flash on top of a fully
    // opaque screen would just be a pointless colour blip on black. The
    // eagle grab also skips it here since it already fired at the moment
    // of impact, before the carry-off animation played out.
    if (cause !== 'caught' && !skipImpactFx) {
      this.flashHazardHit();
    }
    // A loss never reports to the best-time/leaderboard — an incomplete
    // run has no meaningful finish time. The elapsed time still shown on
    // Game Over is flavour only.
    const timeMs = RunTimer.elapsedMs();
    this.time.delayedCall(450, () => this.scene.start('GameOver', { result: 'lose', timeMs, cause }));
  }

  pauseGame() {
    if (this.gameEnded || this.isPaused) return;
    this.isPaused = true;
    RunTimer.pause();
    AudioManager.duckMusic({ to: 0.12 });
    this.scene.pause();
    this.scene.launch('Pause', { gameScene: this });
  }

  resumeGame() {
    this.isPaused = false;
    RunTimer.resume();
    AudioManager.unduckMusic();
    this.scene.resume();
  }
}
