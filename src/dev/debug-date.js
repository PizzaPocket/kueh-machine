// Dev-only tool: lets you simulate "today" being a different date, so the
// site's date-driven reveals (scissors-cut.js's Check In cut,
// checkin-archive.js's post-check-in archive) can be tested without
// waiting for the real calendar. Never shown to a normal visitor — only
// renders when the URL has ?debug=1.
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
const CHECKIN_UTC = Date.UTC(2026, 6, 29, 6, 0, 0); // 29 July 2026, 2:00pm SGT — scissors-cut.js's own deadline
const DAY_AFTER_CHECKIN_UTC = Date.UTC(2026, 6, 29, 16, 0, 0); // 30 July 2026, 00:00 SGT — checkin-archive.js's own gate

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
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    #debug-date-panel {
      position: fixed;
      bottom: 12px;
      right: 12px;
      z-index: 9999;
      background: #1a1a1a;
      color: #f0f0f0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 12px;
      line-height: 1.5;
      padding: 12px 14px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
      max-width: 280px;
    }
    #debug-date-panel strong { display: block; margin-bottom: 8px; color: #ffd166; }
    #debug-date-panel .debug-date-row { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
    #debug-date-panel input[type="datetime-local"] {
      flex: 1;
      min-width: 0;
      font-size: 12px;
      padding: 3px 5px;
      border-radius: 4px;
      border: 1px solid #444;
      background: #2a2a2a;
      color: #f0f0f0;
    }
    #debug-date-panel button {
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid #555;
      background: #333;
      color: #f0f0f0;
      cursor: pointer;
    }
    #debug-date-panel button:hover { background: #444; }
    #debug-date-panel .debug-date-status { margin: 0; color: #aaa; word-break: break-word; }
  `;
  document.head.appendChild(style);
}

function buildPanel() {
  const panel = document.createElement('div');
  panel.id = 'debug-date-panel';
  panel.innerHTML = `
    <strong>Debug: simulate date</strong>
    <div class="debug-date-row">
      <input type="datetime-local" id="debug-date-input" />
      <button type="button" id="debug-date-go">Reload as this date</button>
    </div>
    <div class="debug-date-row">
      <button type="button" data-preset="now">Now (real time)</button>
      <button type="button" data-preset="checkin">Check-in day, 2pm SGT</button>
      <button type="button" data-preset="after-checkin">Day after check-in</button>
    </div>
    <p class="debug-date-status"></p>
  `;
  return panel;
}

export function init() {
  const params = readParams();
  if (!params.has('debug')) return;

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

  panel.querySelector('#debug-date-go').addEventListener('click', () => {
    if (!input.value) return;
    reloadWithAsOf(new Date(input.value).getTime());
  });

  panel.querySelectorAll('[data-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.preset === 'now') reloadWithAsOf(null);
      else if (btn.dataset.preset === 'checkin') reloadWithAsOf(CHECKIN_UTC);
      else if (btn.dataset.preset === 'after-checkin') reloadWithAsOf(DAY_AFTER_CHECKIN_UTC);
    });
  });
}
