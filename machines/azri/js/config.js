export const GAME_WIDTH = 390;
export const GAME_HEIGHT = 844; // the camera viewport, not the whole level

export const COLS = 6;
export const TILE = GAME_WIDTH / COLS;

// Full-screen (ENVELOP scale mode) crops a bit off the top/bottom on
// aspect ratios flatter than our 390:844 design — worst case among our
// required test sizes is ~75 logical px. Keep HUD text inside this band
// so it survives every tested size instead of getting clipped.
export const SAFE_TOP = 90;
export const SAFE_BOTTOM = GAME_HEIGHT - 90;

// World-space padding above the goal row. Needs to clear the fixed HUD
// bar (see SAFE_TOP below) — otherwise a level's big goal reveal at the
// end of the route scrolls in right behind the score/pause bar instead
// of appearing cleanly on the board.
export const BOARD_TOP = 140;

export const GOAL_ROW = 0;
// ROWS/START_ROW/WORLD_HEIGHT/MAX_SCROLL_Y are no longer fixed globals —
// each level has its own row count (js/levels.js), so GameScene derives
// these itself per-instance (this.rows/this.startRow/this.worldHeight)
// and exposes rowToY/scrollYForRow as instance methods closing over
// them, rather than importing bare functions from here. colToX stays
// here since column count never varies per level.
export const START_COL = Math.floor(COLS / 2);

export const MOVE_DURATION = 130;

// Once the player has advanced far enough, the camera settles into
// tracking them at roughly this screen height, world scrolling beneath —
// clamped at both ends so it pins to the start row at the beginning and
// to the goal row at the very end instead of over-scrolling past them.
export const CAMERA_FOLLOW_Y = GAME_HEIGHT * 0.62;

// The environment auto-advances at a steady pace, independent of whether
// the player moves — a survival buffer drains continuously and only
// forward progress refills it. This is tracked as its own countdown
// rather than derived from camera scrollY, because scrollY is clamped to
// [0, MAX_SCROLL_Y] for legitimate rendering reasons and would hit that
// floor (and stop threatening the player) partway through every run.
export const ENVIRONMENT_ADVANCE_SPEED = 55; // px/sec — the one tunable difficulty knob
export const START_GRACE_MS = 1500; // no drain for the first moment of a run
export const INITIAL_BUFFER_PX = TILE * 4; // ~4 rows of grace at game start
export const MAX_BUFFER_PX = TILE * 4; // forward progress can't bank more than this
export const BUFFER_REFILL_PX = TILE; // one forward row refills this much

// Camera scrollY is eased toward a target each frame rather than ever
// being written directly — chaining moves quickly recomputes the target
// several times in a row, and without this the camera would instantly
// snap to each new value while the player's own tile-glide is still
// mid-animation, reading as a jarring jump. Higher = snappier/less lag.
export const CAMERA_SMOOTH = 0.2;

export const COLORS = {
  background: 0x0a0820,
  laneA: 0x1c1650,
  laneB: 0x241c63,
  goalLane: 0x0f3d33,
  goalGlow: 0x38d39f,
  playerHalo: 0xffb703,
  angKuKuehHalo: 0xff4d6d,
  ondehOndehHalo: 0x38d39f,
  hudGold: '#ffd166',
  hudCream: '#fdf6ec',
  danger: '#ff4d6d',
  mint: '#38d39f',
  // Levels 2-3 render monster lanes and obstacle lanes on the same
  // office_tile texture (no outdoor "road" equivalent indoors) — this is
  // laid over monster lanes as a low-alpha overlay (not a multiply-tint,
  // which would only ever darken an already-dark floor toward black) so
  // a moving-danger lane reads apart from a static-clutter one at a
  // glance without losing the floor texture underneath.
  monsterLaneOverlay: 0xff4d6d,
};

export function colToX(col) {
  return col * TILE + TILE / 2;
}
