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
    
    // Queen Sheba (player) - Simple walking woman
    this.queen = {
      x: 80,
      y: 0,
      width: 35,
      height: 60,
      velocityY: 0,
      isJumping: false,
      walkCycle: 0,
      legAngle: 0
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
  
  jump() {
    if (!this.queen.isJumping) {
      this.queen.velocityY = this.jumpForce;
      this.queen.isJumping = true;
      
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
      rock: { type: 'rock', x: this.canvas.width, y: this.groundY - 35, width: 35, height: 35 },
      cactus: { type: 'cactus', x: this.canvas.width, y: this.groundY - 45, width: 30, height: 45 },
      web: { type: 'web', x: this.canvas.width, y: this.groundY - 90, width: 45, height: 45 },
      bird: { type: 'bird', x: this.canvas.width, y: this.groundY - 110, width: 40, height: 30, wingFlap: 0 }
    };
    return obstacles[type];
  }
  
  update() {
    if (!this.isRunning) return;
    
    this.score++;
    this.animationFrame++;
    
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
    }
    
    // Walking animation
    if (!this.queen.isJumping && this.animationFrame % 6 === 0) {
      this.queen.walkCycle = (this.queen.walkCycle + 1) % 4;
      this.queen.legAngle = Math.sin(this.queen.walkCycle * Math.PI / 2) * 0.3;
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
        collected: false
      });
    }
    
    // Update coins
    this.coins.forEach((coin, index) => {
      if (!coin.collected) {
        coin.x -= this.speed;
        
        if (coin.x + coin.width < 0) {
          this.coins.splice(index, 1);
        }
        
        if (this.checkCollision(this.queen, coin)) {
          coin.collected = true;
          this.coinsCollected++;
          this.coins.splice(index, 1);
          
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
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Sky gradient
    const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.groundY);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(1, '#B0E0E6');
    this.ctx.fillStyle = skyGradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.groundY);
    
    // Clouds
    this.clouds.forEach(cloud => {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      this.ctx.beginPath();
      this.ctx.ellipse(cloud.x, cloud.y, cloud.width / 2, cloud.height / 2, 0, 0, Math.PI * 2);
      this.ctx.ellipse(cloud.x + 20, cloud.y - 10, cloud.width / 3, cloud.height / 2, 0, 0, Math.PI * 2);
      this.ctx.fill();
    });
    
    // Ground
    this.ctx.fillStyle = '#8BC34A';
    this.ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);
    
    // Ground line
    this.ctx.strokeStyle = '#689F38';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.groundY);
    this.ctx.lineTo(this.canvas.width, this.groundY);
    this.ctx.stroke();
    
    // Draw Queen Sheba (simple walking woman)
    this.drawQueenSheba();
    
    // Draw obstacles (more visible)
    this.obstacles.forEach(obstacle => {
      this.drawObstacle(obstacle);
    });
    
    // Draw coins
    this.coins.forEach(coin => {
      if (!coin.collected) {
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(coin.x + coin.width / 2, coin.y + coin.height / 2, coin.width / 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#FFA500';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
      }
    });
  }
  
  drawQueenSheba() {
    const q = this.queen;
    const centerX = q.x + q.width / 2;
    
    this.ctx.save();
    
    // Head
    this.ctx.fillStyle = '#FFE4C4';
    this.ctx.beginPath();
    this.ctx.arc(centerX, q.y + 15, 10, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Hair
    this.ctx.fillStyle = '#4A2511';
    this.ctx.beginPath();
    this.ctx.arc(centerX - 5, q.y + 12, 8, 0, Math.PI * 2);
    this.ctx.arc(centerX + 5, q.y + 12, 8, 0, Math.PI * 2);
    this.ctx.arc(centerX, q.y + 10, 10, Math.PI, 0);
    this.ctx.fill();
    
    // Simple crown
    this.ctx.fillStyle = '#FFD700';
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - 8, q.y + 8);
    this.ctx.lineTo(centerX - 6, q.y + 3);
    this.ctx.lineTo(centerX - 2, q.y + 6);
    this.ctx.lineTo(centerX, q.y + 2);
    this.ctx.lineTo(centerX + 2, q.y + 6);
    this.ctx.lineTo(centerX + 6, q.y + 3);
    this.ctx.lineTo(centerX + 8, q.y + 8);
    this.ctx.fill();
    
    // Body (dress)
    this.ctx.fillStyle = '#9C27B0';
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, q.y + 25);
    this.ctx.lineTo(centerX - 12, q.y + 50);
    this.ctx.lineTo(centerX + 12, q.y + 50);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Dress details
    this.ctx.strokeStyle = '#7B1FA2';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    // Arms
    this.ctx.strokeStyle = '#FFE4C4';
    this.ctx.lineWidth = 4;
    this.ctx.lineCap = 'round';
    
    const armSwing = this.queen.legAngle * 10;
    
    // Left arm
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - 8, q.y + 28);
    this.ctx.lineTo(centerX - 12 - armSwing, q.y + 38);
    this.ctx.stroke();
    
    // Right arm
    this.ctx.beginPath();
    this.ctx.moveTo(centerX + 8, q.y + 28);
    this.ctx.lineTo(centerX + 12 + armSwing, q.y + 38);
    this.ctx.stroke();
    
    // Legs (walking animation)
    if (!this.queen.isJumping) {
      this.ctx.strokeStyle = '#FFE4C4';
      this.ctx.lineWidth = 5;
      
      const legSwing = this.queen.legAngle * 15;
      
      // Left leg
      this.ctx.beginPath();
      this.ctx.moveTo(centerX - 5, q.y + 48);
      this.ctx.lineTo(centerX - 5 - legSwing, q.y + 60);
      this.ctx.stroke();
      
      // Right leg
      this.ctx.beginPath();
      this.ctx.moveTo(centerX + 5, q.y + 48);
      this.ctx.lineTo(centerX + 5 + legSwing, q.y + 60);
      this.ctx.stroke();
    }
    
    this.ctx.restore();
  }
  
  drawObstacle(obstacle) {
    this.ctx.save();
    
    switch (obstacle.type) {
      case 'rock':
        // Simple gray rock - very visible
        this.ctx.fillStyle = '#757575';
        this.ctx.beginPath();
        this.ctx.moveTo(obstacle.x + obstacle.width / 2, obstacle.y);
        this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
        this.ctx.lineTo(obstacle.x, obstacle.y + obstacle.height);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Outline
        this.ctx.strokeStyle = '#424242';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        break;
        
      case 'cactus':
        // Green cactus - very visible
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(obstacle.x + 10, obstacle.y, 12, obstacle.height);
        this.ctx.fillRect(obstacle.x, obstacle.y + 15, 10, 20);
        this.ctx.fillRect(obstacle.x + 22, obstacle.y + 15, 10, 20);
        
        // Outline
        this.ctx.strokeStyle = '#2E7D32';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(obstacle.x + 10, obstacle.y, 12, obstacle.height);
        break;
        
      case 'web':
        // Spider web - very visible
        this.ctx.strokeStyle = '#424242';
        this.ctx.lineWidth = 3;
        
        const cx = obstacle.x + obstacle.width / 2;
        const cy = obstacle.y + obstacle.height / 2;
        
        // Draw web lines
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI) / 4;
          this.ctx.beginPath();
          this.ctx.moveTo(cx, cy);
          this.ctx.lineTo(
            cx + Math.cos(angle) * obstacle.width / 2,
            cy + Math.sin(angle) * obstacle.height / 2
          );
          this.ctx.stroke();
        }
        
        // Spider
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        this.ctx.fill();
        break;
        
      case 'bird':
        // Flying bird - very visible
        this.ctx.fillStyle = '#424242';
        
        // Body
        this.ctx.beginPath();
        this.ctx.ellipse(
          obstacle.x + obstacle.width / 2, 
          obstacle.y + obstacle.height / 2, 
          obstacle.width / 3, 
          obstacle.height / 3, 
          0, 0, Math.PI * 2
        );
        this.ctx.fill();
        
        // Wings
        const wingY = obstacle.y + obstacle.height / 2 + Math.sin(obstacle.wingFlap) * 8;
        
        this.ctx.beginPath();
        this.ctx.moveTo(obstacle.x, wingY);
        this.ctx.quadraticCurveTo(obstacle.x - 5, obstacle.y + 5, obstacle.x + 5, obstacle.y + 15);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.moveTo(obstacle.x + obstacle.width, wingY);
        this.ctx.quadraticCurveTo(obstacle.x + obstacle.width + 5, obstacle.y + 5, obstacle.x + obstacle.width - 5, obstacle.y + 15);
        this.ctx.fill();
        break;
    }
    
    this.ctx.restore();
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
