// A one-off DOM overlay for capturing a leaderboard nickname — Phaser's
// canvas has no native text input, so this borrows the same trick
// kuehmachine.com's own account widget already uses (a fixed DOM element
// sitting on top of the canvas), just scoped to this one game rather than
// the whole site. Shows once, resolves a Promise with the entered name
// (trimmed, capped) or null if the player skips it, then removes itself.

export function promptForNickname() {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
      position: fixed; inset: 0; z-index: 2147483000;
      background: rgba(10, 8, 32, 0.82);
      display: flex; align-items: center; justify-content: center;
      font-family: 'Pixelify Sans', sans-serif;
    `;

    const panel = document.createElement('div');
    panel.style.cssText = `
      background: #140f24; border: 3px solid #ffd166;
      border-radius: 4px; padding: 24px 20px; width: min(300px, 84vw);
      text-align: center; color: #fdf6ec;
    `;

    const title = document.createElement('div');
    title.textContent = 'NEW BEST TIME!';
    title.style.cssText = 'color: #ffd166; font-size: 16px; margin-bottom: 8px; letter-spacing: 1px;';

    const subtitle = document.createElement('div');
    subtitle.textContent = 'Enter a name for the leaderboard';
    subtitle.style.cssText = "font-family: 'Syne', sans-serif; font-size: 13px; color: #cfc9e8; margin-bottom: 16px;";

    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 12;
    input.placeholder = 'YOUR NAME';
    input.style.cssText = `
      width: 100%; box-sizing: border-box; padding: 10px; font-size: 16px;
      text-align: center; text-transform: uppercase; border: 2px solid #8b84b0;
      border-radius: 3px; background: #0a0820; color: #fdf6ec;
      font-family: 'Pixelify Sans', sans-serif; margin-bottom: 16px;
    `;

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'SAVE';
    saveBtn.style.cssText = `
      width: 100%; padding: 12px; font-size: 15px; border: none; border-radius: 3px;
      background: #ffd166; color: #1a1330; font-family: 'Pixelify Sans', sans-serif;
      cursor: pointer; margin-bottom: 10px;
    `;

    const skipBtn = document.createElement('button');
    skipBtn.textContent = 'maybe later';
    skipBtn.style.cssText = `
      background: none; border: none; color: #8b84b0; font-size: 12px;
      font-family: 'Syne', sans-serif; cursor: pointer; text-decoration: underline;
    `;

    const cleanup = (value) => {
      backdrop.remove();
      resolve(value);
    };

    saveBtn.addEventListener('click', () => {
      const name = input.value.trim().slice(0, 12);
      cleanup(name || null);
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveBtn.click();
    });
    skipBtn.addEventListener('click', () => cleanup(null));

    panel.append(title, subtitle, input, saveBtn, skipBtn);
    backdrop.appendChild(panel);
    document.body.appendChild(backdrop);
    input.focus();
  });
}
