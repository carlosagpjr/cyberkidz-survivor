// game.js

class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
    this.weaponType = 'range';
  }

  preload() {
    // Carrega as imagens dos personagens, inimigos, projéteis e fundo
    // Estas imagens são usadas para representar visualmente os elementos do jogo
    this.load.image('player', './assets/player.png');
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

  create() {
    const mapWidth = 5000;
    const mapHeight = 5000;

    // Cria o fundo do mapa e configura os limites da câmera e do mundo
    this.add.tileSprite(0, 0, mapWidth, mapHeight, 'background').setOrigin(0);
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);

    // Cria o jogador centralizado no mapa com física habilitada
    this.player = this.physics.add.sprite(mapWidth / 2, mapHeight / 2, 'player').setScale(0.07).setCollideWorldBounds(true);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // Cria um grupo para os inimigos com física ativada
    this.enemies = this.physics.add.group();
    this.bullets = this.physics.add.group();
    this.cursors = this.input.keyboard.addKeys('W,A,S,D');

    // Variáveis de controle do jogo
    this.score = 0;
    this.difficulty = 1;
    this.phase = 1;
    this.phaseDuration = 60;
    this.nextPhaseTime = this.time.now + this.phaseDuration * 1000;
    this.startTime = this.time.now;
    this.playerHP = 100;
    this.bossSpawned = false;

    // HUD: Barra e texto de HP, score e tempo
    this.hpText = this.add.text(110, 100, 'HP: 100', { fontSize: '16px', fill: '#FFFFFF', shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 2, fill: true } }).setOrigin(0.5).setDepth(1).setScrollFactor(0);
    this.hpBarBg = this.add.rectangle(10, 90, 200, 20, 0x555555).setOrigin(0).setScrollFactor(0);
    this.hpBar = this.add.rectangle(10, 90, 200, 20, 0xff3333).setOrigin(0).setDepth(0).setScrollFactor(0);
    this.scoreText = this.add.text(10, 115, 'Score: 0', { fontSize: '20px', fill: '#FFFFFF' }).setScrollFactor(0);
    this.timeText = this.add.text(400, 10, 'Time: 0s', { fontSize: '28px', fill: '#FFFFFF' }).setScrollFactor(0).setOrigin(0.5, 0);

    // Temporizador de spawn de inimigos
    this.time.addEvent({ delay: 1000, callback: this.spawnEnemy, callbackScope: this, loop: true });

    // Tela de pausa (invisível por padrão)
    this.pausePanel = this.add.rectangle(400, 300, 300, 200, 0x000000, 0.8).setOrigin(0.5).setDepth(1000).setVisible(false);
    this.pauseText = this.add.text(400, 240, 'PAUSADO', { fontSize: '32px', fill: '#ffffff' }).setOrigin(0.5).setDepth(1000).setVisible(false);
    this.resumeButton = this.add.text(400, 320, 'Continuar', { fontSize: '20px', fill: '#00ffcc', backgroundColor: '#333', padding: { x: 10, y: 5 } }).setOrigin(0.5).setInteractive().setDepth(1000).setVisible(false);
    this.resumeButton.on('pointerdown', () => this.togglePause());

    // Tecla ESC para pausar
    this.input.keyboard.on('keydown-ESC', () => this.togglePause());

    // Colisões entre jogador e inimigos
    this.physics.add.overlap(this.player, this.enemies, this.onPlayerHit, null, this);

    // Detecta colisões entre projéteis e inimigos para aplicar dano ou destruí-los
    this.physics.add.overlap(this.bullets, this.enemies, this.onBulletHitEnemy, null, this);

    // Atira ao clicar
    this.input.on('pointerdown', this.shoot, this);
  }


  // Atualiza o estado do jogo a cada frame
  update() {
    if (this.isPaused) return;
    const speed = 200;
    this.player.setVelocity(0);
    if (this.cursors.W.isDown) this.player.setVelocityY(-speed);
    if (this.cursors.S.isDown) this.player.setVelocityY(speed);
    if (this.cursors.A.isDown) this.player.setVelocityX(-speed);
    if (this.cursors.D.isDown) this.player.setVelocityX(speed);

    // Move os inimigos em direção ao jogador e atualiza HUD dos inimigos
    this.enemies.getChildren().forEach(enemy => {
      this.physics.moveToObject(enemy, this.player, enemy.speed || 100);
      if (enemy.nameLabel) enemy.nameLabel.setPosition(enemy.x, enemy.y - 35);
      if (enemy.hpBarBg) enemy.hpBarBg.setPosition(enemy.x - 20, enemy.y - 20);
      if (enemy.hpBar) enemy.hpBar.setPosition(enemy.x - 20, enemy.y - 20);
    });

    // Atualiza o tempo e verifica mudança de fase
    const elapsed = Math.floor((this.time.now - this.startTime) / 1000);
    const remaining = Math.max(0, Math.ceil((this.nextPhaseTime - this.time.now) / 1000));
    this.timeText.setText('Fase ' + this.phase + ' - Tempo: ' + remaining + 's');

    if (this.time.now >= this.nextPhaseTime) {
      this.phase++;
      this.nextPhaseTime = this.time.now + this.phaseDuration * 1000;
      this.increaseDifficulty();
    }
  }

  // Cria um projétil e o dispara em direção ao cursor do mouse
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
  // Cria um inimigo em uma posição aleatória nas bordas visíveis da tela
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
      if (this.phase === 1) {
        const commomTypes = ['crawler', 'chaser', 'bouncer', 'leaper', 'exploder'];
        enemy.enemyType = Phaser.Utils.Array.GetRandom(commomTypes);
      } else if (this.phase === 2) {
        const eliteTypes = ['bruiser', 'reaper'].concat(['crawler', 'chaser', 'bouncer', 'leaper', 'exploder']);
        enemy.enemyType = Phaser.Utils.Array.GetRandom(eliteTypes);
      } else {
        const mix = ['bruiser', 'reaper', 'crawler', 'chaser', 'bouncer', 'leaper', 'exploder'];
        enemy.enemyType = Phaser.Utils.Array.GetRandom(mix);
      }

      const enemyStats = {
        crawler: { speed: 60, damage: 15, hp: 20 },
        chaser: { speed: 80, damage: 20, hp: 20 },
        bouncer: { speed: 100, damage: 25, hp: 25 },
        leaper: { speed: 130, damage: 25, hp: 20 },
        exploder: { speed: 100, damage: 30, hp: 10 },
        bruiser: { speed: 90, damage: 35, hp: 40 },
        reaper: { speed: 120, damage: 40, hp: 35 },
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

  // Aumenta a dificuldade progressivamente com o tempo
  increaseDifficulty() {
    this.difficulty++;
    this.time.addEvent({ delay: Math.max(300, 1000 - this.difficulty * 100), callback: this.spawnEnemy, callbackScope: this, loop: true });
    this.enemies.getChildren().forEach(e => { e.speed += 10; });
  }

  // Detecta quando um projétil atinge um inimigo e aplica dano ou destrói
  onBulletHitEnemy(bullet, enemy) {
    bullet.destroy();
    if (enemy.currentHP > 10) {
      enemy.currentHP -= 10;
    } else {
      if (enemy.nameLabel) { enemy.nameLabel.destroy(); delete enemy.nameLabel; }
      if (enemy.hpBar) { enemy.hpBar.destroy(); delete enemy.hpBar; }
      if (enemy.hpBarBg) { enemy.hpBarBg.destroy(); delete enemy.hpBarBg; }
      enemy.destroy();
      this.score++;
      this.scoreText.setText('Score: ' + this.score);
    }
    if (enemy.hpBar) enemy.hpBar.width = Math.max(0, 40 * enemy.currentHP / enemy.maxHP);
  }

  // Detecta colisões entre o jogador e inimigos, reduz o HP do jogador e verifica fim de jogo
  onPlayerHit(player, enemy) {
    if (enemy.nameLabel) enemy.nameLabel.destroy();
    if (enemy.hpBar) enemy.hpBar.destroy();
    if (enemy.hpBarBg) enemy.hpBarBg.destroy();
    enemy.destroy();

    const dmg = enemy.damage || 20;
    this.playerHP -= dmg;
    this.hpText.setText('HP: ' + this.playerHP);
    this.hpBar.fillColor = this.playerHP > 50 ? 0x00ff00 : this.playerHP > 20 ? 0xffaa00 : 0xff0000;
    this.hpBar.width = Math.max(0, 200 * this.playerHP / 100);

    if (this.playerHP <= 0 && !this.isPaused) {
      this.physics.pause();
      const elapsed = Math.floor((this.time.now - this.startTime) / 1000);
      document.getElementById('finalStats').innerText = `Tempo: ${elapsed}s | Pontos: ${this.score}`;
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

  // Alterna o estado de pausa do jogo e exibe/oculta a tela de pausa
  togglePause() {
    if (!this.isPaused) {
      this.physics.pause();
      this.isPaused = true;
      this.pausePanel.setVisible(true);
      this.pauseText.setVisible(true);
      this.resumeButton.setVisible(true);
    } else {
      this.physics.resume();
      this.isPaused = false;
      this.pausePanel.setVisible(false);
      this.pauseText.setVisible(false);
      this.resumeButton.setVisible(false);
    }
  }
}
