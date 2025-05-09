
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: {
    preload,
    create,
    update,
  },
};

const game = new Phaser.Game(config);

let player;
let cursors;
let bullets;
let enemies;
let lastFired = 0;
let hp = 100;
let hpBar;
let hpText;
let killCount = 0;
let killText;
let gameOver = false;
let enemySpawnTimer = 0;
let enemySpawnInterval = 2000;

function preload() {
  this.load.image("player", "assets/player.png");
  this.load.image("bullet", "assets/bullet.png");
  this.load.image("enemy", "assets/enemy.png");
  this.load.image("background", "assets/background.png");
}

function create() {
  this.add.image(400, 300, "background");

  player = this.physics.add.sprite(400, 300, "player");
  player.setCollideWorldBounds(true);

  cursors = this.input.keyboard.createCursorKeys();

  bullets = this.physics.add.group({
    classType: Phaser.Physics.Arcade.Image,
    maxSize: 30,
    runChildUpdate: true,
  });

  enemies = this.physics.add.group();

  this.input.keyboard.on("keydown-SPACE", () => {
    shootBullet.call(this);
  });

  this.physics.add.overlap(bullets, enemies, bulletHitsEnemy, null, this);
  this.physics.add.overlap(player, enemies, enemyHitsPlayer, null, this);

  const graphics = this.add.graphics();
  graphics.fillStyle(0xff0000, 1);
  graphics.fillRect(10, 10, 200, 20);
  hpBar = graphics;

  hpText = this.add.text(12, 12, `HP: ${hp}`, {
    fontSize: "14px",
    fill: "#ffffff",
  });
  hpText.setDepth(1);

  killText = this.add.text(700, 12, `Kills: ${killCount}`, {
    fontSize: "14px",
    fill: "#ffffff",
  });
}

function update(time, delta) {
  if (gameOver) return;

  player.setVelocity(0);
  if (cursors.left.isDown) player.setVelocityX(-200);
  else if (cursors.right.isDown) player.setVelocityX(200);

  if (cursors.up.isDown) player.setVelocityY(-200);
  else if (cursors.down.isDown) player.setVelocityY(200);

  enemySpawnTimer += delta;
  if (enemySpawnTimer > enemySpawnInterval) {
    spawnEnemy.call(this);
    enemySpawnTimer = 0;

    if (enemySpawnInterval > 500) {
      enemySpawnInterval -= 50;
    }
  }
}

function shootBullet() {
  const bullet = bullets.get();
  if (bullet) {
    bullet.enableBody(true, player.x, player.y, true, true);
    bullet.setTexture("bullet");
    bullet.setPosition(player.x, player.y);
    bullet.setVelocityY(-400);

    this.time.addEvent({
      delay: 1000,
      callback: () => {
        bullets.killAndHide(bullet);
        bullet.body.enable = false;
      },
    });
  }
}

function spawnEnemy() {
  const x = Phaser.Math.Between(0, 800);
  const y = Phaser.Math.Between(-50, -10);
  const enemy = enemies.create(x, y, "enemy");
  enemy.setVelocity(0, Phaser.Math.Between(50, 150));
  enemy.setCollideWorldBounds(true);
  enemy.setBounce(1);
  enemy.hp = 3;
}

function bulletHitsEnemy(bullet, enemy) {
  bullet.disableBody(true, true);
  enemy.hp -= 1;
  if (enemy.hp <= 0) {
    enemy.disableBody(true, true);
    killCount++;
    killText.setText(`Kills: ${killCount}`);
  }
}

function enemyHitsPlayer(player, enemy) {
  enemy.disableBody(true, true);
  hp -= 10;
  hpBar.clear();
  hpBar.fillStyle(0xff0000, 1);
  hpBar.fillRect(10, 10, 2 * hp, 20);
  hpText.setText(`HP: ${hp}`);

  if (hp <= 0) {
    this.add.text(300, 280, "GAME OVER", {
      fontSize: "32px",
      fill: "#ff0000",
    });
    gameOver = true;

    this.time.addEvent({
      delay: 3000,
      callback: () => this.scene.restart(),
    });
  }
}
