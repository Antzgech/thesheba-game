// ==================== CONFIGURATION ====================
const API_BASE_URL = "http://localhost:5000"; // Change for production

// ==================== GAME STATE ====================
let gameState = {
  coins: 0,
  energy: 10,
  maxEnergy: 10,
  coinsPerTap: 1,
  level: 1,
  energyRegenRate: 1,
  friends: [],
  upgrades: [
    { id: 1, name: "Multitap", level: 1, cost: 20, icon: "👆", benefit: "+1 per tap", type: "tap" },
    { id: 2, name: "Energy Limit", level: 1, cost: 20, icon: "⚡", benefit: "+5 energy", type: "energy" },
    { id: 3, name: "Recharging Speed", level: 1, cost: 50, icon: "🔋", benefit: "+1 regen/sec", type: "regen" }
  ],
  lastDailyReward: null,
  needsSync: false
};

// ==================== DOM ELEMENTS ====================
const coinsEl = document.getElementById("coins");
const coinsDisplayEl = document.getElementById("coinsDisplay");
const levelEl = document.getElementById("level");
const energyText = document.getElementById("energyText");
const energyFill = document.getElementById("energyFill");
const referralLinkEl = document.getElementById("referralLink");
const upgradesEl = document.getElementById("upgrades");
const friendsContainer = document.getElementById("friendsContainer");
const friendsCountEl = document.getElementById("friendsCount");
const toastEl = document.getElementById("toast");

// ==================== TELEGRAM WEB APP ====================
let tg = null;
let userId = null;
let userName = "Player";
let userPhone = null;
let referralLink = "";
let verificationCode = null;

function initTelegramWebApp() {
  if (window.Telegram && window.Telegram.WebApp) {
    tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    
    tg.setHeaderColor('#0f0c29');
    tg.setBackgroundColor('#0f0c29');
    tg.disableVerticalSwipes();
    
    if (tg.themeParams && tg.themeParams.bg_color) {
      document.body.style.backgroundColor = tg.themeParams.bg_color;
    }
    
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
      userId = tg.initDataUnsafe.user.id;
      userName = tg.initDataUnsafe.user.first_name || "Player";
      
      // Get phone from Telegram
      if (tg.initDataUnsafe.user.phone_number) {
        userPhone = tg.initDataUnsafe.user.phone_number;
        console.log("📱 Phone detected from Telegram:", userPhone);
      }
    }
    
    console.log("Telegram WebApp initialized");
  }
  
  if (!userId) {
    userId = "demo_" + Math.floor(Math.random() * 1000000);
    console.warn("Running in demo mode");
  }
  
  referralLink = `https://t.me/TheSheba_bot?start=ref_${userId}`;
  referralLinkEl.textContent = referralLink;
}

// ==================== API FUNCTIONS ====================
async function fetchUserData() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/${userId}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error("Failed to fetch user data:", error);
  }
  return null;
}

async function syncGameState() {
  if (!gameState.needsSync) return;
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/${userId}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coins: gameState.coins,
        level: gameState.level,
        energy: gameState.energy,
        maxEnergy: gameState.maxEnergy,
        coinsPerTap: gameState.coinsPerTap,
        energyRegenRate: gameState.energyRegenRate,
        upgrades: gameState.upgrades,
        lastDailyReward: gameState.lastDailyReward
      })
    });
    
    if (response.ok) {
      gameState.needsSync = false;
      console.log("Game state synced");
    }
  } catch (error) {
    console.error("Failed to sync:", error);
  }
}

async function fetchReferrals() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/${userId}/referrals`);
    if (response.ok) {
      const data = await response.json();
      return data.friends || [];
    }
  } catch (error) {
    console.error("Failed to fetch referrals:", error);
  }
  return [];
}

// ==================== GAME FUNCTIONS ====================
let queenShebaGame = null;

function initGame() {
  const canvas = document.getElementById('gameCanvas');
  const overlay = document.getElementById('gameOverlay');
  const startBtn = document.getElementById('startBtn');
  
  const gameScript = document.createElement('script');
  gameScript.src = 'game.js';
  gameScript.onload = () => {
    queenShebaGame = new window.QueenShebaGame(canvas, gameState.level);
    
    queenShebaGame.onGameOver = function() {
      overlay.classList.remove('hidden');
      
      const coinsEarned = this.coinsCollected * gameState.coinsPerTap;
      const distanceBonus = Math.floor(this.score / 100);
      const totalReward = coinsEarned + distanceBonus;
      
      gameState.coins += totalReward;
      updateCoins();
      
      showToast(`🎮 Journey ended! Earned ${totalReward} gifts!`);
      
      document.querySelector('.game-instructions h3').textContent = '🎮 Journey Complete!';
      document.querySelector('.game-instructions').innerHTML = `
        <h3>🎮 Journey Complete!</h3>
        <p><strong>Distance Traveled:</strong> ${this.score}</p>
        <p><strong>Gifts Collected:</strong> ${this.coinsCollected}</p>
        <p><strong>Total Earned:</strong> ${totalReward} Gifts</p>
        <button class="start-game-btn" id="startBtn">Continue Journey</button>
      `;
      
      document.getElementById('startBtn').onclick = startGame;
      
      if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('error');
      }
    };
  };
  document.head.appendChild(gameScript);
  
  startBtn.onclick = startGame;
}

function startGame() {
  if (gameState.energy < 1) {
    showToast('⚠️ Not enough energy! Wait for recharge.');
    return;
  }
  
  gameState.energy -= 1;
  updateEnergy();
  
  const overlay = document.getElementById('gameOverlay');
  overlay.classList.add('hidden');
  
  document.querySelector('.game-instructions').innerHTML = `
    <h3>👑 The Quest Begins</h3>
    <p>Queen Sheba must journey to Jerusalem to meet the wise King Solomon</p>
    <p><strong>Tap/Space</strong> to jump over obstacles</p>
    <p><strong>Collect gifts</strong> to present to the King</p>
    <button class="start-game-btn" id="startBtn">Begin Journey</button>
  `;
  
  queenShebaGame.start();
  
  const updateScore = setInterval(() => {
    if (queenShebaGame && queenShebaGame.isRunning) {
      document.getElementById('gameScore').textContent = `Distance: ${queenShebaGame.score}`;
    } else {
      clearInterval(updateScore);
    }
  }, 100);
}

function updateCoins() {
  gameState.coins = Math.max(0, Math.floor(gameState.coins));
  coinsEl.textContent = gameState.coins.toLocaleString();
  coinsDisplayEl.textContent = gameState.coins.toLocaleString();
  
  const newLevel = Math.floor(gameState.coins / 100) + 1;
  if (newLevel !== gameState.level) {
    gameState.level = newLevel;
    showToast(`🎉 Level Up! You are now Level ${gameState.level}!`);
    
    // Recreate game with new level
    if (queenShebaGame) {
      queenShebaGame.playerLevel = gameState.level;
    }
  }
  levelEl.textContent = gameState.level;
  
  renderUpgrades();
  saveGameState();
  gameState.needsSync = true;
}

function updateEnergy() {
  energyText.textContent = `${gameState.energy}/${gameState.maxEnergy}`;
  const percentage = (gameState.energy / gameState.maxEnergy) * 100;
  energyFill.style.width = `${percentage}%`;
  
  const regenDisplay = document.querySelector('.energy-regen');
  if (regenDisplay) {
    regenDisplay.textContent = `+${gameState.energyRegenRate}/sec`;
  }
}

// ==================== UPGRADES ====================
function renderUpgrades() {
  upgradesEl.innerHTML = "";
  
  gameState.upgrades.forEach(upgrade => {
    const canAfford = gameState.coins >= upgrade.cost;
    
    const upgradeCard = document.createElement("div");
    upgradeCard.className = `upgrade-card ${canAfford ? "" : "disabled"}`;
    
    upgradeCard.innerHTML = `
      <div class="upgrade-icon">${upgrade.icon}</div>
      <div class="upgrade-info">
        <div class="upgrade-name">${upgrade.name}</div>
        <div class="upgrade-benefit">${upgrade.benefit}</div>
        <div class="upgrade-level">Level ${upgrade.level}</div>
      </div>
      <div class="upgrade-cost">
        <div class="cost-amount">${upgrade.cost.toLocaleString()}</div>
        <div class="cost-label">Gifts</div>
      </div>
    `;
    
    if (canAfford) {
      upgradeCard.onclick = () => buyUpgrade(upgrade.id);
    }
    
    upgradesEl.appendChild(upgradeCard);
  });
}

function buyUpgrade(upgradeId) {
  const upgrade = gameState.upgrades.find(u => u.id === upgradeId);
  
  if (!upgrade || gameState.coins < upgrade.cost) return;
  
  gameState.coins -= upgrade.cost;
  
  if (upgrade.type === "tap") {
    gameState.coinsPerTap += 1;
  } else if (upgrade.type === "energy") {
    gameState.maxEnergy += 5;
    gameState.energy += 5;
  } else if (upgrade.type === "regen") {
    gameState.energyRegenRate += 1;
  }
  
  upgrade.level += 1;
  upgrade.cost = Math.floor(upgrade.cost * 2);
  
  updateCoins();
  updateEnergy();
  showToast(`${upgrade.name} upgraded to level ${upgrade.level}!`);
  
  if (tg && tg.HapticFeedback) {
    tg.HapticFeedback.notificationOccurred('success');
  }
}

// ==================== TASKS / REWARDS ====================
function claimDailyReward() {
  const today = new Date().toDateString();
  
  if (gameState.lastDailyReward === today) {
    showToast("⚠️ Daily reward already claimed today!");
    return;
  }
  
  gameState.coins += 50;
  gameState.lastDailyReward = today;
  
  updateCoins();
  showToast("✅ Daily blessing claimed: +50 Gifts!");
  
  if (tg && tg.HapticFeedback) {
    tg.HapticFeedback.notificationOccurred('success');
  }
}

function joinChannelReward() {
  gameState.coins += 100;
  updateCoins();
  showToast("✅ Reward claimed: +100 Gifts!");
  
  if (tg && tg.openTelegramLink) {
    tg.openTelegramLink("https://t.me/TheShebaBot");
  } else {
    window.open("https://t.me/TheShebaBot", "_blank");
  }
}

function subscribeChannelReward() {
  gameState.coins += 200;
  updateCoins();
  showToast("✅ Reward claimed: +200 Gifts!");
  
  if (tg && tg.openLink) {
    tg.openLink("https://www.youtube.com/@SabawianProduction");
  } else {
    window.open("https://www.youtube.com/@SabawianProduction", "_blank");
  }
}

// ==================== REFERRAL / FRIENDS ====================
function copyReferral() {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(referralLink).then(() => {
      showToast("📋 Invitation link copied!");
    }).catch(() => {
      fallbackCopyReferral();
    });
  } else {
    fallbackCopyReferral();
  }
  
  if (tg && tg.HapticFeedback) {
    tg.HapticFeedback.notificationOccurred('success');
  }
}

function fallbackCopyReferral() {
  const textArea = document.createElement("textarea");
  textArea.value = referralLink;
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.select();
  
  try {
    document.execCommand('copy');
    showToast("📋 Link copied!");
  } catch (err) {
    showToast("❌ Failed to copy");
  }
  
  document.body.removeChild(textArea);
}

function shareReferral() {
  const shareText = "Join Queen Sheba's journey and earn rewards! 👑🎁";
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`;
  
  if (tg && tg.openTelegramLink) {
    tg.openTelegramLink(shareUrl);
  } else {
    window.open(shareUrl, "_blank");
  }
  
  if (tg && tg.HapticFeedback) {
    tg.HapticFeedback.impactOccurred('medium');
  }
}

async function loadReferrals() {
  const friends = await fetchReferrals();
  gameState.friends = friends;
  renderFriends();
}

function renderFriends() {
  if (gameState.friends.length === 0) {
    friendsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">👥</div>
        <div class="empty-text">No companions yet</div>
        <div class="empty-subtext">Share your link to journey together!</div>
      </div>
    `;
  } else {
    friendsContainer.innerHTML = "";
    gameState.friends.forEach(friend => {
      const friendEl = document.createElement("div");
      friendEl.className = "friend-item";
      friendEl.innerHTML = `
        <div class="friend-avatar">${friend.name ? friend.name.charAt(0).toUpperCase() : '?'}</div>
        <div class="friend-info">
          <div class="friend-name">${friend.name || `User ${friend.id}`}</div>
          <div class="friend-earnings">Level ${friend.level || 1} • ${friend.coins || 0} Gifts</div>
        </div>
      `;
      friendsContainer.appendChild(friendEl);
    });
  }
  
  friendsCountEl.textContent = gameState.friends.length;
}

// ==================== NAVIGATION ====================
function setupNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  const sections = document.querySelectorAll(".section");
  
  navItems.forEach(navItem => {
    navItem.addEventListener("click", () => {
      const targetSection = navItem.dataset.section;
      
      if (targetSection === 'friends') {
        loadReferrals();
      }
      
      navItems.forEach(item => item.classList.remove("active"));
      navItem.classList.add("active");
      
      sections.forEach(section => {
        if (section.id === `${targetSection}Section`) {
          section.classList.add("active");
          section.scrollTop = 0;
        } else {
          section.classList.remove("active");
        }
      });
      
      if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
      }
    });
  });
}

// ==================== TOAST NOTIFICATION ====================
function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  
  setTimeout(() => {
    toastEl.classList.remove("show");
  }, 3000);
}

// ==================== ENERGY REGENERATION ====================
function startEnergyRegen() {
  setInterval(() => {
    if (gameState.energy < gameState.maxEnergy) {
      gameState.energy = Math.min(
        gameState.energy + gameState.energyRegenRate, 
        gameState.maxEnergy
      );
      updateEnergy();
    }
  }, 1000);
}

// ==================== LOCAL STORAGE ====================
function saveGameState() {
  try {
    const saveData = {
      coins: gameState.coins,
      energy: gameState.energy,
      maxEnergy: gameState.maxEnergy,
      coinsPerTap: gameState.coinsPerTap,
      level: gameState.level,
      energyRegenRate: gameState.energyRegenRate,
      upgrades: gameState.upgrades,
      friends: gameState.friends,
      lastDailyReward: gameState.lastDailyReward,
      timestamp: Date.now()
    };
    localStorage.setItem(`sabaGift_${userId}`, JSON.stringify(saveData));
  } catch (error) {
    console.error("Failed to save:", error);
  }
}

function loadGameState() {
  try {
    const savedData = localStorage.getItem(`sabaGift_${userId}`);
    
    if (savedData) {
      const data = JSON.parse(savedData);
      
      gameState.coins = data.coins || 0;
      gameState.maxEnergy = data.maxEnergy || 10;
      gameState.coinsPerTap = data.coinsPerTap || 1;
      gameState.level = data.level || 1;
      gameState.energyRegenRate = data.energyRegenRate || 1;
      gameState.upgrades = data.upgrades || gameState.upgrades;
      gameState.friends = data.friends || [];
      gameState.lastDailyReward = data.lastDailyReward;
      
      if (data.timestamp) {
        const timePassed = Math.floor((Date.now() - data.timestamp) / 1000);
        const energyGained = Math.min(
          timePassed * gameState.energyRegenRate,
          gameState.maxEnergy
        );
        gameState.energy = Math.min(energyGained, gameState.maxEnergy);
        
        if (energyGained > 0) {
          showToast(`⚡ Welcome back! +${energyGained} energy recharged!`);
        }
      } else {
        gameState.energy = gameState.maxEnergy;
      }
      
      return true;
    }
  } catch (error) {
    console.error("Failed to load:", error);
  }
  
  return false;
}

// ==================== PHONE REGISTRATION ====================
async function checkPhoneRegistration() {
  const phoneRegistered = localStorage.getItem(`phoneVerified_${userId}`);
  
  if (phoneRegistered === 'true') {
    return; // Already verified
  }
  
  // Check server
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/${userId}`);
    if (response.ok) {
      const data = await response.json();
      if (data.phone_verified) {
        localStorage.setItem(`phoneVerified_${userId}`, 'true');
        return;
      }
    }
  } catch (error) {
    console.error('Error checking phone:', error);
  }
  
  // Show verification modal
  showPhoneModal();
}

function showPhoneModal() {
  const modal = document.getElementById('phoneModal');
  const phoneInput = document.getElementById('phoneInput');
  const sendBtn = document.getElementById('sendVerifyBtn');
  
  // Auto-fill phone if detected from Telegram
  if (userPhone) {
    // Clean phone number (remove +251 or spaces)
    let cleanPhone = userPhone.replace(/\s/g, '').replace('+251', '0');
    if (!cleanPhone.startsWith('09')) {
      cleanPhone = '09' + cleanPhone.slice(-8);
    }
    
    phoneInput.value = cleanPhone;
    phoneInput.readOnly = true;
    
    // Auto-send verification code immediately
    setTimeout(() => {
      sendVerificationCode();
    }, 500);
  } else {
    phoneInput.readOnly = false;
  }
  
  modal.classList.remove('hidden');
}

function hidePhoneModal() {
  const modal = document.getElementById('phoneModal');
  modal.classList.add('hidden');
}

async function sendVerificationCode() {
  const phoneInput = document.getElementById('phoneInput');
  const phone = phoneInput.value.trim();
  const sendBtn = document.getElementById('sendVerifyBtn');
  const codeInput = document.getElementById('codeInput');
  
  // Validate format
  if (!/^09[0-9]{8}$/.test(phone)) {
    showToast('❌ Invalid phone format! Use: 09XXXXXXXX');
    return;
  }
  
  // Generate code from last 3 digits of phone
  verificationCode = phone.slice(-3);
  
  try {
    // Send SMS via Telegram
    const response = await fetch(`${API_BASE_URL}/api/user/${userId}/send_sms_code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone_number: phone,
        code: verificationCode,
        user_id: userId
      })
    });
    
    if (response.ok) {
      // Change UI for verification
      phoneInput.disabled = true;
      sendBtn.textContent = 'Verify';
      sendBtn.onclick = verifyCode;
      codeInput.disabled = false;
      codeInput.focus();
      
      showToast(`📱 SMS sent to ${phone}! Check your messages.`);
    } else {
      showToast('❌ Failed to send code. Try again.');
    }
  } catch (error) {
    console.error('SMS send error:', error);
    showToast('❌ Connection error.');
  }
}

async function verifyCode() {
  const codeInput = document.getElementById('codeInput');
  const enteredCode = codeInput.value.trim();
  const phoneInput = document.getElementById('phoneInput');
  const phone = phoneInput.value.trim();
  
  if (enteredCode !== verificationCode) {
    showToast('❌ Invalid code! Check your SMS.');
    codeInput.value = '';
    return;
  }
  
  // Code correct - save to database
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/${userId}/update_contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone_number: phone,
        username: userName,
        verified: true
      })
    });
    
    if (response.ok) {
      localStorage.setItem(`phoneVerified_${userId}`, 'true');
      hidePhoneModal();
      showToast(`✅ Welcome to the quest, ${userName}! 👑`);
      
      if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
      }
    } else {
      showToast('❌ Failed to save. Try again.');
    }
  } catch (error) {
    console.error('Verification error:', error);
    showToast('❌ Connection error.');
  }
}

function setupPhoneRegistration() {
  const sendBtn = document.getElementById('sendVerifyBtn');
  sendBtn.onclick = sendVerificationCode;
}

// ==================== PREVENT ZOOM & SCROLL ====================
function preventZoom() {
  let lastTouchEnd = 0;
  document.addEventListener('touchend', function(event) {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, false);
  
  document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
  });
  
  document.addEventListener('gesturechange', function(e) {
    e.preventDefault();
  });
  
  document.addEventListener('gestureend', function(e) {
    e.preventDefault();
  });
}

// ==================== INITIALIZATION ====================
async function init() {
  initTelegramWebApp();
  preventZoom();
  
  // Check phone verification first
  await checkPhoneRegistration();
  
  const loaded = loadGameState();
  
  const serverData = await fetchUserData();
  if (serverData) {
    if (serverData.coins > gameState.coins) {
      gameState.coins = serverData.coins;
      gameState.level = serverData.level || gameState.level;
    }
  }
  
  if (!loaded && !serverData) {
    gameState.energy = gameState.maxEnergy;
    showToast(`👋 Welcome ${userName}! Begin your journey!`);
  }
  
  updateCoins();
  updateEnergy();
  renderUpgrades();
  renderFriends();
  setupNavigation();
  startEnergyRegen();
  initGame();
  setupPhoneRegistration();
  
  setInterval(saveGameState, 30000);
  setInterval(syncGameState, 60000);
  
  window.addEventListener("beforeunload", () => {
    saveGameState();
    syncGameState();
  });
  
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      saveGameState();
      syncGameState();
      if (queenShebaGame && queenShebaGame.isRunning) {
        queenShebaGame.stop();
      }
    } else {
      loadReferrals();
    }
  });
  
  console.log("Queen Sheba's Journey initialized!");
  console.log("User:", userName, "ID:", userId);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
