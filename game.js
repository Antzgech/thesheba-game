// ==================== QUEEN SHEBA RUNNER GAME ====================

class QueenShebaGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // Set canvas size
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    // Game state
    this.isRunning = false;
    this.isGameOver = false;
    this.score = 0;
    this.coinsCollected = 0;
    this.speed = 5;
    this.gravity = 0.6;
    this.jumpForce = -12;
    
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
    
    // Obstacles
    this.obstacles = [];
    this.obstacleTimer = 0;
    this.obstacleInterval = 100;
    
    // Coins
    this.coins = [];
    this.coinTimer = 0;
    this.coinInterval = 60;
    
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
    this.speed = 5;
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
  
  update() {
    if (!this.isRunning) return;
    
    // Update score
    this.score++;
    
    // Increase difficulty
    if (this.score % 500 === 0) {
      this.speed += 0.5;
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
      this.obstacles.push({
        x: this.canvas.width,
        y: this.groundY - 30,
        width: 30,
        height: 30,
        color: '#8B4513'
      });
    }
    
    // Update obstacles
    this.obstacles.forEach((obstacle, index) => {
      obstacle.x -= this.speed;
      
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
        collected: false
      });
    }
    
    // Update coins
    this.coins.forEach((coin, index) => {
      if (!coin.collected) {
        coin.x -= this.speed;
        
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
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
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
    
    // Draw Queen Sheba (simplified crown figure)
    this.drawQueen();
    
    // Draw obstacles (rocks)
    this.obstacles.forEach(obstacle => {
      this.ctx.fillStyle = obstacle.color;
      this.ctx.beginPath();
      this.ctx.moveTo(obstacle.x + obstacle.width / 2, obstacle.y);
      this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
      this.ctx.lineTo(obstacle.x, obstacle.y + obstacle.height);
      this.ctx.closePath();
      this.ctx.fill();
      
      // Rock texture
      this.ctx.fillStyle = '#654321';
      this.ctx.fillRect(obstacle.x + 8, obstacle.y + 15, 4, 4);
      this.ctx.fillRect(obstacle.x + 18, obstacle.y + 20, 3, 3);
    });
    
    // Draw coins
    this.coins.forEach(coin => {
      if (!coin.collected) {
        // Coin glow
        this.ctx.shadowColor = '#FFD700';
        this.ctx.shadowBlur = 10;
        
        // Coin body
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(coin.x + coin.width / 2, coin.y + coin.height / 2, coin.width / 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Coin inner circle
        this.ctx.fillStyle = '#FFA500';
        this.ctx.beginPath();
        this.ctx.arc(coin.x + coin.width / 2, coin.y + coin.height / 2, coin.width / 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
      }
    });
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
    
    // Arms (simplified)
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
