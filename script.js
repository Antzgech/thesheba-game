// ==================== CONFIGURATION ====================
const API_BASE_URL = "YOUR_API_URL_HERE"; // Replace with your backend API URL

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
    { 
      id: 1, 
      name: "Multitap", 
      level: 1, 
      cost: 20, 
      icon: "👆",
      benefit: "+1 per tap", 
      type: "tap" 
    },
    { 
      id: 2, 
      name: "Energy Limit", 
      level: 1, 
      cost: 20, 
      icon: "⚡",
      benefit: "+5 energy", 
      type: "energy" 
    },
    { 
      id: 3, 
      name: "Recharging Speed", 
      level: 1, 
      cost: 50, 
      icon: "🔋",
      benefit: "+1 regen/sec", 
      type: "regen" 
    }
  ],
  lastDailyReward: null,
  needsSync: false
};

// ==================== DOM ELEMENTS ====================
const coinsEl = document.getElementById("coins");
const coinsDisplayEl = document.getElementById("coinsDisplay");
const levelEl = document.getElementById("level");
const tapArea = document.getElementById("tapArea");
const energyText = document.getElementById("energyText");
const energyFill = document.getElementById("energyFill");
const referralLinkEl = document.getElementById("referralLink");
const upgradesEl = document.getElementById("upgrades");
const friendsContainer = document.getElementById("friendsContainer");
const friendsCountEl = document.getElementById("friendsCount");
const clickAnimationsEl = document.getElementById("clickAnimations");
const toastEl = document.getElementById("toast");

// ==================== TELEGRAM WEB APP ====================
let tg = null;
let userId = null;
let userName = "Player";
let referralLink = "";

function initTelegramWebApp() {
  if (window.Telegram && window.Telegram.WebApp) {
    tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    
    // Enable full screen mode
    tg.setHeaderColor('#0f0c29');
    tg.setBackgroundColor('#0f0c29');
    
    // Disable vertical swipes
    tg.disableVerticalSwipes();
    
    // Set theme
    if (tg.themeParams && tg.themeParams.bg_color) {
      document.body.style.backgroundColor = tg.themeParams.bg_color;
    }
    
    // Get user data
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
      userId = tg.initDataUnsafe.user.id;
      userName = tg.initDataUnsafe.user.first_name || "Player";
    }
    
    console.log("Telegram WebApp initialized");
    console.log("User ID:", userId);
  }
  
  // Fallback for testing outside Telegram
  if (!userId) {
    userId = "demo_" + Math.floor(Math.random() * 1000000);
    console.warn("Running in demo mode (outside Telegram)");
  }
  
  // Set referral link with correct bot username
  referralLink = `https://t.me/TheSheba_bot?start=ref_${userId}`;
  referralLinkEl.textContent = referralLink;
}

// ==================== API FUNCTIONS ====================
async function fetchUserData() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/${userId}`);
    if (response.ok) {
      const data = await response.json();
      return data;
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
      headers: {
        'Content-Type': 'application/json',
      },
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
      console.log("Game state synced with server");
    }
  } catch (error) {
    console.error("Failed to sync game state:", error);
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
function updateCoins() {
  gameState.coins = Math.max(0, Math.floor(gameState.coins));
  coinsEl.textContent = gameState.coins.toLocaleString();
  coinsDisplayEl.textContent = gameState.coins.toLocaleString();
  
  // Update level
  const newLevel = Math.floor(gameState.coins / 100) + 1;
  if (newLevel !== gameState.level) {
    gameState.level = newLevel;
    showToast(`🎉 Level Up! You are now Level ${gameState.level}!`);
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
}

function handleTap(event) {
  if (gameState.energy >= gameState.coinsPerTap) {
    gameState.coins += gameState.coinsPerTap;
    gameState.energy -= gameState.coinsPerTap;
    
    updateCoins();
    updateEnergy();
    
    // Create floating animation
    createCoinAnimation(event, gameState.coinsPerTap);
    
    // Haptic feedback
    if (tg && tg.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('light');
    }
  }
}

function createCoinAnimation(event, amount) {
  const rect = tapArea.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  const coinEl = document.createElement("div");
  coinEl.className = "coin-animation";
  coinEl.textContent = `+${amount}`;
  coinEl.style.left = `${x}px`;
  coinEl.style.top = `${y}px`;
  
  clickAnimationsEl.appendChild(coinEl);
  
  setTimeout(() => {
    coinEl.remove();
  }, 1000);
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
  
  if (!upgrade || gameState.coins < upgrade.cost) {
    return;
  }
  
  gameState.coins -= upgrade.cost;
  
  // Apply upgrade effect
  if (upgrade.type === "tap") {
    gameState.coinsPerTap += 1;
  } else if (upgrade.type === "energy") {
    gameState.maxEnergy += 5;
    gameState.energy += 5;
  } else if (upgrade.type === "regen") {
    gameState.energyRegenRate += 1;
  }
  
  // Upgrade progression
  upgrade.level += 1;
  upgrade.cost = Math.floor(upgrade.cost * 2);
  
  updateCoins();
  updateEnergy();
  showToast(`${upgrade.name} upgraded to level ${upgrade.level}!`);
  
  // Haptic feedback
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
  showToast("✅ Daily reward claimed: +50 Gifts!");
  
  if (tg && tg.HapticFeedback) {
    tg.HapticFeedback.notificationOccurred('success');
  }
}

function joinChannelReward() {
  gameState.coins += 100;
  updateCoins();
  showToast("✅ Reward claimed: +100 Gifts!");
  
  // Open Telegram channel
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
  
  // Open YouTube channel
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
      showToast("📋 Referral link copied to clipboard!");
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
    showToast("📋 Referral link copied!");
  } catch (err) {
    showToast("❌ Failed to copy link");
  }
  
  document.body.removeChild(textArea);
}

function shareReferral() {
  const shareText = "Join me in Saba Gift and earn rewards! 🎁";
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
        <div class="empty-text">No friends invited yet</div>
        <div class="empty-subtext">Share your link to get started!</div>
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
      
      // Load referrals when switching to friends section
      if (targetSection === 'friends') {
        loadReferrals();
      }
      
      // Update active nav item
      navItems.forEach(item => item.classList.remove("active"));
      navItem.classList.add("active");
      
      // Update active section
      sections.forEach(section => {
        if (section.id === `${targetSection}Section`) {
          section.classList.add("active");
          // Scroll to top of section
          section.scrollTop = 0;
        } else {
          section.classList.remove("active");
        }
      });
      
      // Haptic feedback
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
    console.error("Failed to save game state:", error);
  }
}

function loadGameState() {
  try {
    const savedData = localStorage.getItem(`sabaGift_${userId}`);
    
    if (savedData) {
      const data = JSON.parse(savedData);
      
      // Restore game state
      gameState.coins = data.coins || 0;
      gameState.maxEnergy = data.maxEnergy || 10;
      gameState.coinsPerTap = data.coinsPerTap || 1;
      gameState.level = data.level || 1;
      gameState.energyRegenRate = data.energyRegenRate || 1;
      gameState.upgrades = data.upgrades || gameState.upgrades;
      gameState.friends = data.friends || [];
      gameState.lastDailyReward = data.lastDailyReward;
      
      // Calculate energy regenerated while offline
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
    console.error("Failed to load game state:", error);
  }
  
  return false;
}

// ==================== PREVENT ZOOM & SCROLL ====================
function preventZoom() {
  // Prevent double-tap zoom
  let lastTouchEnd = 0;
  document.addEventListener('touchend', function(event) {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, false);
  
  // Prevent pinch zoom
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
  
  // Try to load from localStorage first
  const loaded = loadGameState();
  
  // Then try to sync with server
  const serverData = await fetchUserData();
  if (serverData) {
    // Server data takes precedence if it has higher coins
    if (serverData.coins > gameState.coins) {
      gameState.coins = serverData.coins;
      gameState.level = serverData.level || gameState.level;
      console.log("Loaded game state from server");
    }
  }
  
  if (!loaded && !serverData) {
    gameState.energy = gameState.maxEnergy;
    showToast(`👋 Welcome ${userName}! Start tapping to earn gifts!`);
  }
  
  updateCoins();
  updateEnergy();
  renderUpgrades();
  renderFriends();
  setupNavigation();
  startEnergyRegen();
  
  // Event listeners
  tapArea.addEventListener("click", handleTap);
  
  // Prevent context menu on long press
  tapArea.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });
  
  // Save game state periodically
  setInterval(saveGameState, 30000); // Every 30 seconds
  
  // Sync with server periodically
  setInterval(syncGameState, 60000); // Every 60 seconds
  
  // Save and sync on page unload
  window.addEventListener("beforeunload", () => {
    saveGameState();
    syncGameState();
  });
  
  // Handle visibility change
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      saveGameState();
      syncGameState();
    } else {
      // Reload referrals when app becomes visible
      loadReferrals();
    }
  });
  
  console.log("Saba Gift initialized successfully!");
  console.log("User ID:", userId);
  console.log("User Name:", userName);
  console.log("Referral Link:", referralLink);
}

// Start the game when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
