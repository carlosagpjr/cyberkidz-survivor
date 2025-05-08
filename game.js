// game.js

class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
    this.weaponType = 'range';
  }

  preload() {
    this.load.image('player', 'https://labs.phaser.io/assets/sprites/phaser-dude.png');
    this.load.image('crawler', 'https://labs.phaser.io/assets/sprites/ufo.png');
    this.load.image('chaser', 'https://labs.phaser.io/assets/sprites/space-baddie.png');
    this.load.image('bouncer', 'https://labs.phaser.io/assets/sprites/asteroid.png');
    this.load.image('leaper', 'https://labs.phaser.io/assets/sprites/red_ball.png');
    this.load.image('exploder', 'https://labs.phaser.io/assets/sprites/shinyball.png');
    this.load.image('bruiser', 'https://labs.phaser.io/assets/sprites/blue_ball.png');
    this.load.image('reaper', 'https://labs.phaser.io/assets/sprites/yellow_ball.png');
    this.load.image('overlord', 'https://labs.phaser.io/assets/sprites/metalface78x92.png');
    this.load.image('bullet', 'https://labs.phaser.io/assets/sprites/bullets/bullet11.png');
    this.load.image('background', 'https://labs.phaser.io/assets/skies/desert.png');
  }

  // [...Código continua, omitido por brevidade...]
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#222222',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scene: MainScene
};

new Phaser.Game(config);
