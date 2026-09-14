import { AUDIO_MANIFEST } from '../audio.js';
import { restoreWalletFromRemoteIfFirstLoad } from '../wallet.js';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    this.load.image('player', 'assets/sprites/leonard.png');
    this.load.image('angkukueh', 'assets/sprites/angkukueh.png');
    this.load.image('ondehondeh', 'assets/sprites/ondehondeh.png');
    this.load.image('kuehlapis', 'assets/sprites/kuehlapis.png');
    this.load.image('machine', 'assets/sprites/machine.png');
    this.load.image('tile', 'assets/sprites/tile.png');
    this.load.image('road', 'assets/sprites/road.png');
    this.load.image('car', 'assets/sprites/car.png');
    this.load.image('grass', 'assets/sprites/grass.png');
    this.load.image('tree', 'assets/sprites/tree.png');
    this.load.image('bush', 'assets/sprites/bush.png');
    this.load.image('lab_building', 'assets/sprites/lab_building.png');
    this.load.image('staircase', 'assets/sprites/staircase.png');
    this.load.image('office_tile', 'assets/sprites/office_tile.png');
    this.load.image('office_table', 'assets/sprites/office_table.png');
    this.load.image('office_chair', 'assets/sprites/office_chair.png');
    this.load.image('office_plant', 'assets/sprites/office_plant.png');
    this.load.image('coin', 'assets/sprites/coin.png');
    this.load.image('char_kai', 'assets/sprites/char_kai.png');
    this.load.image('char_mj', 'assets/sprites/char_mj.png');
    this.load.image('char_liwei', 'assets/sprites/char_liwei.png');
    this.load.image('char_sam', 'assets/sprites/char_sam.png');
    this.load.image('char_viki', 'assets/sprites/char_viki.png');
    this.load.image('char_ken', 'assets/sprites/char_ken.png');
    this.load.image('char_mystery', 'assets/sprites/char_mystery.png');
    this.load.image('eagle', 'assets/sprites/eagle.png');
    this.load.image('icon_characters', 'assets/sprites/icon_characters.png');
    this.load.image('icon_home', 'assets/sprites/icon_home.png');
    this.load.image('icon_leaderboard', 'assets/sprites/icon_leaderboard.png');

    this.load.video('heroVideo', 'assets/sprites/hero.mp4');
    this.load.image('beat1', 'assets/sprites/beat1.png');
    this.load.image('beat2', 'assets/sprites/beat2.png');
    this.load.image('beat3', 'assets/sprites/beat3.png');
    this.load.image('beat4', 'assets/sprites/beat4.png');
    this.load.image('beat5', 'assets/sprites/beat5.png');
    this.load.image('beat6', 'assets/sprites/beat6.png');
    this.load.image('textbox', 'assets/sprites/textbox.png');

    AUDIO_MANIFEST.forEach(({ key, url }) => this.load.audio(key, url));
  }

  create() {
    restoreWalletFromRemoteIfFirstLoad(); // best-effort, fire-and-forget
    this.scene.start('Start');
  }
}
