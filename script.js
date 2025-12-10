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

const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || "0";
const referralLink = `https://t.me/YourBot?start=ref_${userId}`;
referralLinkEl.textContent = referralLink;

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
    window.Telegram.WebApp.openTelegramLink("https://t.me/your_channel_here");
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
