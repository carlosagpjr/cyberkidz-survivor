class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
    this.weaponType = 'range';
  }

  preload() {
    this.load.image('player', './assets/player-icon.png');
    this.load.image('crawler', './assets/crawler-icon.png');
    this.load.image('chaser', './assets/chaser-icon.png');
    this.load.image('bouncer', './assets/bouncer-icon.png');
    this.load.image('leaper', './assets/leaper-icon.png');
    this.load.image('exploder', './assets/exploder-icon.png');
    this.load.image('bruiser', './assets/bruiser-icon.png');
    this.load.image('reaper', './assets/reaper-icon.png');
    this.load.image('overlord', './assets/overlord-icon.png');
    this.load.image('bullet', 'https://labs.phaser.io/assets/sprites/bullets/bullet11.png');
    this.load.image('background', './assets/wasteland-background1.png');
  }

  create() {
    const mapWidth = 5000;
    const mapHeight = 5000;
    this.background = this.add.tileSprite(0, 0, mapWidth, mapHeight, 'background').setOrigin(0);
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);

    this.player = this.physics.add.sprite(mapWidth / 2, mapHeight / 2, 'player').setCollideWorldBounds(true);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    this.enemies = this.physics.add.group();
    this.bullets = this.physics.add.group();
    this.cursors = this.input.keyboard.addKeys('W,A,S,D');
    this.score = 0;
    this.difficulty = 1;
    this.phase = 1;
    this.phaseDuration = 60;
    this.nextPhaseTime = this.time.now + this.phaseDuration * 1000;
    this.startTime = this.time.now;
    this.playerHP = 100;
    this.bossSpawned = false;

    this.hpText = this.add.text(10, 60, 'HP: 100', { fontSize: '20px', fill: '#FFFFFF' }).setScrollFactor(0);
    this.hpBarBg = this.add.rectangle(10, 90, 200, 20, 0x555555).setOrigin(0).setScrollFactor(0);
    this.hpBar = this.add.rectangle(10, 90, 200, 20, 0xff3333).setOrigin(0).setScrollFactor(0);
    this.scoreText = this.add.text(10, 115, 'Score: 0', { fontSize: '20px', fill: '#FFFFFF' }).setScrollFactor(0);
    this.timeText = this.add.text(400, 10, 'Time: 0s', { fontSize: '28px', fill: '#FFFFFF' }).setScrollFactor(0).setOrigin(0.5, 0);

    this.spawnTimer = this.time.addEvent({ delay: 1000, callback: this.spawnEnemy, callbackScope: this, loop: true });
    this.physics.add.overlap(this.player, this.enemies, this.onPlayerHit, null, this);
    this.physics.add.overlap(this.bullets, this.enemies, this.onBulletHitEnemy, null, this);
    this.input.on('pointerdown', this.shoot, this);
  }

  update() {
    this.background.tilePositionX = this.cameras.main.scrollX;
    this.background.tilePositionY = this.cameras.main.scrollY;
    const speed = 200;
    this.player.setVelocity(0);

    if (this.cursors.W.isDown) this.player.setVelocityY(-speed);
    if (this.cursors.S.isDown) this.player.setVelocityY(speed);

    if (this.cursors.A.isDown) {
      this.player.setVelocityX(-speed);
      this.player.setFlipX(true); // Espelha para a esquerda
    } else if (this.cursors.D.isDown) {
      this.player.setVelocityX(speed);
      this.player.setFlipX(false); // Normal para a direita
    }

    this.enemies.getChildren().forEach(enemy => {
      this.physics.moveToObject(enemy, this.player, enemy.speed || 100);
      if (enemy.nameLabel) enemy.nameLabel.setPosition(enemy.x, enemy.y - 35);
      if (enemy.hpBarBg) enemy.hpBarBg.setPosition(enemy.x - 20, enemy.y - 20);
      if (enemy.hpBar) enemy.hpBar.setPosition(enemy.x - 20, enemy.y - 20);
    });

    const elapsed = Math.floor((this.time.now - this.startTime) / 1000);
    const remaining = Math.max(0, Math.ceil((this.nextPhaseTime - this.time.now) / 1000));
    this.timeText.setText('Stage ' + this.phase + ' - Time: ' + remaining + 's');

    if (this.time.now >= this.nextPhaseTime) {
      this.phase++;
      this.nextPhaseTime = this.time.now + this.phaseDuration * 1000;
      this.increaseDifficulty();
    }
  }

  shoot(pointer) {
    const bullet = this.bullets.create(this.player.x, this.player.y, 'bullet');
    bullet.setScale(0.5);
    bullet.setCollideWorldBounds(true);
    bullet.body.onWorldBounds = true;

    const worldPointer = this.input.activePointer.positionToCamera(this.cameras.main);
    const dx = worldPointer.x - this.player.x;
    const dy = worldPointer.y - this.player.y;
    const angle = Math.atan2(dy, dx);
    bullet.setRotation(angle);
    this.physics.velocityFromRotation(angle, 500, bullet.body.velocity);

    this.time.delayedCall(1000, () => {
      if (bullet.active) bullet.destroy();
    });
  }

  spawnEnemy() {
    const cam = this.cameras.main;
    const buffer = 10;
    const sides = [
      { x: Phaser.Math.Between(cam.scrollX, cam.scrollX + cam.width), y: cam.scrollY - buffer },
      { x: Phaser.Math.Between(cam.scrollX, cam.scrollX + cam.width), y: cam.scrollY + cam.height + buffer },
      { x: cam.scrollX - buffer, y: Phaser.Math.Between(cam.scrollY, cam.scrollY + cam.height) },
      { x: cam.scrollX + cam.width + buffer, y: Phaser.Math.Between(cam.scrollY, cam.scrollY + cam.height) }
    ];
    const spawnPoint = Phaser.Utils.Array.GetRandom(sides);

    if (!this.bossSpawned && this.phase === 3) {
      const enemy = this.enemies.create(spawnPoint.x, spawnPoint.y, 'overlord');
      enemy.setScale(1.5);
      enemy.enemyType = 'overlord';
      this.bossSpawned = true;
    } else {
      const enemy = this.enemies.create(spawnPoint.x, spawnPoint.y, 'chaser');

      const phaseTypes = {
        1: ['crawler', 'chaser', 'bouncer', 'leaper', 'exploder'],
        2: ['bruiser', 'reaper', 'crawler', 'chaser', 'bouncer', 'leaper', 'exploder'],
        default: ['bruiser', 'reaper', 'crawler', 'chaser', 'bouncer', 'leaper', 'exploder']
      };

      const types = phaseTypes[this.phase] || phaseTypes.default;
      enemy.enemyType = Phaser.Utils.Array.GetRandom(types);

      const enemyStats = {
        crawler: { speed: 60, damage: 15, hp: 20 },
        chaser: { speed: 80, damage: 30, hp: 20 },
        bouncer: { speed: 100, damage: 25, hp: 25 },
        leaper: { speed: 130, damage: 25, hp: 20 },
        exploder: { speed: 100, damage: 30, hp: 15 },
        bruiser: { speed: 120, damage: 30, hp: 45 },
        reaper: { speed: 100, damage: 45, hp: 50 },
        overlord: { speed: 100, damage: 60, hp: 100 }
      };

      const stats = enemyStats[enemy.enemyType] || { speed: 100, damage: 20, hp: 20 };
      enemy.setTexture(enemy.enemyType);
      enemy.speed = stats.speed;
      enemy.damage = stats.damage;
      enemy.maxHP = stats.hp;
      enemy.currentHP = stats.hp;
      enemy.nameLabel = this.add.text(enemy.x, enemy.y - 35, enemy.enemyType.toUpperCase(), { fontSize: '12px', fill: '#fff' }).setOrigin(0.5);
      enemy.hpBarBg = this.add.rectangle(enemy.x - 20, enemy.y - 20, 40, 5, 0x555555).setOrigin(0, 0.5);
      enemy.hpBar = this.add.rectangle(enemy.x - 20, enemy.y - 20, 40, 5, 0xff0000).setOrigin(0, 0.5);
    }
  }

  increaseDifficulty() {
    this.difficulty++;
    if (this.spawnTimer) this.spawnTimer.remove();
    this.spawnTimer = this.time.addEvent({
      delay: Math.max(300, 1000 - this.difficulty * 100),
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true
    });
    this.enemies.getChildren().forEach(e => { e.speed += 10; });
  });
    this.enemies.getChildren().forEach(e => { e.speed += 10; });
  }

  onBulletHitEnemy(bullet, enemy) {
    bullet.destroy();
    if (enemy.currentHP > 10) {
      enemy.currentHP -= 10;
    } else {
      if (enemy.nameLabel) enemy.nameLabel.destroy();
      if (enemy.hpBar) enemy.hpBar.destroy();
      if (enemy.hpBarBg) enemy.hpBarBg.destroy();
      enemy.destroy();
      this.score++;
      this.scoreText.setText('Score: ' + this.score);
    }
    if (enemy.hpBar) enemy.hpBar.width = Math.max(0, 40 * enemy.currentHP / enemy.maxHP);
  }

  onPlayerHit(player, enemy) {
    if (enemy.nameLabel) enemy.nameLabel.destroy();
    if (enemy.hpBar) enemy.hpBar.destroy();
    if (enemy.hpBarBg) enemy.hpBarBg.destroy();
    enemy.destroy();

    const dmg = enemy.damage || 20;
    this.playerHP -= dmg;
    this.hpText.setText('HP: ' + this.playerHP);
    this.hpBar.width = Math.max(0, 200 * this.playerHP / 100);

    if (this.playerHP <= 0) {
      this.physics.pause();
      const elapsed = Math.floor((this.time.now - this.startTime) / 1000);
      document.getElementById('finalStats').innerText = `Time: ${elapsed}s | Score: ${this.score}`;
      const gameOverDiv = document.getElementById('gameOver');
      gameOverDiv.style.opacity = 0;
      gameOverDiv.style.display = 'flex';
      gameOverDiv.style.pointerEvents = 'auto';
      let opacity = 0;
      const fade = setInterval(() => {
        opacity += 0.05;
        gameOverDiv.style.opacity = opacity;
        if (opacity >= 1) clearInterval(fade);
      }, 50);

      const audio = new Audio('https://www.soundjay.com/button/sounds/button-10.mp3');
      audio.volume = 0.5;
      audio.play();
    }
  }
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
