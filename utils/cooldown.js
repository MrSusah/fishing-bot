const mongoose = require("mongoose");

const cooldownSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  type: { type: String, required: true },
  lastClaim: { type: Number, default: 0 }
});

const Cooldown = mongoose.models.Cooldown || mongoose.model("Cooldown", cooldownSchema);

const COOLDOWN_TIMES = {
  hourly: 60 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
  yearly: 365 * 24 * 60 * 60 * 1000,
  hunt: 60 * 60 * 1000,
  dungeon: 2 * 60 * 60 * 1000,
  cf: 5 * 1000,
  rps: 5 * 1000,
  slots: 5 * 1000,
  roulette: 5 * 1000,
  dadu: 5 * 1000,
  bomb: 5 * 1000
};

const COOLDOWN_REWARDS = {
  hourly: { min: 10, max: 50 },
  daily: { min: 50, max: 100 },
  weekly: { min: 200, max: 500 },
  monthly: { min: 1000, max: 2000 },
  yearly: { min: 3000, max: 5000 }
};

async function checkCooldown(userId, type) {
  const cooldown = await Cooldown.findOne({ userId, type });
  const now = Date.now();
  const lastClaim = cooldown?.lastClaim || 0;
  const timeLeft = COOLDOWN_TIMES[type] - (now - lastClaim);
  
  if (timeLeft > 0) {
    return { available: false, timeLeft };
  }
  return { available: true, timeLeft: 0 };
}

async function updateCooldown(userId, type) {
  await Cooldown.findOneAndUpdate(
    { userId, type },
    { lastClaim: Date.now() },
    { upsert: true }
  );
}

async function getReward(type) {
  const reward = COOLDOWN_REWARDS[type];
  if (!reward) return 0;
  const amount = Math.floor(Math.random() * (reward.max - reward.min + 1)) + reward.min;
  return amount;
}

async function formatCooldown(ms) {
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((ms % (60 * 1000)) / 1000);
  
  if (hours > 0) return `${hours} jam ${minutes} menit`;
  if (minutes > 0) return `${minutes} menit ${seconds} detik`;
  return `${seconds} detik`;
}

module.exports = {
  checkCooldown,
  updateCooldown,
  getReward,
  formatCooldown,
  COOLDOWN_TIMES,
  COOLDOWN_REWARDS
};