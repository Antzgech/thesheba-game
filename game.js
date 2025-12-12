// ==================== QUEEN SHEBA RUNNER GAME ====================

class QueenShebaGame {
  constructor(canvas, playerLevel) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.playerLevel = playerLevel || 1;
    
    // Set canvas size
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    // Game state
    this.isRunning = false;
    this.isGameOver = false;
    this.score = 0;
    this.coinsCollected = 0;
    this.baseSpeed = 6 + (this.playerLevel * 0.5);
    this.speed = this.baseSpeed;
    this.gravity = 0.6;
    this.jumpForce = -13;
    
    // Animation
    this.animationFrame = 0;
    this.queenAnimFrame = 0;
    
    // Queen Sheba (player) - Beautiful and powerful
    this.queen = {
      x: 80,
      y: 0,
      width: 45,
      height: 55,
      velocityY: 0,
      isJumping: false,
      animationState: 'walk', // walk, run, jump
      stepFrame: 0,
      glowIntensity: 0,
      powerAura: 0
    };
    
    // Ground
    this.groundY = this.canvas.height - 50;
    this.queen.y = this.groundY - this.queen.height;
    
    // Obstacles
    this.obstacles = [];
    this.obstacleTimer = 0;
    this.obstacleInterval = Math.max(80 - (this.playerLevel * 5), 50);
    
    // Coins
    this.coins = [];
    this.coinTimer = 0;
    this.coinInterval = 50;
    
    // Clouds
    this.clouds = [];
    this.initClouds();
    
    // Sparkles around queen
    this.sparkles = [];
    
    // Controls
    this.setupControls();
    
    // Animation frame
    this.animationId = null;
  }
  
  resize() {
    const container = this.canvas.parentElement;
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
    this.groundY = this.canvas.height - 50;
  }
  
  setupControls() {
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && this.isRunning) {
        e.preventDefault();
        this.jump();
      }
    });
    
    this.canvas.addEventListener('click', () => {
      if (this.isRunning) {
        this.jump();
      }
    });
    
    this.canvas.addEventListener('touchstart', (e) => {
      if (this.isRunning) {
        e.preventDefault();
        this.jump();
      }
    });
  }
  
  initClouds() {
    for (let i = 0; i < 3; i++) {
      this.clouds.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * (this.groundY - 100),
        width: 60 + Math.random() * 40,
        height: 30,
        speed: 0.5 + Math.random() * 0.5
      });
    }
  }
  
  createSparkle() {
    this.sparkles.push({
      x: this.queen.x + Math.random() * this.queen.width,
      y: this.queen.y + Math.random() * this.queen.height,
      size: 2 + Math.random() * 3,
      vx: (Math.random() - 0.5) * 2,
      vy: -Math.random() * 2 - 1,
      life: 1.0,
      color: ['#FFD700', '#FFF44F', '#FFB6C1', '#E6E6FA'][Math.floor(Math.random() * 4)]
    });
  }
  
  jump() {
    if (!this.queen.isJumping) {
      this.queen.velocityY = this.jumpForce;
      this.queen.isJumping = true;
      this.queen.animationState = 'jump';
      this.queen.powerAura = 1.0;
      
      if (window.tg && window.tg.HapticFeedback) {
        window.tg.HapticFeedback.impactOccurred('light');
      }
    }
  }
  
  start() {
    this.isRunning = true;
    this.isGameOver = false;
    this.score = 0;
    this.coinsCollected = 0;
    this.speed = this.baseSpeed;
    this.obstacles = [];
    this.coins = [];
    this.sparkles = [];
    this.queen.y = this.groundY - this.queen.height;
    this.queen.velocityY = 0;
    this.queen.isJumping = false;
    this.queen.animationState = 'walk';
    this.animationFrame = 0;
    
    this.gameLoop();
  }
  
  stop() {
    this.isRunning = false;
    this.isGameOver = true;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
  
  getObstacleType() {
    if (this.playerLevel === 1) {
      return 'rock';
    } else if (this.playerLevel === 2) {
      return Math.random() < 0.5 ? 'rock' : 'cactus';
    } else if (this.playerLevel === 3) {
      const rand = Math.random();
      if (rand < 0.33) return 'rock';
      else if (rand < 0.66) return 'cactus';
      else return 'web';
    } else {
      const rand = Math.random();
      if (rand < 0.25) return 'rock';
      else if (rand < 0.5) return 'cactus';
      else if (rand < 0.75) return 'web';
      else return 'bird';
    }
  }
  
  createObstacle(type) {
    const obstacles = {
      rock: { type: 'rock', x: this.canvas.width, y: this.groundY - 30, width: 30, height: 30, color: '#8B4513' },
      cactus: { type: 'cactus', x: this.canvas.width, y: this.groundY - 40, width: 25, height: 40, color: '#228B22' },
      web: { type: 'web', x: this.canvas.width, y: this.groundY - 80, width: 40, height: 40, color: '#C0C0C0' },
      bird: { type: 'bird', x: this.canvas.width, y: this.groundY - 100, width: 35, height: 25, color: '#000000', wingFlap: 0 }
    };
    return obstacles[type];
  }
  
  update() {
    if (!this.isRunning) return;
    
    this.score++;
    this.animationFrame++;
    
    // Transition from walking to running
    if (this.score > 100 && !this.queen.isJumping) {
      this.queen.animationState = 'run';
    }
    
    // Speed increase
    if (this.score % 500 === 0) {
      this.speed += 0.3;
    }
    
    // Update queen physics
    this.queen.velocityY += this.gravity;
    this.queen.y += this.queen.velocityY;
    
    // Ground collision
    if (this.queen.y >= this.groundY - this.queen.height) {
      this.queen.y = this.groundY - this.queen.height;
      this.queen.velocityY = 0;
      this.queen.isJumping = false;
      this.queen.animationState = this.score > 100 ? 'run' : 'walk';
    }
    
    // Update queen animation
    if (this.animationFrame % 8 === 0) {
      this.queen.stepFrame = (this.queen.stepFrame + 1) % 4;
    }
    
    // Update power aura
    if (this.queen.powerAura > 0) {
      this.queen.powerAura -= 0.02;
    }
    
    // Queen's magical glow pulse
    this.queen.glowIntensity = 0.5 + Math.sin(this.animationFrame * 0.1) * 0.5;
    
    // Create sparkles periodically
    if (this.animationFrame % 5 === 0) {
      this.createSparkle();
    }
    
    // Update sparkles
    this.sparkles.forEach((sparkle, index) => {
      sparkle.x += sparkle.vx;
      sparkle.y += sparkle.vy;
      sparkle.life -= 0.02;
      if (sparkle.life <= 0) {
        this.sparkles.splice(index, 1);
      }
    });
    
    // Update clouds
    this.clouds.forEach(cloud => {
      cloud.x -= cloud.speed;
      if (cloud.x + cloud.width < 0) {
        cloud.x = this.canvas.width;
        cloud.y = Math.random() * (this.groundY - 100);
      }
    });
    
    // Spawn obstacles
    this.obstacleTimer++;
    if (this.obstacleTimer > this.obstacleInterval) {
      this.obstacleTimer = 0;
      this.obstacles.push(this.createObstacle(this.getObstacleType()));
    }
    
    // Update obstacles
    this.obstacles.forEach((obstacle, index) => {
      obstacle.x -= this.speed;
      
      if (obstacle.type === 'bird') {
        obstacle.wingFlap = (obstacle.wingFlap + 0.2) % (Math.PI * 2);
      }
      
      if (obstacle.x + obstacle.width < 0) {
        this.obstacles.splice(index, 1);
      }
      
      if (this.checkCollision(this.queen, obstacle)) {
        this.stop();
        this.onGameOver();
      }
    });
    
    // Spawn coins
    this.coinTimer++;
    if (this.coinTimer > this.coinInterval) {
      this.coinTimer = 0;
      this.coins.push({
        x: this.canvas.width,
        y: this.groundY - 80 - Math.random() * 60,
        width: 25,
        height: 25,
        collected: false,
        rotation: 0,
        glow: 0
      });
    }
    
    // Update coins
    this.coins.forEach((coin, index) => {
      if (!coin.collected) {
        coin.x -= this.speed;
        coin.rotation += 0.1;
        coin.glow = 0.5 + Math.sin(this.animationFrame * 0.15) * 0.5;
        
        if (coin.x + coin.width < 0) {
          this.coins.splice(index, 1);
        }
        
        if (this.checkCollision(this.queen, coin)) {
          coin.collected = true;
          this.coinsCollected++;
          this.coins.splice(index, 1);
          this.createCoinCollectionEffect(coin);
          
          if (window.tg && window.tg.HapticFeedback) {
            window.tg.HapticFeedback.impactOccurred('light');
          }
        }
      }
    });
  }
  
  createCoinCollectionEffect(coin) {
    for (let i = 0; i < 8; i++) {
      this.sparkles.push({
        x: coin.x + coin.width / 2,
        y: coin.y + coin.height / 2,
        size: 3,
        vx: Math.cos(i * Math.PI / 4) * 3,
        vy: Math.sin(i * Math.PI / 4) * 3,
        life: 1.0,
        color: '#FFD700'
      });
    }
  }
  
  checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width - 5 &&
           rect1.x + rect1.width - 5 > rect2.x &&
           rect1.y < rect2.y + rect2.height - 5 &&
           rect1.y + rect1.height - 5 > rect2.y;
  }
  
  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Sky gradient
    const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.groundY);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(1, '#B0E0E6');
    this.ctx.fillStyle = skyGradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.groundY);
    
    // Clouds
    this.clouds.forEach(cloud => {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      this.ctx.beginPath();
      this.ctx.ellipse(cloud.x, cloud.y, cloud.width / 2, cloud.height / 2, 0, 0, Math.PI * 2);
      this.ctx.ellipse(cloud.x + 20, cloud.y - 10, cloud.width / 3, cloud.height / 2, 0, 0, Math.PI * 2);
      this.ctx.ellipse(cloud.x + 40, cloud.y, cloud.width / 2.5, cloud.height / 2, 0, 0, Math.PI * 2);
      this.ctx.fill();
    });
    
    // Ground
    this.ctx.fillStyle = '#90EE90';
    this.ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);
    
    // Grass
    this.ctx.fillStyle = '#228B22';
    for (let i = 0; i < this.canvas.width; i += 20) {
      this.ctx.fillRect(i, this.groundY, 10, 5);
    }
    
    // Draw sparkles behind queen
    this.sparkles.forEach(sparkle => {
      this.ctx.globalAlpha = sparkle.life;
      this.ctx.fillStyle = sparkle.color;
      this.ctx.shadowBlur = 5;
      this.ctx.shadowColor = sparkle.color;
      this.ctx.beginPath();
      this.ctx.arc(sparkle.x, sparkle.y, sparkle.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
      this.ctx.globalAlpha = 1;
    });
    
    // Draw Queen Sheba (beautiful and powerful)
    this.drawQueenSheba();
    
    // Obstacles
    this.obstacles.forEach(obstacle => {
      this.drawObstacle(obstacle);
    });
    
    // Coins with glow
    this.coins.forEach(coin => {
      if (!coin.collected) {
        this.ctx.save();
        this.ctx.translate(coin.x + coin.width / 2, coin.y + coin.height / 2);
        this.ctx.rotate(coin.rotation);
        
        this.ctx.shadowColor = '#FFD700';
        this.ctx.shadowBlur = 15 * coin.glow;
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, coin.width / 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FFA500';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, coin.width / 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
        this.ctx.restore();
      }
    });
  }
  
  drawQueenSheba() {
    const q = this.queen;
    const centerX = q.x + q.width / 2;
    const centerY = q.y + q.height / 2;
    
    // Magical power aura
    if (q.powerAura > 0) {
      this.ctx.globalAlpha = q.powerAura * 0.3;
      const auraGradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 40);
      auraGradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
      auraGradient.addColorStop(0.5, 'rgba(255, 182, 193, 0.4)');
      auraGradient.addColorStop(1, 'rgba(230, 230, 250, 0)');
      this.ctx.fillStyle = auraGradient;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.globalAlpha = 1;
    }
    
    // Glowing aura around queen
    this.ctx.shadowBlur = 20 * q.glowIntensity;
    this.ctx.shadowColor = '#FFD700';
    
    // Shadow
    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    this.ctx.beginPath();
    this.ctx.ellipse(centerX, this.groundY - 5, q.width / 2, 5, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Dress - Beautiful flowing royal purple with gold accents
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = '#FFD700';
    const dressGradient = this.ctx.createLinearGradient(q.x, q.y, q.x, q.y + q.height);
    dressGradient.addColorStop(0, '#9370DB');
    dressGradient.addColorStop(0.3, '#8A2BE2');
    dressGradient.addColorStop(0.7, '#9370DB');
    dressGradient.addColorStop(1, '#7B68EE');
    this.ctx.fillStyle = dressGradient;
    this.ctx.beginPath();
    
    // Animated flowing dress
    const dressAnimation = Math.sin(this.animationFrame * 0.2) * 3;
    this.ctx.moveTo(centerX, q.y + 18);
    this.ctx.lineTo(q.x - 5 + dressAnimation, q.y + q.height);
    this.ctx.lineTo(q.x + q.width + 5 - dressAnimation, q.y + q.height);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Gold trim on dress
    this.ctx.strokeStyle = '#FFD700';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    // Beautiful detailed dress pattern
    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = '#FFD700';
    for (let i = 0; i < 3; i++) {
      this.ctx.beginPath();
      this.ctx.arc(centerX - 8 + i * 8, q.y + 25 + i * 5, 2, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    // Head - Beautiful skin tone
    this.ctx.shadowBlur = 5;
    this.ctx.shadowColor = '#FFE4B5';
    this.ctx.fillStyle = '#FFE4B5';
    this.ctx.beginPath();
    this.ctx.arc(centerX, q.y + 12, 13, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Beautiful flowing hair
    this.ctx.shadowBlur = 8;
    this.ctx.shadowColor = '#8B4513';
    this.ctx.fillStyle = '#654321';
    this.ctx.beginPath();
    const hairFlow = Math.sin(this.animationFrame * 0.15) * 2;
    this.ctx.ellipse(centerX - 8, q.y + 10, 8, 12, -0.3, 0, Math.PI * 2);
    this.ctx.ellipse(centerX + 8, q.y + 10, 8, 12, 0.3, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Crown - Magnificent and detailed
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = '#FFD700';
    this.ctx.fillStyle = '#FFD700';
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - 14, q.y + 6);
    this.ctx.lineTo(centerX - 10, q.y - 3);
    this.ctx.lineTo(centerX - 6, q.y + 4);
    this.ctx.lineTo(centerX - 2, q.y - 5);
    this.ctx.lineTo(centerX + 2, q.y + 4);
    this.ctx.lineTo(centerX + 6, q.y - 3);
    this.ctx.lineTo(centerX + 10, q.y + 4);
    this.ctx.lineTo(centerX + 14, q.y - 1);
    this.ctx.lineTo(centerX + 14, q.y + 6);
    this.ctx.lineTo(centerX - 14, q.y + 6);
    this.ctx.fill();
    
    // Crown jewels - Ruby, Sapphire, Emerald
    this.ctx.shadowBlur = 10;
    const jewels = [
      { x: centerX - 10, y: q.y - 1, color: '#FF1493' }, // Ruby
      { x: centerX, y: q.y - 3, color: '#4169E1' },      // Sapphire  
      { x: centerX + 10, y: q.y - 1, color: '#50C878' }   // Emerald
    ];
    
    jewels.forEach(jewel => {
      this.ctx.shadowColor = jewel.color;
      this.ctx.fillStyle = jewel.color;
      this.ctx.beginPath();
      this.ctx.arc(jewel.x, jewel.y, 3, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Sparkle effect on jewels
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      this.ctx.beginPath();
      this.ctx.arc(jewel.x - 1, jewel.y - 1, 1, 0, Math.PI * 2);
      this.ctx.fill();
    });
    
    // Beautiful eyes
    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = '#000';
    this.ctx.beginPath();
    this.ctx.arc(centerX - 4, q.y + 11, 1.5, 0, Math.PI * 2);
    this.ctx.arc(centerX + 4, q.y + 11, 1.5, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Eyelashes
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - 5, q.y + 10);
    this.ctx.lineTo(centerX - 6, q.y + 9);
    this.ctx.moveTo(centerX + 5, q.y + 10);
    this.ctx.lineTo(centerX + 6, q.y + 9);
    this.ctx.stroke();
    
    // Beautiful smile
    this.ctx.strokeStyle = '#8B4513';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.arc(centerX, q.y + 14, 4, 0.2, Math.PI - 0.2);
    this.ctx.stroke();
    
    // Graceful arms with golden bracelets
    this.ctx.shadowBlur = 5;
    this.ctx.shadowColor = '#FFE4B5';
    this.ctx.strokeStyle = '#FFE4B5';
    this.ctx.lineWidth = 5;
    
    // Animated arms for walking/running
    const armSwing = Math.sin(q.stepFrame * Math.PI / 2) * 8;
    
    // Left arm
    this.ctx.beginPath();
    this.ctx.moveTo(q.x + 8, q.y + 22);
    this.ctx.lineTo(q.x + 2 + armSwing, q.y + 32);
    this.ctx.stroke();
    
    // Right arm
    this.ctx.beginPath();
    this.ctx.moveTo(q.x + q.width - 8, q.y + 22);
    this.ctx.lineTo(q.x + q.width - 2 - armSwing, q.y + 32);
    this.ctx.stroke();
    
    // Golden bracelets
    this.ctx.strokeStyle = '#FFD700';
    this.ctx.lineWidth = 3;
    this.ctx.shadowBlur = 8;
    this.ctx.shadowColor = '#FFD700';
    this.ctx.beginPath();
    this.ctx.arc(q.x + 2 + armSwing, q.y + 32, 3, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.arc(q.x + q.width - 2 - armSwing, q.y + 32, 3, 0, Math.PI * 2);
    this.ctx.stroke();
    
    // Reset shadow
    this.ctx.shadowBlur = 0;
  }
  
  drawObstacle(obstacle) {
    switch (obstacle.type) {
      case 'rock':
        this.ctx.fillStyle = obstacle.color;
        this.ctx.beginPath();
        this.ctx.moveTo(obstacle.x + obstacle.width / 2, obstacle.y);
        this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
        this.ctx.lineTo(obstacle.x, obstacle.y + obstacle.height);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.fillStyle = '#654321';
        this.ctx.fillRect(obstacle.x + 8, obstacle.y + 15, 4, 4);
        break;
        
      case 'cactus':
        this.ctx.fillStyle = obstacle.color;
        this.ctx.fillRect(obstacle.x + 8, obstacle.y, 10, obstacle.height);
        this.ctx.fillRect(obstacle.x, obstacle.y + 10, 8, 15);
        this.ctx.fillRect(obstacle.x + 18, obstacle.y + 10, 8, 15);
        break;
        
      case 'web':
        this.ctx.strokeStyle = obstacle.color;
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          this.ctx.beginPath();
          this.ctx.moveTo(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
          const angle = (i * Math.PI) / 2;
          this.ctx.lineTo(
            obstacle.x + obstacle.width / 2 + Math.cos(angle) * obstacle.width / 2,
            obstacle.y + obstacle.height / 2 + Math.sin(angle) * obstacle.height / 2
          );
          this.ctx.stroke();
        }
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2, 5, 0, Math.PI * 2);
        this.ctx.fill();
        break;
        
      case 'bird':
        this.ctx.fillStyle = obstacle.color;
        this.ctx.beginPath();
        this.ctx.ellipse(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2, 
                        obstacle.width / 3, obstacle.height / 3, 0, 0, Math.PI * 2);
        this.ctx.fill();
        const wingOffset = Math.sin(obstacle.wingFlap) * 5;
        this.ctx.beginPath();
        this.ctx.moveTo(obstacle.x, obstacle.y + obstacle.height / 2);
        this.ctx.quadraticCurveTo(obstacle.x - 5, obstacle.y + wingOffset, obstacle.x + 5, obstacle.y + 10);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.moveTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height / 2);
        this.ctx.quadraticCurveTo(obstacle.x + obstacle.width + 5, obstacle.y + wingOffset, 
                                  obstacle.x + obstacle.width - 5, obstacle.y + 10);
        this.ctx.fill();
        break;
    }
  }
  
  gameLoop() {
    this.update();
    this.draw();
    
    if (this.isRunning) {
      this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
  }
  
  onGameOver() {
    // Set by main script
  }
}

window.QueenShebaGame = QueenShebaGame;
