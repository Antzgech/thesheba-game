let coins = 0;
let energy = 1000;
let maxEnergy = 1000;
let coinsPerTap = 1;
let level = 1;

const contentEl = document.getElementById("content");

const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || "0";
const referralLink = `https://t.me/YourBot?start=ref_${userId}`;

// Upgrades
let upgrades = [
  { id: 1, name: "Multitap", level: 1, cost: 2000, benefit: "+1 per tap", type: "tap" },
  { id: 2, name: "Energy Limit", level: 1, cost: 2000, benefit: "+500 energy", type: "energy" }
];

// Tabs
function setTab(tab) {
  document.querySelectorAll(".nav button").forEach(btn => btn.classList.remove("active"));
  document.getElementById(`tab-${tab}`).classList.add("active");

  if (tab === "home") renderHome();
  if (tab === "mine") renderMine();
  if (tab === "earn") renderEarn();
  if (tab === "friends") renderFriends();
}

// Home
function renderHome() {
  contentEl.innerHTML = `
    <h2>Your Gifts</h2>
    <div id="coins" class="coins">${coins}</div>
    <div id="level" class="level">Level ${level}</div>
    <div class="tap-area" id="tapArea">🎁</div>
    <div class="energy-bar">
      <span id="energyText">${energy}/${maxEnergy}</span>
      <div class="bar"><div id="energyFill"></div></div>
    </div>
  `;
  document.getElementById("tapArea").onclick = tapGift;
  updateEnergy();
  updateCoins();
}

// Mine
function renderMine() {
  contentEl.innerHTML = `<h2>Mine</h2><p>Upgrade your passive income</p><div id="upgrades"></div>`;
  renderUpgrades();
}

// Earn
function renderEarn() {
  contentEl.innerHTML = `
    <h2>Earn More</h2>
    <div class="task">
      <span>🎁 Daily Reward</span>
      <button onclick="claimDailyReward()">Claim +5000</button>
    </div>
    <div class="task">
      <span>📱 Join Telegram Channel (@TheShebaBot)</span>
      <button onclick="joinChannelReward()">+10,000 coins</button>
    </div>
    <div class="task">
      <span>▶️ Subscribe YouTube Channel</span>
      <button onclick="subscribeYouTube()">+20,000 coins</button>
    </div>
  `;
}

// Friends
function renderFriends() {
  contentEl.innerHTML = `
    <h2>Invite Friends</h2>
    <p>Get 10% from friends + 2.5% from their referrals</p>
    <div class="referral">
      <div>${referralLink}</div>
      <button onclick="copyReferral()">Copy Link</button>
      <button onclick="shareReferral()">Share</button>
    </div>
    <div class="friends-list">
      <h3>Your Friends</h3>
      <div id="friendsContainer">No friends invited yet</div>
    </div>
  `;
}

// Tap
function tapGift() {
  if (energy >= coinsPerTap) {
    coins += coinsPerTap;
    energy -= coinsPerTap;
    updateCoins();
    updateEnergy();
  }
}

// Upgrades
function renderUpgrades() {
  const upgradesEl = document.getElementById("upgrades");
  upgradesEl.innerHTML = "";
  upgrades.forEach(upg => {
    const div = document.createElement("div");
    div.className = "upgrade";
    if (coins < upg.cost) div.classList.add("disabled");
    div.innerHTML = `
      <div><strong>${upg.name}</strong> (Level ${upg.level})</div>
      <div>${upg.benefit}</div>
      <div>Cost: ${upg.cost} coins</div>
    `;
    div.onclick = () => buyUpgrade(upg.id);
    upgradesEl.appendChild(div);
  });
}

function buyUpgrade(id) {
  const upg = upgrades.find(u => u.id === id);
  if (!upg || coins < upg.cost) return;
  coins -= upg.cost;
  if (upg.type === "tap") coinsPerTap += 1;
  if (upg.type === "energy") { maxEnergy += 500; energy += 500; }
  upg
