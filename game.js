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
    this.baseSpeed = 6 + (this.playerLevel * 0.5); // Speed increases with level
    this.speed = this.baseSpeed;
    this.gravity = 0.6;
    this.jumpForce = -13; // Slightly faster jump
    
    // Queen Sheba (player)
    this.queen = {
      x: 80,
      y: 0,
      width: 40,
      height: 50,
      velocityY: 0,
      isJumping: false,
      color: '#FFD700'
    };
    
    // Ground
    this.groundY = this.canvas.height - 50;
    this.queen.y = this.groundY - this.queen.height;
    
    // Obstacles - Different types based on level
    this.obstacles = [];
    this.obstacleTimer = 0;
    this.obstacleInterval = Math.max(80 - (this.playerLevel * 5), 50); // Faster spawning at higher levels
    
    // Coins
    this.coins = [];
    this.coinTimer = 0;
    this.coinInterval = 50;
    
    // Clouds
    this.clouds = [];
    this.initClouds();
    
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
    // Space bar
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && this.isRunning) {
        e.preventDefault();
        this.jump();
      }
    });
    
    // Touch/Click
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
  
  jump() {
    if (!this.queen.isJumping) {
      this.queen.velocityY = this.jumpForce;
      this.queen.isJumping = true;
      
      // Haptic feedback
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
    this.queen.y = this.groundY - this.queen.height;
    this.queen.velocityY = 0;
    this.queen.isJumping = false;
    
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
    // Level 1: Only rocks
    // Level 2+: Rocks and cacti
    // Level 3+: Rocks, cacti, and webs
    // Level 4+: All three plus birds
    
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
      rock: {
        type: 'rock',
        x: this.canvas.width,
        y: this.groundY - 30,
        width: 30,
        height: 30,
        color: '#8B4513'
      },
      cactus: {
        type: 'cactus',
        x: this.canvas.width,
        y: this.groundY - 40,
        width: 25,
        height: 40,
        color: '#228B22'
      },
      web: {
        type: 'web',
        x: this.canvas.width,
        y: this.groundY - 80,
        width: 40,
        height: 40,
        color: '#C0C0C0'
      },
      bird: {
        type: 'bird',
        x: this.canvas.width,
        y: this.groundY - 100,
        width: 35,
        height: 25,
        color: '#000000',
        wingFlap: 0
      }
    };
    
    return obstacles[type];
  }
  
  update() {
    if (!this.isRunning) return;
    
    // Update score
    this.score++;
    
    // Increase difficulty gradually
    if (this.score % 500 === 0) {
      this.speed += 0.3;
    }
    
    // Update Queen Sheba
    this.queen.velocityY += this.gravity;
    this.queen.y += this.queen.velocityY;
    
    // Ground collision
    if (this.queen.y >= this.groundY - this.queen.height) {
      this.queen.y = this.groundY - this.queen.height;
      this.queen.velocityY = 0;
      this.queen.isJumping = false;
    }
    
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
      const obstacleType = this.getObstacleType();
      this.obstacles.push(this.createObstacle(obstacleType));
    }
    
    // Update obstacles
    this.obstacles.forEach((obstacle, index) => {
      obstacle.x -= this.speed;
      
      // Animate bird wings
      if (obstacle.type === 'bird') {
        obstacle.wingFlap = (obstacle.wingFlap + 0.2) % (Math.PI * 2);
      }
      
      // Remove off-screen obstacles
      if (obstacle.x + obstacle.width < 0) {
        this.obstacles.splice(index, 1);
      }
      
      // Check collision
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
        rotation: 0
      });
    }
    
    // Update coins
    this.coins.forEach((coin, index) => {
      if (!coin.collected) {
        coin.x -= this.speed;
        coin.rotation += 0.1;
        
        // Remove off-screen coins
        if (coin.x + coin.width < 0) {
          this.coins.splice(index, 1);
        }
        
        // Check collection
        if (this.checkCollision(this.queen, coin)) {
          coin.collected = true;
          this.coinsCollected++;
          this.coins.splice(index, 1);
          
          // Haptic feedback
          if (window.tg && window.tg.HapticFeedback) {
            window.tg.HapticFeedback.impactOccurred('light');
          }
        }
      }
    });
  }
  
  checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width - 5 &&
           rect1.x + rect1.width - 5 > rect2.x &&
           rect1.y < rect2.y + rect2.height - 5 &&
           rect1.y + rect1.height - 5 > rect2.y;
  }
  
  draw() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw sky (gradient)
    const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.groundY);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(1, '#B0E0E6');
    this.ctx.fillStyle = skyGradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.groundY);
    
    // Draw clouds
    this.clouds.forEach(cloud => {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      this.ctx.beginPath();
      this.ctx.ellipse(cloud.x, cloud.y, cloud.width / 2, cloud.height / 2, 0, 0, Math.PI * 2);
      this.ctx.ellipse(cloud.x + 20, cloud.y - 10, cloud.width / 3, cloud.height / 2, 0, 0, Math.PI * 2);
      this.ctx.ellipse(cloud.x + 40, cloud.y, cloud.width / 2.5, cloud.height / 2, 0, 0, Math.PI * 2);
      this.ctx.fill();
    });
    
    // Draw ground
    this.ctx.fillStyle = '#90EE90';
    this.ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);
    
    // Draw grass pattern
    this.ctx.fillStyle = '#228B22';
    for (let i = 0; i < this.canvas.width; i += 20) {
      this.ctx.fillRect(i, this.groundY, 10, 5);
    }
    
    // Draw Queen Sheba
    this.drawQueen();
    
    // Draw obstacles based on type
    this.obstacles.forEach(obstacle => {
      this.drawObstacle(obstacle);
    });
    
    // Draw coins
    this.coins.forEach(coin => {
      if (!coin.collected) {
        this.ctx.save();
        this.ctx.translate(coin.x + coin.width / 2, coin.y + coin.height / 2);
        this.ctx.rotate(coin.rotation);
        
        // Coin glow
        this.ctx.shadowColor = '#FFD700';
        this.ctx.shadowBlur = 10;
        
        // Coin body
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, coin.width / 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Coin inner circle
        this.ctx.fillStyle = '#FFA500';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, coin.width / 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
        this.ctx.restore();
      }
    });
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
        // Draw spider web pattern
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
        // Spider in center
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2, 5, 0, Math.PI * 2);
        this.ctx.fill();
        break;
        
      case 'bird':
        this.ctx.fillStyle = obstacle.color;
        this.ctx.beginPath();
        // Body
        this.ctx.ellipse(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2, 
                        obstacle.width / 3, obstacle.height / 3, 0, 0, Math.PI * 2);
        this.ctx.fill();
        // Wings
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
  
  drawQueen() {
    const q = this.queen;
    
    // Shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    this.ctx.beginPath();
    this.ctx.ellipse(q.x + q.width / 2, this.groundY - 5, q.width / 2, 5, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Body (dress)
    const bodyGradient = this.ctx.createLinearGradient(q.x, q.y, q.x, q.y + q.height);
    bodyGradient.addColorStop(0, '#9370DB');
    bodyGradient.addColorStop(1, '#8A2BE2');
    this.ctx.fillStyle = bodyGradient;
    this.ctx.beginPath();
    this.ctx.moveTo(q.x + q.width / 2, q.y + 15);
    this.ctx.lineTo(q.x, q.y + q.height);
    this.ctx.lineTo(q.x + q.width, q.y + q.height);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Head
    this.ctx.fillStyle = '#FFE4B5';
    this.ctx.beginPath();
    this.ctx.arc(q.x + q.width / 2, q.y + 10, 12, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Crown
    this.ctx.fillStyle = '#FFD700';
    this.ctx.beginPath();
    this.ctx.moveTo(q.x + q.width / 2 - 12, q.y + 5);
    this.ctx.lineTo(q.x + q.width / 2 - 8, q.y - 2);
    this.ctx.lineTo(q.x + q.width / 2 - 4, q.y + 3);
    this.ctx.lineTo(q.x + q.width / 2, q.y - 5);
    this.ctx.lineTo(q.x + q.width / 2 + 4, q.y + 3);
    this.ctx.lineTo(q.x + q.width / 2 + 8, q.y - 2);
    this.ctx.lineTo(q.x + q.width / 2 + 12, q.y + 5);
    this.ctx.lineTo(q.x + q.width / 2 - 12, q.y + 5);
    this.ctx.fill();
    
    // Crown jewels
    this.ctx.fillStyle = '#FF1493';
    this.ctx.beginPath();
    this.ctx.arc(q.x + q.width / 2, q.y - 3, 2, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Arms
    this.ctx.strokeStyle = '#FFE4B5';
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.moveTo(q.x + 5, q.y + 20);
    this.ctx.lineTo(q.x - 3, q.y + 28);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(q.x + q.width - 5, q.y + 20);
    this.ctx.lineTo(q.x + q.width + 3, q.y + 28);
    this.ctx.stroke();
  }
  
  gameLoop() {
    this.update();
    this.draw();
    
    if (this.isRunning) {
      this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
  }
  
  onGameOver() {
    // This will be set by the main script
  }
}

// Export for use in main script
window.QueenShebaGame = QueenShebaGame;
