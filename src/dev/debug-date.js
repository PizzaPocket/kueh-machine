// Dev-only tool: lets you simulate "now" around the showcase boundary so
// the final water-clock-to-ENTER transition can be tested without changing
// the system clock. Never shown to a normal visitor; only renders with
// ?debug=1.
//
// Overrides Date.now() only, not `new Date()` with no arguments (a
// separate, unpatchable read of the system clock) — every date-driven
// module in this codebase reads "now" via Date.now(), never a bare
// `new Date()` (the only no-arg `new Date()` call on the whole site is
// index.html's footer copyright year, harmless to leave real). Re-check
// that's still true with `grep -rn "Date\.now()\|new Date(" src/ index.html`
// before relying on this if new date-driven code gets added.
//
// The override is applied from a `?asOf=<timestamp>` URL param rather than
// an in-memory variable, and every preset/submit reloads the page with
// that param set — a fresh load re-runs every organism's init() (the
// scissors-cut sequence, the day-index math, the archive gate) exactly as
// it would on a real visit on that date, rather than trying to patch
// already-running state on the fly.

const ASOF_PARAM = 'asOf';
const PROJECT_START_UTC = Date.UTC(2026, 5, 24, 6, 0, 0); // 24 June 2026, 2:00pm SGT
const CHECKIN_UTC = Date.UTC(2026, 6, 29, 6, 0, 0); // 29 July 2026, 2:00pm SGT
const SHOWCASE_UTC = Date.UTC(2026, 7, 26, 6, 0, 0); // 26 August 2026, 2:00pm SGT
const DAY_MS = 24 * 60 * 60 * 1000;

function readParams() {
  return new URLSearchParams(window.location.search);
}

function reloadWithAsOf(timestamp) {
  const params = readParams();
  if (timestamp === null) params.delete(ASOF_PARAM);
  else params.set(ASOF_PARAM, String(timestamp));
  window.location.search = params.toString();
}

function pad(n) {
  return String(n).padStart(2, '0');
}

// datetime-local inputs want "YYYY-MM-DDTHH:mm" in the input's own local
// (browser) timezone — building this from getFullYear/etc. rather than
// toISOString avoids the UTC-vs-local mismatch toISOString would introduce.
function toDatetimeLocalValue(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    #debug-date-panel {
      position: fixed;
      bottom: 12px;
      right: 12px;
      z-index: 9999;
      background: var(--color-surface, #fff8f0);
      color: var(--color-text-on-surface, #5c1638);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 12px;
      line-height: 1.5;
      padding: 14px;
      border: 1px solid var(--color-surface-border, #d6c8b4);
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(92, 22, 56, 0.2);
      max-width: 310px;
    }
    #debug-date-panel strong {
      display: block;
      margin-bottom: 8px;
      color: var(--color-primary-strong, #b72e68);
      font-family: "Syne", sans-serif;
      font-size: 14px;
    }
    #debug-date-panel .debug-date-row { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
    #debug-date-panel input[type="datetime-local"] {
      flex: 1;
      min-width: 0;
      font-size: 12px;
      padding: 3px 5px;
      border-radius: 4px;
      border: 1px solid var(--color-surface-border, #d6c8b4);
      background: #fff;
      color: var(--color-text-on-surface, #5c1638);
    }
    #debug-date-panel button {
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 4px;
      border: none;
      background: var(--color-primary-strong, #b72e68);
      color: var(--color-text-on-primary, #fbe0ec);
      cursor: pointer;
    }
    #debug-date-panel button:hover { background: var(--color-text-on-surface, #5c1638); }
    #debug-date-panel .debug-date-step { flex: 1; font-weight: 700; }
    #debug-date-panel .debug-date-status {
      margin: 0;
      color: var(--color-text-on-surface-muted, #8c4569);
      word-break: break-word;
    }
    @media (max-width: 640px) {
      #debug-date-panel { left: 10px; right: 10px; bottom: 10px; max-width: none; }
    }
  `;
  document.head.appendChild(style);
}

function buildPanel() {
  const panel = document.createElement('div');
  panel.id = 'debug-date-panel';
  panel.innerHTML = `
    <strong>Project Brief Time Machine</strong>
    <div class="debug-date-row">
      <button class="debug-date-step" type="button" data-step="-1">← Previous day</button>
      <button class="debug-date-step" type="button" data-step="1">Next day →</button>
    </div>
    <div class="debug-date-row">
      <input type="datetime-local" id="debug-date-input" step="1" />
      <button type="button" id="debug-date-go">Go</button>
    </div>
    <div class="debug-date-row">
      <button type="button" data-preset="kickoff">Kick-off</button>
      <button type="button" data-preset="checkin">Check-in</button>
      <button type="button" data-preset="showcase">Showcase</button>
      <button type="button" data-preset="now">Today</button>
    </div>
    <p class="debug-date-status"></p>
  `;
  return panel;
}

export function init() {
  const params = readParams();
  const isProjectBrief = window.location.pathname === '/brief/' || window.location.pathname === '/brief';
  if (!params.has('debug') && !isProjectBrief) return;

  const asOfRaw = params.get(ASOF_PARAM);
  const asOf = asOfRaw !== null ? Number(asOfRaw) : null;
  if (asOf !== null && !Number.isNaN(asOf)) {
    // Ticks forward in real time from asOf, rather than freezing on it —
    // a frozen Date.now() reads as a stopped clock to anything that polls
    // it on an interval (the countdown, the water-clock's own ball-drop
    // trigger), which either stops moving entirely or, worse, re-fires a
    // one-shot "trigger at this instant" condition on every single poll
    // since it's the same instant forever. realNow is captured once,
    // before the reassignment, so the override doesn't call itself.
    const realNow = Date.now.bind(Date);
    const offset = asOf - realNow();
    Date.now = () => realNow() + offset;
  }

  injectStyles();
  const panel = buildPanel();
  document.body.appendChild(panel);

  const input = panel.querySelector('#debug-date-input');
  const status = panel.querySelector('.debug-date-status');
  input.value = toDatetimeLocalValue(new Date(Date.now()));
  status.textContent = asOf !== null ? `Simulating: ${new Date(asOf).toString()}` : 'Using real time.';

  const applyInputValue = () => {
    if (!input.value) return;
    const timestamp = new Date(input.value).getTime();
    if (Number.isNaN(timestamp)) {
      status.textContent = 'Choose a valid local date and time.';
      return;
    }
    reloadWithAsOf(timestamp);
  };

  panel.querySelector('#debug-date-go').addEventListener('click', applyInputValue);
  // Committing a date-picker value should visibly affect the page even if the
  // user does not notice the adjacent apply button.
  input.addEventListener('change', applyInputValue);

  panel.querySelectorAll('[data-step]').forEach((btn) => {
    btn.addEventListener('click', () => {
      reloadWithAsOf(Date.now() + Number(btn.dataset.step) * DAY_MS);
    });
  });

  panel.querySelectorAll('[data-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.preset === 'now') reloadWithAsOf(null);
      else if (btn.dataset.preset === 'kickoff') reloadWithAsOf(PROJECT_START_UTC);
      else if (btn.dataset.preset === 'checkin') reloadWithAsOf(CHECKIN_UTC);
      else if (btn.dataset.preset === 'showcase') reloadWithAsOf(SHOWCASE_UTC);
    });
  });
}
