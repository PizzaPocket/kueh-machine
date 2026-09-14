const MAX_QUEUE = 2;
const SWIPE_THRESHOLD = 28;

export class InputManager {
  constructor() {
    this.queue = [];
  }

  enqueue(direction) {
    if (this.queue.length < MAX_QUEUE) this.queue.push(direction);
  }

  getNextIntent() {
    return this.queue.length ? this.queue.shift() : null;
  }

  clear() {
    this.queue.length = 0;
  }

  attachKeyboard(scene) {
    const bind = (key, dir) => scene.input.keyboard.on(`keydown-${key}`, () => this.enqueue(dir));
    bind('UP', 'up');
    bind('DOWN', 'down');
    bind('LEFT', 'left');
    bind('RIGHT', 'right');
    bind('W', 'up');
    bind('S', 'down');
    bind('A', 'left');
    bind('D', 'right');
  }

  attachSwipe(scene) {
    let start = null;
    let fired = false;

    scene.input.on('pointerdown', (pointer) => {
      start = { x: pointer.x, y: pointer.y };
      fired = false;
    });

    scene.input.on('pointermove', (pointer) => {
      if (!start || fired || !pointer.isDown) return;
      const dx = pointer.x - start.x;
      const dy = pointer.y - start.y;
      const dist = Math.hypot(dx, dy);
      if (dist < SWIPE_THRESHOLD) return;

      fired = true;
      if (Math.abs(dx) > Math.abs(dy)) {
        this.enqueue(dx > 0 ? 'right' : 'left');
      } else {
        this.enqueue(dy > 0 ? 'down' : 'up');
      }
    });

    scene.input.on('pointerup', () => {
      start = null;
      fired = false;
    });
  }
}
