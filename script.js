let coins = 0;
let energy = 1000;
let maxEnergy = 1000;
let coinsPerTap = 1;
let level = 1;

const coinsEl = document.getElementById("coins");
const levelEl = document.getElementById("level");
const tapArea = document.getElementById("tapArea");
const energyText = document.getElementById("energyText");
const energyFill = document.getElementById("energyFill");
const referralLinkEl = document.getElementById("referralLink");
const upgradesEl = document.getElementById("upgrades");
const friendsContainer = document.getElementById("friendsContainer");

const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || "0";
const referralLink = `https://t.me/YourBot?start=ref_${userId}`;
referralLinkEl.textContent = referralLink;

// Upgrades data
let upgrades = [
  { id: 1, name: "Multitap", level: 1, cost: 2000, benefit: "+1 per tap", type: "tap" },
  { id: 2, name: "Energy Limit", level: 1, cost: 2000, benefit: "+500 energy", type: "energy" }
];

// Render upgrades
function renderUpgrades() {
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
  if (upg.type === "tap") {
    coinsPerTap += 1;
  } else if (upg.type === "energy") {
    maxEnergy += 500;
    energy += 500;
  }
  upg.level += 1;
  upg.cost = Math.floor(upg.cost * 2);

  updateCoins();
  updateEnergy();
  renderUpgrades();
}

// Energy regen
setInterval(() => {
  energy = Math.min(energy + 1, maxEnergy);
  updateEnergy();
}, 1000);

function updateEnergy() {
  energyText.textContent = `${energy}/${maxEnergy}`;
  energyFill.style.width = `${(energy / maxEnergy) * 100}%`;
}

function updateCoins() {
  coinsEl.textContent = coins.toLocaleString();
  level = Math.floor(coins / 10000) + 1;
  levelEl.textContent = `Level ${level}`;
  renderUpgrades();
}

tapArea.addEventListener("click", () => {
  if (energy >= coinsPerTap) {
    coins += coinsPerTap;
    energy -= coinsPerTap;
    updateCoins();
    updateEnergy();
  }
});

// Rewards
function claimDailyReward() {
  coins += 5000;
  updateCoins();
}

function joinChannelReward() {
  coins += 10000;
  updateCoins();
  if (window.Telegram?.WebApp?.openTelegramLink) {
    window.Telegram.WebApp.openTelegramLink("https://t.me/TheShebaBot");
  }
}

function subscribChannelReward() {
  coins += 10000;
  updateCoins();
  if (window.Telegram?.WebApp?.openTelegramLink) {
    window.Telegram.WebApp.openTelegramLink("https://https://www.youtube.com/@SabawianProduction");
  }
}

// Referral
function copyReferral() {
  navigator.clipboard.writeText(referralLink);
  alert("Referral link copied!");
}

function shareReferral() {
  const shareUrl =
    "https://t.me/share/url?url=" +
    encodeURIComponent(referralLink) +
    "&text=" +
    encodeURIComponent("Join me in Saba Gift 🎮!");
  if (window.Telegram?.WebApp?.openTelegramLink) {
    window.Telegram.WebApp.openTelegramLink(shareUrl);
  }
}

// Friends list demo (replace with backend data)
function addFriend(name) {
  const div = document.createElement("div");
  div.textContent = name;
  friendsContainer.appendChild(div);
}

// Initial render
renderUpgrades();
updateCoins();
updateEnergy();
