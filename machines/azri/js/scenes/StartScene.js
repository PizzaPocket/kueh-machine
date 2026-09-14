import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config.js';
import { getLocalBestTimeSync, getBestTime } from '../progress.js';
import { formatTime } from '../runTimer.js';
import { PIXEL_FONT } from '../ui.js';
import { AudioManager, SFX_KEYS, MUSIC_KEYS } from '../audio.js';

export default class StartScene extends Phaser.Scene {
  constructor() {
    super('Start');
  }

  create() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Defensive reset — a no-op on first load, but matters for the
    // BACK TO MENU path from GameOverScene, so a ducked win/lose tail (or
    // gameplay music) never bleeds onto this screen.
    AudioManager.stopMusic({ fadeMs: 500 });

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.background, 1).setOrigin(0);

    // Full-bleed looping hero video. This is the very first screen a
    // player ever sees, reached before any tap or gesture at all — every
    // major browser silently blocks autoplay unless the video is muted
    // (and inline, or iOS Safari forces it fullscreen instead).
    // Starts invisible and fades in slightly after playback begins —
    // video decoders can throw a garbled/corrupted frame or two while
    // warming up on the very first frames, and holding it hidden for a
    // beat covers that regardless of the exact cause, while also just
    // reading as a nicer, deliberate fade-in rather than a hard pop-in.
    const video = this.add.video(cx, cy, 'heroVideo').setOrigin(0.5).setAlpha(0);
    // The GameObject's real width/height aren't known synchronously at
    // creation — Phaser fires 'created' once the video's actual texture
    // dimensions are established, and sizing before that (e.g. reading
    // video.width immediately) picks up a placeholder value instead.
    video.once('created', () => {
      // Cover-fit rather than contain — the video's own aspect ratio
      // (roughly 9:16) doesn't exactly match our 390:844 design ratio,
      // so this crops a little off the sides rather than letterboxing.
      const scale = Math.max(GAME_WIDTH / video.width, GAME_HEIGHT / video.height);
      video.setDisplaySize(video.width * scale, video.height * scale);
    });
    video.video.muted = true;
    video.video.playsInline = true;
    video.play(true);
    this.tweens.add({ targets: video, alpha: 1, duration: 300, delay: 200, ease: 'Sine.easeOut' });

    // The video already carries its own title reveal ("RUN KUEH RUN")
    // and its own "TAP TO START" prompt baked in, appearing partway into
    // the loop and holding — same "don't duplicate what's already in the
    // art" call this screen made for the previous static illustration.
    // Only the genuinely dynamic bits (the score, the credit) get their
    // own text here, kept out of the way at the very top and bottom.
    this.add.graphics()
      .fillGradientStyle(0x0a0820, 0x0a0820, 0x0a0820, 0x0a0820, 0.7, 0.7, 0, 0)
      .fillRect(0, 0, GAME_WIDTH, 90);
    this.add.graphics()
      .fillGradientStyle(0x0a0820, 0x0a0820, 0x0a0820, 0x0a0820, 0, 0, 0.7, 0.7)
      .fillRect(0, GAME_HEIGHT - 90, GAME_WIDTH, 90);

    const scoreText = this.add.text(cx, 40, `BEST: ${formatTime(getLocalBestTimeSync())}`, {
      fontFamily: PIXEL_FONT,
      fontSize: '13px',
      color: COLORS.mint,
    }).setOrigin(0.5);
    getBestTime().then((best) => scoreText.setText(`BEST: ${formatTime(best)}`));

    const leaderboardLink = this.add.text(cx, 58, 'LEADERBOARD ›', {
      fontFamily: 'Syne, sans-serif',
      fontSize: '11px',
      color: '#cfc9e8',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    leaderboardLink.on('pointerdown', () => this.scene.start('Leaderboard', { returnTo: { scene: 'Start' } }));

    // Sparse, irregular electrical clicks and a soft periodic pulse,
    // matching the lightning/rooftop-machine mood — random rather than
    // synchronized to any specific visual beat, since the video's own
    // flicker animation isn't something this code can hook an event into.
    // Browsers block audio autoplay without a user gesture, and this
    // screen's only gesture (tap) also immediately navigates away, so in
    // practice these are very unlikely to be heard before that tap — kept
    // scheduled anyway (harmless, correct if a browser is ever lenient)
    // rather than silently dropped.
    const scheduleClick = () => {
      this.time.delayedCall(Phaser.Math.Between(2500, 6000), () => {
        AudioManager.playSfx(SFX_KEYS.CLICK, { volume: 0.25, rate: Phaser.Math.FloatBetween(0.9, 1.15) });
        scheduleClick();
      });
    };
    scheduleClick();

    const schedulePulse = () => {
      this.time.delayedCall(1800, () => {
        AudioManager.playSfx(SFX_KEYS.PULSE, { volume: 0.3 });
        schedulePulse();
      });
    };
    schedulePulse();

    // A rarer, bigger thunder crack for the video's own lightning strikes —
    // distinct from the small electrical clicks above, and spaced out
    // enough to land as a genuine "moment" rather than a loop.
    const scheduleThunder = () => {
      this.time.delayedCall(Phaser.Math.Between(7000, 14000), () => {
        AudioManager.playSfx(SFX_KEYS.THUNDER, { volume: 0.4 });
        scheduleThunder();
      });
    };
    scheduleThunder();

    let begun = false;
    const beginGame = () => {
      if (begun) return;
      begun = true;

      // AudioManager.playMusic itself now waits for the audio-unlock signal
      // when needed (sounds started before the browser unlocks audio never
      // actually play) — no separate sound.locked dance required here.
      AudioManager.playMusic(MUSIC_KEYS.THEME_SONG, { volume: 0.3, fadeMs: 150 });

      const fadeOut = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0)
        .setOrigin(0).setDepth(100);
      this.tweens.add({
        targets: fadeOut,
        alpha: 1,
        duration: 450,
        onComplete: () => this.scene.start('Story'),
      });
    };

    this.input.once('pointerdown', beginGame);
    // Backup: if anything ever sits between the pointer and the canvas
    // (an overlay, a browser quirk) and swallows that first tap before
    // Phaser's own canvas-scoped input sees it, a gesture landing
    // anywhere else on the page still reaches here and starts the game —
    // matching what's actually been observed to unstick this screen.
    const onDocumentGesture = () => beginGame();
    document.addEventListener('pointerdown', onDocumentGesture, { once: true });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      document.removeEventListener('pointerdown', onDocumentGesture);
    });
  }
}
