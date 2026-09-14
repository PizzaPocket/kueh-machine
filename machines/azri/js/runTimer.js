// A run's clock, kept outside any Scene the same way AudioManager keeps
// music state outside any Scene (see js/audio.js's header) — GameScene is
// torn down and recreated at every level transition, so anything living
// on `this` inside it can't survive Level 1 -> Level 2 -> Level 3. This is
// a plain module-scoped singleton instead, using wall-clock Date.now()
// rather than any Scene's own `this.time`, which resets per instance.

class RunTimerImpl {
  constructor() {
    this.startedAt = null;
    this.pausedMs = 0;
    this.pauseStartedAt = null;
    this.finalMs = null;
  }

  start() {
    this.startedAt = Date.now();
    this.pausedMs = 0;
    this.pauseStartedAt = null;
    this.finalMs = null;
  }

  pause() {
    if (this.startedAt == null || this.pauseStartedAt != null) return;
    this.pauseStartedAt = Date.now();
  }

  resume() {
    if (this.pauseStartedAt == null) return;
    this.pausedMs += Date.now() - this.pauseStartedAt;
    this.pauseStartedAt = null;
  }

  // Freezes the run's final time — elapsedMs() keeps returning this exact
  // value afterward regardless of how much real time passes on the Game
  // Over screen.
  stop() {
    this.finalMs = this.elapsedMs();
    return this.finalMs;
  }

  elapsedMs() {
    if (this.finalMs != null) return this.finalMs;
    if (this.startedAt == null) return 0;
    const now = Date.now();
    const activePause = this.pauseStartedAt != null ? now - this.pauseStartedAt : 0;
    return Math.max(0, now - this.startedAt - this.pausedMs - activePause);
  }
}

export const RunTimer = new RunTimerImpl();

// mm:ss.t — tenths, not hundredths: plenty precise for a run measured in
// tens of seconds, without the display looking twitchy on every tick.
// formatTime(0) is used everywhere as the "no time recorded yet" case
// (a real run is never actually 0ms), so it gets its own placeholder
// rather than printing a nonsensical "0:00.0".
export function formatTime(ms) {
  if (!ms || ms <= 0) return '--:--';
  const totalTenths = Math.floor(ms / 100);
  const minutes = Math.floor(totalTenths / 600);
  const seconds = Math.floor((totalTenths % 600) / 10);
  const tenths = totalTenths % 10;
  return `${minutes}:${String(seconds).padStart(2, '0')}.${tenths}`;
}
