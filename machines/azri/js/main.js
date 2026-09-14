import { GAME_WIDTH, GAME_HEIGHT, COLORS } from './config.js';
import { AudioManager } from './audio.js';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import StartScene from './scenes/StartScene.js';
import StoryScene from './scenes/StoryScene.js';
import GameScene from './scenes/GameScene.js';
import LevelIntroScene from './scenes/LevelIntroScene.js';
import PauseScene from './scenes/PauseScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import CharacterSelectScene from './scenes/CharacterSelectScene.js';
import LeaderboardScene from './scenes/LeaderboardScene.js';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: COLORS.background,
  pixelArt: true,
  scale: {
    // ENVELOP fills the whole container edge-to-edge (crop-to-cover,
    // like CSS object-fit:cover) instead of FIT's letterboxed bars —
    // that's what makes this genuinely full-screen rather than a
    // centered rectangle.
    mode: Phaser.Scale.ENVELOP,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  scene: [BootScene, PreloadScene, StartScene, StoryScene, GameScene, LevelIntroScene, PauseScene, GameOverScene, CharacterSelectScene, LeaderboardScene],
});

AudioManager.init(game);
