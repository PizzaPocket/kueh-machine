// The one module that owns all sound playback. Phaser's Sound Manager is
// global (one instance per Game, reachable as `game.sound`/`scene.sound`
// from any scene) — this wraps it with the cross-scene state a game needs
// on top: which music track is "the" currently playing one, crossfading
// between tracks, and ducking/unducking without restarting anything.
//
// The fade/crossfade engine is driven by a raw requestAnimationFrame loop
// living at module scope, not by any Scene's tweens/time — a fade started
// right as a Scene is mid-transition (e.g. ducking on death, right before
// GameScene shuts down) must not have its owning Scene torn down out from
// under it. No audio state's lifetime is ever coupled to a Scene
// instance's lifetime, the same class of bug this project already hit
// once with LevelIntroScene's reused-instance guard flag.

export const SFX_KEYS = {
  MOVE: 'sfx-move',
  LAND: 'sfx-land',
  WIN: 'sfx-win',
  LOSE: 'sfx-lose',
  CLICK: 'sfx-click',
  PULSE: 'sfx-pulse',
  THUNDER: 'sfx-thunder',
  TEXT_BLIP: 'sfx-textblip',
  COIN: 'sfx-coin',
};

export const MUSIC_KEYS = {
  // One shared track for the Start Screen and the story sequence — using
  // the same key for both means AudioManager.playMusic's same-key no-op
  // (see below) lets it keep playing gaplessly across that transition
  // instead of restarting or crossfading into itself.
  THEME_SONG: 'music-theme-song',
  GAMEPLAY: 'music-gameplay',
};

export const AUDIO_MANIFEST = [
  { key: SFX_KEYS.MOVE, url: 'assets/audio/sfx-move.wav' },
  { key: SFX_KEYS.LAND, url: 'assets/audio/sfx-land.wav' },
  { key: SFX_KEYS.WIN, url: 'assets/audio/sfx-win.wav' },
  { key: SFX_KEYS.LOSE, url: 'assets/audio/sfx-lose.wav' },
  { key: SFX_KEYS.CLICK, url: 'assets/audio/sfx-click.wav' },
  { key: SFX_KEYS.PULSE, url: 'assets/audio/sfx-pulse.wav' },
  { key: SFX_KEYS.THUNDER, url: 'assets/audio/sfx-thunder.wav' },
  { key: SFX_KEYS.TEXT_BLIP, url: 'assets/audio/sfx-textblip.wav' },
  { key: SFX_KEYS.COIN, url: 'assets/audio/sfx-coin.wav' },
  { key: MUSIC_KEYS.THEME_SONG, url: 'assets/audio/song-bg.m4a' },
  { key: MUSIC_KEYS.GAMEPLAY, url: 'assets/audio/music-gameplay.wav' },
];

const DEFAULT_SFX_VOLUME = 0.6;
const DEFAULT_MUSIC_VOLUME = 0.4;
const DEFAULT_DUCK_VOLUME = 0.15;

class AudioManagerImpl {
  constructor() {
    this._sound = null;
    this._musicKey = null;
    this._musicSound = null;
    this._musicTargetVolume = 0;
    this._pendingMusicKey = null;
    this._ducked = false;
    this._fades = new Map(); // Sound instance -> in-flight fade record
    this._rafId = null;
  }

  // Called once from main.js right after `new Phaser.Game(...)`.
  init(game) {
    if (this._sound) return;
    this._sound = game.sound;
  }

  // --- one-shot SFX -------------------------------------------------

  playSfx(key, { volume = DEFAULT_SFX_VOLUME, rate = 1 } = {}) {
    if (!this._sound) return;
    try {
      this._sound.play(key, { volume, rate });
    } catch (err) {
      // Best-effort, matches progress.js's "never block gameplay" philosophy.
      console.warn(`[audio] sfx "${key}" failed to play:`, err);
    }
  }

  // --- music / ambient bed (one active slot) -------------------------

  // Idempotent: calling this with the SAME key that's already playing is
  // a deliberate no-op (no restart-blip) — this is what makes gameplay
  // music continue gaplessly across Level 1 -> LevelIntro -> Level 2 ->
  // LevelIntro -> Level 3, since GameScene's own instance is destroyed
  // and recreated at every level transition but calls this with the same
  // key each time. It still un-ducks on a repeat call, so a duck can
  // never silently leak across a scene transition.
  playMusic(key, { volume = DEFAULT_MUSIC_VOLUME, fadeMs = 600, loop = true } = {}) {
    if (!this._sound) return;

    if (this._musicKey === key && this._musicSound?.isPlaying) {
      this._musicTargetVolume = volume;
      if (this._ducked) this.unduckMusic();
      return;
    }

    // A sound started while the browser hasn't unlocked audio yet never
    // actually plays — every caller used to need its own sound.locked/
    // UNLOCKED dance to avoid that (only the Start Screen had one; a scene
    // reached shortly after, like the story sequence, had no such guard
    // and could silently lose its very first playMusic call on a device
    // where unlock hasn't finished by the time it runs). Handling it once,
    // here, means every caller gets this for free. A second call for the
    // SAME key while one is already waiting on unlock just updates the
    // target volume rather than queuing a duplicate deferred start.
    if (this._sound.locked) {
      if (this._pendingMusicKey === key) {
        this._musicTargetVolume = volume;
        return;
      }
      this._pendingMusicKey = key;
      this._musicTargetVolume = volume;
      this._sound.once(Phaser.Sound.Events.UNLOCKED, () => {
        if (this._pendingMusicKey !== key) return; // superseded by a newer call
        this._pendingMusicKey = null;
        this.playMusic(key, { volume: this._musicTargetVolume, fadeMs, loop });
      });
      return;
    }

    try {
      // play()'s own internal setup applies its volume config asynchronously
      // (some ms after play() returns, once the audio buffer actually
      // connects) — reading sound.volume synchronously right after play()
      // catches Phaser's stale default (~1) rather than the 0 just
      // requested. Fading from an explicit 0 rather than a synchronous read
      // sidesteps the race entirely; the per-frame tick loop re-asserts the
      // fade's own math every frame regardless, so even if Phaser's
      // deferred correction lands mid-fade it's outweighed within one frame.
      const incoming = this._sound.add(key, { loop });
      incoming.play('', { loop, volume: 0 });
      this._fadeTo(incoming, volume, fadeMs, undefined, 0);

      const outgoing = this._musicSound;
      if (outgoing) this._fadeTo(outgoing, 0, fadeMs, () => outgoing.destroy());

      this._musicKey = key;
      this._musicSound = incoming;
      this._musicTargetVolume = volume;
      this._ducked = false;
    } catch (err) {
      console.warn(`[audio] music "${key}" failed to play:`, err);
    }
  }

  stopMusic({ fadeMs = 400 } = {}) {
    if (!this._musicSound) return;
    const s = this._musicSound;
    this._fadeTo(s, 0, fadeMs, () => s.destroy());
    this._musicKey = null;
    this._musicSound = null;
    this._ducked = false;
  }

  duckMusic({ to = DEFAULT_DUCK_VOLUME, fadeMs = 200 } = {}) {
    if (!this._musicSound || this._ducked) return;
    this._ducked = true;
    this._fadeTo(this._musicSound, to, fadeMs);
  }

  unduckMusic({ fadeMs = 300 } = {}) {
    if (!this._musicSound || !this._ducked) return;
    this._ducked = false;
    this._fadeTo(this._musicSound, this._musicTargetVolume, fadeMs);
  }

  // --- fade engine: module-scoped rAF loop, zero Scene dependency ----

  _fadeTo(sound, target, duration, onComplete, fromOverride) {
    // Keyed by Sound instance — an entry for a sound that already has one
    // in flight is simply replaced, so there is never more than one fade
    // per sound object. A crossfade needs two simultaneous entries (the
    // incoming track fading up, the outgoing one fading down), which is
    // why this is a Map rather than a single "current fade" field.
    const from = fromOverride ?? sound.volume;
    this._fades.set(sound, {
      from, to: target, elapsed: 0, duration: Math.max(duration, 1), onComplete,
    });
    this._ensureLoop();
  }

  _ensureLoop() {
    if (this._rafId != null) return;
    let last = performance.now();
    const tick = (now) => {
      const delta = now - last;
      last = now;
      for (const [sound, fade] of this._fades) {
        fade.elapsed += delta;
        const t = Math.min(1, fade.elapsed / fade.duration);
        sound.setVolume(Phaser.Math.Linear(fade.from, fade.to, t));
        if (t >= 1) {
          this._fades.delete(sound);
          fade.onComplete?.();
        }
      }
      this._rafId = this._fades.size ? requestAnimationFrame(tick) : null;
    };
    this._rafId = requestAnimationFrame(tick);
  }
}

export const AudioManager = new AudioManagerImpl();
