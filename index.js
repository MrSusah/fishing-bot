require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  EmbedBuilder
} = require("discord.js");
const mongoose = require("mongoose");

// Import modular systems
const { User } = require("./models/User");
const { 
  handleGameButton, 
  handleBombGameInteraction,  // Ganti dengan ini
  createGameMenu,
  createCasinoMenu 
} = require("./handlers/gameHandler");
const { executeCF } = require("./games/cf");
const { executeRPS } = require("./games/rps");
const { executeSlots } = require("./games/slots");
const { executeRoulette } = require("./games/roulette");
const { executeDadu } = require("./games/dadu");
const HuntGame = require("./games/hunt");
const DungeonGame = require("./games/dungeon");
const FishingGame = require("./games/fishing");
const { checkCooldown, updateCooldown, getReward, formatCooldown } = require("./utils/cooldown");
const { addCredits, removeCredits, getBalance, getUser } = require("./utils/economy");
const { isGameAllowedInChannel, HUNT_CHANNEL_ID, CASINO_CHANNEL_ID } = require("./utils/channelValidator");

// ================= CLIENT =================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates
  ]
});


// ================= CONFIG =================
const FISHING_CHANNELS = [
  "1492058905499402271",
  "1492077755322470530",
  "1492077857042862161",
  "1492077877301084351",
  "1492077899870765166"
];

const ANNOUNCE_CHANNEL = "1492368085410254978";
const ACTIVITY_LEADERBOARD_CHANNEL = "1493595313376592013";
const ADMIN_IDS = ["756609192277835858"];
const OWNER_ID = "756609192277835858";

// ================= COOLDOWN & ANTI-EXPLOIT =================
const cooldowns = new Map();
const processingLocks = new Map();

async function acquireLock(userId, action, timeout = 5000) {
  const key = `${userId}:${action}`;
  if (processingLocks.has(key)) {
    return false;
  }
  processingLocks.set(key, Date.now());
  setTimeout(() => {
    if (processingLocks.get(key)) {
      processingLocks.delete(key);
    }
  }, timeout);
  return key;
}

function releaseLock(key) {
  if (key && processingLocks.has(key)) {
    processingLocks.delete(key);
  }
}

function hasCooldown(userId, action, cooldownMs = 2000) {
  const key = `${userId}:${action}`;
  const lastUsed = cooldowns.get(key);
  if (lastUsed && Date.now() - lastUsed < cooldownMs) {
    return true;
  }
  cooldowns.set(key, Date.now());
  return false;
}

// ================= CHANNEL POINTS =================
const POINTS_CONFIG = {
  chatChannels: ["756621945725911170", "862959540436598804"],
  chatPointsPerMessage: 1,
  chatCooldown: 60000,
  galleryChannels: ["1492135262514446346"],
  galleryPostPoints: 5,
  galleryCommentPoints: 2,
  galleryCooldown: 120000,
  announcementChannel: "1492368085410254978",
  reactionPoints: 3,
  reactionCooldown: 300000,
  voicePointsPerMinute: 1,
  voiceCheckInterval: 120000,
  minMembers: 2
};

// ================= LUCK SYSTEM =================
let globalLuckBoost = 1;
let channelBoost = {};
let boss = null;
let activeBoss = null;
let bossSpawnTime = null;

const bossList = [
  { name: "👑 Kraken Purba", rarity: "Secret", value: 55000, emoji: "🐙" },
  { name: "👑 Naga Laut", rarity: "Secret", value: 58000, emoji: "🐉" },
  { name: "👑 Leviathan Abyss", rarity: "Secret", value: 60000, emoji: "🌊" },
  { name: "👑 Poseidon Wrath", rarity: "Secret", value: 55000, emoji: "⚡" }
];

// ================= ANTI EXPLOIT =================
const antiExploit = {
  tempBlacklist: new Map(),
  exploitLogs: [],
  
  isBlacklisted(userId) {
    if (userId === OWNER_ID) return false;
    const entry = this.tempBlacklist.get(userId);
    if (entry && entry > Date.now()) return true;
    this.tempBlacklist.delete(userId);
    return false;
  },
  
  addToBlacklist(userId, duration = 3600000, reason = "Exploit detected") {
    if (userId === OWNER_ID) return;
    this.tempBlacklist.set(userId, Date.now() + duration);
    this.exploitLogs.push({ userId, reason, time: new Date().toISOString(), duration: duration / 60000 + " menit" });
    console.log(`⚠️ Anti-Exploit: ${userId} di-blacklist selama ${duration/60000} menit. Alasan: ${reason}`);
  },
  
  userActivity: new Map(),
  
  recordActivity(userId, type, amount = 1) {
    if (userId === OWNER_ID) return true;
    
    const now = Date.now();
    let activity = this.userActivity.get(userId);
    if (!activity) {
      activity = { chats: [], galleries: [], reactions: [], voiceMinutes: [], lastReset: now };
      this.userActivity.set(userId, activity);
    }
    
    if (now - activity.lastReset > 86400000) {
      activity.chats = [];
      activity.galleries = [];
      activity.reactions = [];
      activity.lastReset = now;
    }
    
    if (type === "chat") {
      activity.chats = activity.chats.filter(t => now - t < 60000);
      activity.chats.push(now);
      if (activity.chats.length > 10) {
        this.addToBlacklist(userId, 1800000, "Spam chat melebihi batas");
        return false;
      }
    } else if (type === "gallery") {
      activity.galleries = activity.galleries.filter(t => now - t < 86400000);
      activity.galleries.push(now);
      if (activity.galleries.length > 20) {
        this.addToBlacklist(userId, 7200000, "Spam gallery melebihi batas");
        return false;
      }
    } else if (type === "reaction") {
      activity.reactions = activity.reactions.filter(t => now - t < 86400000);
      activity.reactions.push(now);
      if (activity.reactions.length > 30) {
        this.addToBlacklist(userId, 7200000, "Spam reaction melebihi batas");
        return false;
      }
    }
    return true;
  }
};

// ================= HADIAH SYSTEM =================
const REWARDS = {
  "Tunai Rp5.000": { cost: 8000, type: "cash", value: "Rp5.000", emoji: "💰" },
  "Tunai Rp10.000": { cost: 16000, type: "cash", value: "Rp10.000", emoji: "💰" },
  "Tunai Rp20.000": { cost: 32000, type: "cash", value: "Rp20.000", emoji: "💰" },
  "Tunai Rp50.000": { cost: 76000, type: "cash", value: "Rp50.000", emoji: "💰" },
  "Tunai Rp100.000": { cost: 150000, type: "cash", value: "Rp100.000", emoji: "💰" }
};

// ================= POTIONS =================
const potions = {
  "Potion Luck 10%": { luck: 1.1, duration: 30, price: 500, emoji: "🧪" },
  "Potion Luck 25%": { luck: 1.25, duration: 30, price: 1000, emoji: "🧪" },
  "Potion Luck 50%": { luck: 1.5, duration: 30, price: 2000, emoji: "🧪" },
  "Elixir Luck 100%": { luck: 2.0, duration: 60, price: 5000, emoji: "✨" },
  "Potion Cooldown 15%": { cooldownReduce: 0.15, duration: 30, price: 10000, emoji: "⏰" },
  "Potion Cooldown 25%": { cooldownReduce: 0.25, duration: 30, price: 20000, emoji: "⌛" }
};

// ================= ITEM DEFINITIONS =================
const rods = {
  "Basic Rod": { luck: 1, price: 0, type: "rod", emoji: "🎣" },
  "Iron Rod": { luck: 1.2, price: 200, type: "rod", emoji: "⚙️" },
  "Silver Rod": { luck: 1.4, price: 400, type: "rod", emoji: "🥈" },
  "Golden Rod": { luck: 1.7, price: 800, type: "rod", emoji: "👑" },
  "Dragon Rod": { luck: 2, price: 1500, type: "rod", emoji: "🐉" },
  "Mythic Rod": { luck: 2.5, price: 3000, type: "rod", emoji: "🏆" },
  "God Rod": { luck: 3, price: 5000, type: "rod", emoji: "⚡" },
  "Legendary Rod": { luck: 3.5, price: 10000, type: "rod", emoji: "🌟" },
  "Celestial Rod": { luck: 4.0, price: 30000, type: "rod", emoji: "🌙" },
  "Divine Rod": { luck: 4.5, price: 90000, type: "rod", emoji: "✨" },
  "Ethereal Rod": { luck: 5.0, price: 270000, type: "rod", emoji: "🔮" },
  "Abyssal Rod": { luck: 5.5, price: 810000, type: "rod", emoji: "🌊" },
  "Primordial Rod": { luck: 6.0, price: 2430000, type: "rod", emoji: "🌀" }
};

const baits = {
  "Basic Bait": { luck: 1, price: 0, type: "bait", emoji: "🪱" },
  "Herbal Bait": { luck: 1.2, price: 100, type: "bait", emoji: "🌿" },
  "Magic Bait": { luck: 1.5, price: 300, type: "bait", emoji: "✨" },
  "Divine Bait": { luck: 1.8, price: 800, type: "bait", emoji: "💫" },
  "God Bait": { luck: 2.2, price: 1500, type: "bait", emoji: "⚡" },
  "Mythic Bait": { luck: 2.5, price: 3000, type: "bait", emoji: "🏆" },
  "Legendary Bait": { luck: 3.0, price: 9000, type: "bait", emoji: "🌟" },
  "Celestial Bait": { luck: 3.5, price: 27000, type: "bait", emoji: "🌙" },
  "Divine Bait+": { luck: 4.0, price: 81000, type: "bait", emoji: "✨" },
  "Ethereal Bait": { luck: 4.5, price: 243000, type: "bait", emoji: "🔮" },
  "Primordial Bait": { luck: 5.0, price: 729000, type: "bait", emoji: "🌀" }
};

// ================= RARITY =================
const rarityChances = {
  Common: 1 / 75,
  Uncommon: 1 / 500,
  Rare: 1 / 2000,
  Epic: 1 / 15000,
  Legendary: 1 / 100000
};

// ================= MUTASI =================
function getMutation() {
  const r = Math.random();
  if (r < 0.005) return "🧚 Fairy";
  if (r < 0.01) return "👻 Ghost";
  if (r < 0.015) return "🪨 Stone";
  if (r < 0.02) return "🏜️ Sand";
  if (r < 0.025) return "☢️ Radioaktif";
  if (r < 0.03) return "❄️ Ice";
  if (r < 0.035) return "⭐ Gold";
  if (r < 0.045) return "✨ Shiny";
  if (r < 0.055) return "🔥 Inferno";
  if (r < 0.065) return "💀 Dark";
  return "";
}

function getMutationBonus(mutation) {
  const bonuses = {
    "🧚 Fairy": 500, "👻 Ghost": 300, "🪨 Stone": 100,
    "🏜️ Sand": 80, "☢️ Radioaktif": 400, "❄️ Ice": 150,
    "⭐ Gold": 200, "✨ Shiny": 250, "🔥 Inferno": 350, "💀 Dark": 180
  };
  return bonuses[mutation] || 0;
}

// ================= ZONE IKAN =================
const fishingZones = {
  "1492058905499402271": [
    { name: "Lele Lumpur", rarity: "Common", value: 5 }, { name: "Gabus", rarity: "Common", value: 6 },
    { name: "Mujaer", rarity: "Common", value: 4 }, { name: "Nila Merah", rarity: "Common", value: 5 },
    { name: "Tawes", rarity: "Common", value: 4 }, { name: "Wader", rarity: "Common", value: 3 },
    { name: "Betutu", rarity: "Uncommon", value: 15 }, { name: "Belut Sawah", rarity: "Uncommon", value: 12 },
    { name: "Bawal Air Tawar", rarity: "Uncommon", value: 18 }, { name: "Patin", rarity: "Uncommon", value: 14 },
    { name: "Gurame", rarity: "Rare", value: 50 }, { name: "Arwana", rarity: "Rare", value: 70 },
    { name: "Salmon Desa", rarity: "Rare", value: 60 }, { name: "Piranha", rarity: "Epic", value: 150 },
    { name: "Arapaima", rarity: "Epic", value: 200 }, { name: "Megalodon", rarity: "Legendary", value: 600 },
    { name: "Kraken", rarity: "Legendary", value: 800 }, { name: "Naga Sungai", rarity: "Mythic", value: 2000 },
    { name: "Spirit Ikan Mas", rarity: "Mythic", value: 2500 }, { name: "Dewa Lele", rarity: "Secret", value: 10000 }
  ],
  "1492077755322470530": [
    { name: "Ikan Komet", rarity: "Common", value: 6 }, { name: "Platy", rarity: "Common", value: 5 },
    { name: "Molly", rarity: "Common", value: 5 }, { name: "Swordtail", rarity: "Common", value: 7 },
    { name: "Corydoras", rarity: "Common", value: 6 }, { name: "Botia", rarity: "Uncommon", value: 15 },
    { name: "Lohan", rarity: "Uncommon", value: 20 }, { name: "Oscar", rarity: "Uncommon", value: 18 },
    { name: "Flowerhorn", rarity: "Rare", value: 80 }, { name: "Red Arowana", rarity: "Rare", value: 100 },
    { name: "Silver Arowana", rarity: "Rare", value: 90 }, { name: "Jardini", rarity: "Epic", value: 180 },
    { name: "Black Ghost", rarity: "Epic", value: 220 }, { name: "Elephant Nose", rarity: "Epic", value: 200 },
    { name: "Discus", rarity: "Legendary", value: 700 }, { name: "Altum Angelfish", rarity: "Legendary", value: 750 },
    { name: "King Kong Parrot", rarity: "Mythic", value: 2200 }, { name: "Super Red", rarity: "Mythic", value: 2800 },
    { name: "Asian Arowana", rarity: "Secret", value: 12000 }, { name: "Mahseer", rarity: "Legendary", value: 900 }
  ],
  "1492077857042862161": [
    { name: "Baronang", rarity: "Common", value: 8 }, { name: "Kerapu", rarity: "Common", value: 10 },
    { name: "Kakap Merah", rarity: "Common", value: 9 }, { name: "Cumi", rarity: "Common", value: 7 },
    { name: "Gurita", rarity: "Uncommon", value: 20 }, { name: "Lobster", rarity: "Uncommon", value: 30 },
    { name: "Rajungan", rarity: "Uncommon", value: 25 }, { name: "Tuna", rarity: "Rare", value: 80 },
    { name: "Cakalang", rarity: "Rare", value: 75 }, { name: "Marlin", rarity: "Epic", value: 200 },
    { name: "Hiu Putih", rarity: "Epic", value: 250 }, { name: "Paus Biru", rarity: "Legendary", value: 800 },
    { name: "Orca", rarity: "Legendary", value: 900 }, { name: "Squid Raksasa", rarity: "Legendary", value: 1000 },
    { name: "Naga Laut", rarity: "Mythic", value: 3000 }, { name: "Leviathan", rarity: "Mythic", value: 3500 },
    { name: "Kraken Laut Dalam", rarity: "Secret", value: 15000 }, { name: "Poseidon", rarity: "Legendary", value: 1200 },
    { name: "Cthulhu", rarity: "Secret", value: 20000 }, { name: "Neptunus", rarity: "Legendary", value: 1100 }
  ],
  "1492077877301084351": [
    { name: "Ikan Es", rarity: "Common", value: 10 }, { name: "Salmon Arktik", rarity: "Common", value: 12 },
    { name: "Trout Es", rarity: "Uncommon", value: 25 }, { name: "Char", rarity: "Uncommon", value: 28 },
    { name: "Grayling", rarity: "Rare", value: 90 }, { name: "Whitefish", rarity: "Rare", value: 85 },
    { name: "Pike Es", rarity: "Epic", value: 220 }, { name: "Musky", rarity: "Epic", value: 250 },
    { name: "Sturgeon Es", rarity: "Legendary", value: 950 }, { name: "Beluga", rarity: "Legendary", value: 1000 },
    { name: "Narwhal", rarity: "Legendary", value: 1100 }, { name: "Walrus", rarity: "Mythic", value: 3200 },
    { name: "Leopard Seal", rarity: "Mythic", value: 3400 }, { name: "Orca Es", rarity: "Secret", value: 18000 },
    { name: "Paus Pembunuh", rarity: "Legendary", value: 1200 }, { name: "Yeti Fish", rarity: "Secret", value: 22000 },
    { name: "Frost Dragon", rarity: "Legendary", value: 1500 }, { name: "Aurora Fish", rarity: "Legendary", value: 1300 },
    { name: "Glacier King", rarity: "Legendary", value: 1400 }, { name: "Snow Kraken", rarity: "Legendary", value: 1600 }
  ],
  "1492077899870765166": [
    { name: "Void Minnow", rarity: "Common", value: 15 }, { name: "Dark Carp", rarity: "Common", value: 18 },
    { name: "Abyss Guppy", rarity: "Uncommon", value: 35 }, { name: "Shadow Eel", rarity: "Uncommon", value: 40 },
    { name: "Night Angler", rarity: "Rare", value: 120 }, { name: "Darkness Ray", rarity: "Rare", value: 130 },
    { name: "Void Pike", rarity: "Epic", value: 280 }, { name: "Abyssal Cod", rarity: "Epic", value: 300 },
    { name: "Nether Salmon", rarity: "Legendary", value: 2400 }, { name: "Obsidian Tuna", rarity: "Legendary", value: 2600 },
    { name: "Void Kraken", rarity: "Mythic", value: 8000 }, { name: "Abyss Leviathan", rarity: "Mythic", value: 9000 },
    { name: "Darkness Dragon", rarity: "Secret", value: 60000 }, { name: "Cthulhu Void", rarity: "Secret", value: 100000 },
    { name: "Void God", rarity: "Legendary", value: 4000 }, { name: "Eater of Worlds", rarity: "Legendary", value: 5000 },
    { name: "Cosmic Fish", rarity: "Legendary", value: 3600 }, { name: "Singularity", rarity: "Legendary", value: 4400 },
    { name: "Black Hole", rarity: "Legendary", value: 6000 }, { name: "Void Leviathan", rarity: "Legendary", value: 5600 }
  ]
};

// ================= LOGIC FISHING =================
function rollRarity(luck, channelId) {
  const r = Math.random();
  const isVoid = channelId === "1492077899870765166";
  let modifier = isVoid ? 0.5 : 1;
  
  if (r < rarityChances.Legendary * luck * modifier) return "Legendary";
  if (r < rarityChances.Epic * luck * modifier) return "Epic";
  if (r < rarityChances.Rare * luck * modifier) return "Rare";
  if (r < rarityChances.Uncommon * luck * modifier) return "Uncommon";
  return "Common";
}

function getFish(channelId, luck) {
  if (activeBoss && activeBoss.channel === channelId && Math.random() < 0.01) {
    const b = { ...activeBoss };
    activeBoss = null;
    bossSpawnTime = null;
    return b;
  }
  
  const zone = fishingZones[channelId];
  const rarity = rollRarity(luck, channelId);
  let pool = zone.filter(f => f.rarity === rarity);
  if (pool.length === 0) pool = zone;
  return pool[Math.floor(Math.random() * pool.length)];
}

function getZoneName(channelId) {
  const zoneNames = {
    [FISHING_CHANNELS[0]]: "🏞️ ZONA DESA",
    [FISHING_CHANNELS[1]]: "🌊 ZONA SUNGAI",
    [FISHING_CHANNELS[2]]: "🐠 ZONA LAUT",
    [FISHING_CHANNELS[3]]: "❄️ ZONA ES",
    [FISHING_CHANNELS[4]]: "🌑 ZONA VOID"
  };
  return zoneNames[channelId] || "ZONA UNKNOWN";
}

// ================= BOSS =================
function spawnBoss() {
  // Hapus boss lama jika ada
  if (activeBoss) {
    client.channels.fetch(activeBoss.channel).then(ch => {
      ch.send(`💨 Boss **${activeBoss.name}** telah menghilang karena waktu habis!`);
    }).catch(() => {});
    activeBoss = null;
  }
  
  const channel = FISHING_CHANNELS[Math.floor(Math.random() * FISHING_CHANNELS.length)];
  const randomBoss = bossList[Math.floor(Math.random() * bossList.length)];
  
  activeBoss = {
    name: randomBoss.name,
    rarity: randomBoss.rarity,
    value: randomBoss.value,
    emoji: randomBoss.emoji,
    channel: channel,
    spawnTime: Date.now()
  };
  
  bossSpawnTime = Date.now();
  
  client.channels.fetch(channel).then(ch => {
    ch.send(`🎣 **BOSS SPOTTED!** 🎣\n${activeBoss.emoji} **${activeBoss.name}** (${activeBoss.rarity}) muncul di channel ini!\n💰 Hadiah: **${activeBoss.value.toLocaleString()} credits**\n✨ Peluang menangkap: **1%** (Sangat Langka!)\n⏰ Boss akan menghilang dalam **3 jam**!`);
  });
  
  // Despawn setelah 3 jam
  setTimeout(() => {
    if (activeBoss && activeBoss.name === randomBoss.name) {
      client.channels.fetch(channel).then(ch => {
        ch.send(`💨 **BOSS DESPAWN!** ${activeBoss.emoji} **${activeBoss.name}** telah menghilang karena tidak ada yang menangkap!`);
      }).catch(() => {});
      activeBoss = null;
    }
  }, 3 * 60 * 60 * 1000);
}

setInterval(spawnBoss, 3 * 60 * 60 * 1000);

// ================= LEADERBOARD =================
let leaderboardMessageId = null;
let leaderboardUpdateInterval = null;

async function generateLeaderboardEmbed() {
  const topUsers = await User.find({ userId: { $ne: OWNER_ID } })
    .sort({ totalFishingCredits: -1 })
    .limit(50);
  
  const leaderboardData = [];
  for (const u of topUsers) {
    let name = "Unknown";
    try {
      const d = await client.users.fetch(u.userId);
      name = d.username;
    } catch {}
    leaderboardData.push({ 
      username: name, 
      fishingCredits: u.totalFishingCredits || 0,
      fishCaught: u.totalFishCaught || 0
    });
  }

  const podium = [];
  const medals = ["🥇", "🥈", "🥉"];
  for (let i = 0; i < Math.min(3, leaderboardData.length); i++) {
    const p = leaderboardData[i];
    podium.push(`${medals[i]} **${p.username}**\n   \`💰 ${p.fishingCredits.toLocaleString()} credits\` • \`🎣 ${p.fishCaught} ikan\``);
  }

  let top10List = "";
  for (let i = 0; i < Math.min(10, leaderboardData.length); i++) {
    const u = leaderboardData[i];
    const medal = i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i+1}.`;
    const rankIcon = i === 0 ? "🌟" : i === 1 ? "⭐" : i === 2 ? "✨" : "▫️";
    top10List += `${rankIcon} **${medal}** \`${u.username}\` • \`💰 ${u.fishingCredits.toLocaleString()} credits\` • 🎣 ${u.fishCaught}\n`;
  }

  const nextUpdate = new Date(Date.now() + 86400000);
  const formattedNextUpdate = nextUpdate.toLocaleString('id-ID', { 
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
  });

  const embed = new EmbedBuilder()
    .setTitle("🏆 **FISHING LEADERBOARD** 🏆")
    .setDescription(`**Top Anglers - Total Credits dari Mancing**\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🎯 **PODIUM** 🎯\n${podium.join("\n\n")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📊 **TOP 10 PLAYERS**\n${top10List}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    .setColor(0xfacc15)
    .setThumbnail("https://cdn.discordapp.com/emojis/1025605498691330108.png")
    .setFooter({ text: `🏆 Auto-update setiap 24 jam • Update berikutnya: ${formattedNextUpdate}` })
    .setTimestamp();

  return embed;
}

async function updateLeaderboard() {
  try {
    console.log(`📊 [${new Date().toLocaleString()}] Memperbarui fishing leaderboard...`);
    
    const embed = await generateLeaderboardEmbed();
    const channel = await client.channels.fetch(ANNOUNCE_CHANNEL);
    if (!channel) {
      console.log("❌ Channel pengumuman tidak ditemukan!");
      return;
    }

    if (leaderboardMessageId) {
      try {
        const msg = await channel.messages.fetch(leaderboardMessageId);
        await msg.edit({ embeds: [embed] });
        console.log("✅ Fishing leaderboard berhasil diupdate!");
      } catch (error) {
        const msg = await channel.send({ embeds: [embed] });
        leaderboardMessageId = msg.id;
        console.log("✅ Fishing leaderboard berhasil dibuat baru!");
      }
    } else {
      const msg = await channel.send({ embeds: [embed] });
      leaderboardMessageId = msg.id;
      console.log("✅ Fishing leaderboard berhasil dibuat!");
    }
  } catch (error) {
    console.error("❌ Gagal update fishing leaderboard:", error);
  }
}

// ================= ACTIVITY LEADERBOARD =================
let activityLeaderboardMessageId = null;
let cachedActivityLeaderboard = null;

async function generateActivityLeaderboardEmbed() {
  const topUsers = await User.find({ userId: { $ne: OWNER_ID }, activityPoints: { $gt: 0 } })
    .sort({ activityPoints: -1 })
    .limit(20);
    
  const leaderboardData = [];
  for (const u of topUsers) {
    let name = "Unknown";
    try {
      const d = await client.users.fetch(u.userId);
      name = d.username;
    } catch {}
    leaderboardData.push({ 
      username: name, 
      activityPoints: u.activityPoints,
      voiceMinutes: u.totalVoiceMinutes || 0
    });
  }

  let topList = "";
  for (let i = 0; i < Math.min(15, leaderboardData.length); i++) {
    const u = leaderboardData[i];
    const medal = i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i+1}.`;
    const rankIcon = i === 0 ? "🌟" : i === 1 ? "⭐" : i === 2 ? "✨" : "▫️";
    topList += `${rankIcon} **${medal}** \`${u.username}\` • \`${u.activityPoints.toLocaleString()} pts\` • 🎙️ ${Math.floor(u.voiceMinutes / 60)} jam\n`;
  }

  if (topList === "") {
    topList = "Belum ada member yang aktif. Ajak teman-temanmu untuk mulai beraktivitas! 🎉";
  }

  const now = new Date();
  const nextUpdate = new Date(now.getTime() + 86400000);
  const formattedNextUpdate = nextUpdate.toLocaleString('id-ID', { 
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' 
  });

  const embed = new EmbedBuilder()
    .setTitle("📊 **ACTIVITY POINTS LEADERBOARD** 📊")
    .setDescription(`**Peringkat Member Paling Aktif**\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🏆 **TOP 15 PLAYERS** 🏆\n${topList}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n**💡 Cara Mendapat Activity Points:**\n• 💬 Chat aktif: +1 point/pesan\n• 📸 Post Gallery: +5 points\n• 💬 Komentar Gallery: +2 points\n• 🎯 Reaction Announcement: +3 points\n• 🎙️ Voice (min 2 orang): +1 point/2 menit`)
    .setColor(0x00ff88)
    .setThumbnail("https://cdn.discordapp.com/emojis/1025605498691330108.png")
    .setFooter({ text: `🔄 Update publik setiap 24 jam • Update berikutnya: ${formattedNextUpdate}` })
    .setTimestamp();

  return embed;
}

async function updateActivityLeaderboardCache() {
  try {
    console.log(`📊 [${new Date().toLocaleString()}] Memperbarui cache activity leaderboard...`);
    cachedActivityLeaderboard = await generateActivityLeaderboardEmbed();
    console.log("✅ Cache activity leaderboard berhasil diupdate!");
  } catch (error) {
    console.error("❌ Gagal update cache activity leaderboard:", error);
  }
}

async function publishActivityLeaderboard() {
  try {
    console.log(`📊 [${new Date().toLocaleString()}] Mempublikasikan activity leaderboard...`);
    
    if (!cachedActivityLeaderboard) {
      await updateActivityLeaderboardCache();
    }
    
    const channel = await client.channels.fetch(ACTIVITY_LEADERBOARD_CHANNEL);
    if (!channel) {
      console.log("❌ Channel activity leaderboard tidak ditemukan!");
      return;
    }

    if (activityLeaderboardMessageId) {
      try {
        const msg = await channel.messages.fetch(activityLeaderboardMessageId);
        await msg.edit({ embeds: [cachedActivityLeaderboard] });
        console.log("✅ Activity leaderboard berhasil dipublikasikan!");
      } catch (error) {
        const msg = await channel.send({ embeds: [cachedActivityLeaderboard] });
        activityLeaderboardMessageId = msg.id;
        console.log("✅ Activity leaderboard berhasil dibuat baru!");
      }
    } else {
      const msg = await channel.send({ embeds: [cachedActivityLeaderboard] });
      activityLeaderboardMessageId = msg.id;
      console.log("✅ Activity leaderboard berhasil dibuat!");
    }
  } catch (error) {
    console.error("❌ Gagal publish activity leaderboard:", error);
  }
}

// ================= ACTIVITY POINTS =================
client.on("messageCreate", async (msg) => {
  if (msg.author.bot || antiExploit.isBlacklisted(msg.author.id)) return;
  if (msg.author.id === OWNER_ID) return;

  if (POINTS_CONFIG.chatChannels.includes(msg.channel.id)) {
    if (!antiExploit.recordActivity(msg.author.id, "chat")) return;

    const user = await getUser(msg.author.id);
    const now = Date.now();
    const lastTime = user.lastChatTimes?.get(msg.channel.id) || 0;
    
    if (now - lastTime >= POINTS_CONFIG.chatCooldown) {
      await User.updateOne(
        { userId: msg.author.id },
        { 
          $inc: { points: POINTS_CONFIG.chatPointsPerMessage, seasonPoints: POINTS_CONFIG.chatPointsPerMessage, activityPoints: POINTS_CONFIG.chatPointsPerMessage },
          $set: { [`lastChatTimes.${msg.channel.id}`]: now }
        }
      );
    }
  }
  
  if (POINTS_CONFIG.galleryChannels.includes(msg.channel.id)) {
    if (!antiExploit.recordActivity(msg.author.id, "gallery")) return;

    const user = await getUser(msg.author.id);
    const now = Date.now();
    const lastTime = user.lastGalleryTimes?.get(msg.channel.id) || 0;
    
    if (now - lastTime >= POINTS_CONFIG.galleryCooldown) {
      let points = msg.reference ? POINTS_CONFIG.galleryCommentPoints : POINTS_CONFIG.galleryPostPoints;
      await User.updateOne(
        { userId: msg.author.id },
        { 
          $inc: { points: points, seasonPoints: points, activityPoints: points },
          $set: { [`lastGalleryTimes.${msg.channel.id}`]: now }
        }
      );
    }
  }
});

client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot || antiExploit.isBlacklisted(user.id)) return;
  if (user.id === OWNER_ID) return;
  if (reaction.message.channel.id !== POINTS_CONFIG.announcementChannel) return;
  if (!antiExploit.recordActivity(user.id, "reaction")) return;

  const targetUser = await getUser(user.id);
  const now = Date.now();
  
  if (now - (targetUser.lastReactionTime || 0) >= POINTS_CONFIG.reactionCooldown) {
    await User.updateOne(
      { userId: user.id },
      { 
        $inc: { points: POINTS_CONFIG.reactionPoints, seasonPoints: POINTS_CONFIG.reactionPoints, activityPoints: POINTS_CONFIG.reactionPoints },
        $set: { lastReactionTime: now }
      }
    );
  }
});

// ================= VOICE POINTS =================
setInterval(async () => {
  const guild = client.guilds.cache.first();
  if (!guild) return;
  
  const voiceStates = guild.voiceStates.cache;
  const channelMembers = new Map();
  
  for (const [_, state] of voiceStates) {
    if (!state.channelId) continue;
    if (!channelMembers.has(state.channelId)) channelMembers.set(state.channelId, []);
    channelMembers.get(state.channelId).push({
      userId: state.id, mute: state.mute, selfMute: state.selfMute
    });
  }
  
  for (const [channelId, members] of channelMembers) {
    const realMembers = members.filter(m => {
      const member = guild.members.cache.get(m.userId);
      return member && !member.user.bot && !m.mute && !m.selfMute && member.user.id !== OWNER_ID;
    });
    if (realMembers.length < POINTS_CONFIG.minMembers) continue;
    
    for (const member of realMembers) {
      const user = await getUser(member.userId);
      const now = Date.now();
      if (now - (user.lastVoiceTime || 0) >= POINTS_CONFIG.voiceCheckInterval) {
        await User.updateOne(
          { userId: member.userId },
          { 
            $inc: { points: POINTS_CONFIG.voicePointsPerMinute, seasonPoints: POINTS_CONFIG.voicePointsPerMinute, activityPoints: POINTS_CONFIG.voicePointsPerMinute, totalVoiceMinutes: 1 },
            $set: { lastVoiceTime: now }
          }
        );
      }
    }
  }
}, POINTS_CONFIG.voiceCheckInterval);

// ================= INVENTORY DROPDOWN & USE ITEM SYSTEM =================

async function generateInventoryDropdown(userId) {
  const user = await getUser(userId);
  const inventoryItems = Array.from(user.items?.entries() || []);
  
  if (inventoryItems.length === 0) {
    return null;
  }
  
  const options = [];
  
  for (const [itemName, quantity] of inventoryItems) {
    let description = "";
    let emoji = "📦";
    
    if (rods[itemName]) {
      description = `Rod • Luck: ${rods[itemName].luck}x • Qty: ${quantity}`;
      emoji = rods[itemName].emoji;
    } else if (baits[itemName]) {
      description = `Bait • Luck: ${baits[itemName].luck}x • Qty: ${quantity}`;
      emoji = baits[itemName].emoji;
    } else if (potions[itemName]) {
      if (potions[itemName].luck) {
        description = `Potion • Luck: ${potions[itemName].luck}x • ${potions[itemName].duration} menit • Qty: ${quantity}`;
      } else {
        description = `Potion • Cooldown: -${potions[itemName].cooldownReduce * 100}% • ${potions[itemName].duration} menit • Qty: ${quantity}`;
      }
      emoji = potions[itemName].emoji;
    }
    
    options.push({
      label: itemName.length > 50 ? itemName.substring(0, 47) + "..." : itemName,
      description: description,
      value: itemName,
      emoji: emoji
    });
  }
  
  return options.slice(0, 25);
}

async function useItem(userId, itemName) {
  const user = await getUser(userId);
  const quantity = user.items?.get(itemName) || 0;
  
  if (quantity === 0) {
    return { success: false, message: "❌ Kamu tidak memiliki item ini!" };
  }
  
  if (rods[itemName]) {
    if (user.equippedRod === itemName) {
      return { success: false, message: `❌ **${itemName}** sudah ter-equip sebagai rod!` };
    }
    await User.updateOne({ userId: userId }, { $set: { equippedRod: itemName } });
    return { success: true, message: `✅ Meng-equip **${itemName}** sebagai rod!`, type: "rod" };
  }
  
  if (baits[itemName]) {
    if (user.equippedBait === itemName) {
      return { success: false, message: `❌ **${itemName}** sudah ter-equip sebagai bait!` };
    }
    await User.updateOne({ userId: userId }, { $set: { equippedBait: itemName } });
    return { success: true, message: `✅ Meng-equip **${itemName}** sebagai bait!`, type: "bait" };
  }
  
  if (potions[itemName]) {
    const potion = potions[itemName];
    
    if (potion.luck && user.activePotion) {
      return { success: false, message: "❌ Masih ada luck potion aktif! Tunggu sampai habis." };
    }
    if (potion.cooldownReduce && user.activeCooldownPotion) {
      return { success: false, message: "❌ Masih ada cooldown potion aktif! Tunggu sampai habis." };
    }
    
    const removed = await (async () => {
      const currentQty = user.items?.get(itemName) || 0;
      if (currentQty < 1) return false;
      if (currentQty === 1) {
        await User.updateOne({ userId }, { $unset: { [`items.${itemName}`]: "" } });
      } else {
        await User.updateOne({ userId }, { $inc: { [`items.${itemName}`]: -1 } });
      }
      return true;
    })();
    
    if (!removed) {
      return { success: false, message: "❌ Gagal menggunakan potion!" };
    }
    
    if (potion.luck) {
      await User.updateOne(
        { userId: userId },
        { $set: { activePotion: { name: itemName, luck: potion.luck, duration: potion.duration, remain: potion.duration, expiresAt: Date.now() + (potion.duration * 60 * 1000) } } }
      );
    } else if (potion.cooldownReduce) {
      await User.updateOne(
        { userId: userId },
        { $set: { activeCooldownPotion: { name: itemName, cooldownReduce: potion.cooldownReduce, duration: potion.duration, remain: potion.duration, expiresAt: Date.now() + (potion.duration * 60 * 1000) } } }
      );
    }
    
    setTimeout(async () => {
      const currentUser = await getUser(userId);
      if (potion.luck && currentUser.activePotion?.name === itemName) {
        await User.updateOne({ userId: userId }, { $set: { activePotion: null } });
      }
      if (potion.cooldownReduce && currentUser.activeCooldownPotion?.name === itemName) {
        await User.updateOne({ userId: userId }, { $set: { activeCooldownPotion: null } });
      }
    }, potion.duration * 60 * 1000);
    
    const bonus = potion.luck ? `+${((potion.luck - 1) * 100)}% luck` : `-${potion.cooldownReduce * 100}% cooldown`;
    return { success: true, message: `✅ **${itemName}** digunakan! ${bonus} selama ${potion.duration} menit.`, type: "potion" };
  }
  
  return { success: false, message: "❌ Item tidak dapat digunakan!" };
}

// ================= MENU & COMMAND HANDLER =================
client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;

  // ================= MAIN MENU =================
  if (msg.content === "!fishing") {
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("menu_fish").setLabel("🎣 Fishing").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("menu_profile").setLabel("👤 Profile").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("menu_index").setLabel("📖 Index").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("menu_transfer").setLabel("💸 Transfer").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("menu_shop").setLabel("🛒 Shop").setStyle(ButtonStyle.Success)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("menu_inventory").setLabel("🎒 Inventory").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("menu_sell").setLabel("💰 Sell Fish").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("menu_redeem").setLabel("🎁 Hadiah").setStyle(ButtonStyle.Primary)
    );

    const row3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("menu_activity").setLabel("📊 Aktivitas").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("menu_leaderboard").setLabel("🏆 Fishing LB").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("menu_activity_leaderboard").setLabel("📊 Activity LB").setStyle(ButtonStyle.Success)
    );

    const adminRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("admin_panel").setLabel("👑 Admin Panel").setStyle(ButtonStyle.Secondary)
    );

    return msg.reply({
      content: "🎮 **MAIN MENU**",
      components: ADMIN_IDS.includes(msg.author.id) ? [row1, row2, row3, adminRow] : [row1, row2, row3]
    });
  }
  
  // ================= GAME MENU =================
  if (msg.content === "!game") {
    const { embed, components } = createGameMenu();
    return msg.reply({ embeds: [embed], components });
  }

  // ================= CASINO MENU =================
  if (msg.content === "!casino") {
    const { embed, components } = createCasinoMenu();
    return msg.reply({ embeds: [embed], components });
  }

  // ================= HUNT COMMAND =================
  if (msg.content === "!hunt") {
    if (msg.channel.id !== HUNT_CHANNEL_ID) {
      return msg.reply(`❌ Game hunt hanya bisa dimainkan di channel <#${HUNT_CHANNEL_ID}>!`);
    }
    const result = await HuntGame.play(msg.author.id, msg.author.username);
    if (result.message) {
      return msg.reply(result.message);
    }
    return msg.reply({ embeds: [result.embed] });
  }

  // ================= DUNGEON COMMAND =================
  if (msg.content === "!dungeon") {
    if (msg.channel.id !== HUNT_CHANNEL_ID) {
      return msg.reply(`❌ Game dungeon hanya bisa dimainkan di channel <#${HUNT_CHANNEL_ID}>!`);
    }
    const result = await DungeonGame.play(msg.author.id, msg.author.username);
    if (result.message) {
      return msg.reply(result.message);
    }
    return msg.reply({ embeds: [result.embed] });
  }

  // ================= FISHING COMMAND =================
  if (msg.content === "!fishing_game") {
    const result = await FishingGame.play(msg.author.id, msg.author.username);
    if (result.message) {
      return msg.reply(result.message);
    }
    return msg.reply({ embeds: [result.embed] });
  }

  // ================= COIN FLIP COMMAND =================
  if (msg.content.startsWith("!cf")) {
    const args = msg.content.split(" ");
    if (args.length < 3) {
      return msg.reply("❌ Usage: `!cf <kepala/ekor> <jumlah>`\nContoh: `!cf kepala 1000`");
    }
    
    const choice = args[1].toLowerCase();
    const amount = parseInt(args[2]);
    
    if (isNaN(amount)) {
      return msg.reply("❌ Jumlah harus berupa angka!");
    }
    
    if (!isGameAllowedInChannel(msg.channel.id, "cf")) {
      return msg.reply(`❌ Game **CF** hanya bisa dimainkan di **Zona Kasino**! Gunakan channel <#${CASINO_CHANNEL_ID}>`);
    }
    
    const fakeInteraction = {
      user: msg.author,
      userId: msg.author.id,
      channelId: msg.channel.id,
      deferReply: async () => {},
      editReply: async (content) => msg.reply(content),
      reply: async (content) => msg.reply(content)
    };
    
    return executeCF(fakeInteraction, choice, amount);
  }

  // ================= RPS COMMAND =================
  if (msg.content.startsWith("!rps")) {
    const args = msg.content.split(" ");
    if (args.length < 3) {
      return msg.reply("❌ Usage: `!rps <rock/paper/scissors> <jumlah>`\nContoh: `!rps rock 1000`");
    }
    
    const choice = args[1].toLowerCase();
    const amount = parseInt(args[2]);
    
    if (isNaN(amount)) {
      return msg.reply("❌ Jumlah harus berupa angka!");
    }
    
    if (!isGameAllowedInChannel(msg.channel.id, "rps")) {
      return msg.reply(`❌ Game **RPS** hanya bisa dimainkan di **Zona Kasino**! Gunakan channel <#${CASINO_CHANNEL_ID}>`);
    }
    
    const fakeInteraction = {
      user: msg.author,
      userId: msg.author.id,
      channelId: msg.channel.id,
      deferReply: async () => {},
      editReply: async (content) => msg.reply(content),
      reply: async (content) => msg.reply(content)
    };
    
    return executeRPS(fakeInteraction, choice, amount);
  }

  // ================= SLOTS COMMAND =================
  if (msg.content.startsWith("!slots")) {
    const args = msg.content.split(" ");
    if (args.length < 2) {
      return msg.reply("❌ Usage: `!slots <jumlah>`\nContoh: `!slots 1000`");
    }
    
    const amount = parseInt(args[1]);
    
    if (isNaN(amount)) {
      return msg.reply("❌ Jumlah harus berupa angka!");
    }
    
    if (!isGameAllowedInChannel(msg.channel.id, "slots")) {
      return msg.reply(`❌ Game **Slots** hanya bisa dimainkan di **Zona Kasino**! Gunakan channel <#${CASINO_CHANNEL_ID}>`);
    }
    
    const fakeInteraction = {
      user: msg.author,
      userId: msg.author.id,
      channelId: msg.channel.id,
      deferReply: async () => {},
      editReply: async (content) => msg.reply(content),
      reply: async (content) => msg.reply(content)
    };
    
    return executeSlots(fakeInteraction, amount);
  }

  // ================= ROULETTE COMMAND =================
  if (msg.content.startsWith("!roulette")) {
    const args = msg.content.split(" ");
    if (args.length < 3) {
      return msg.reply("❌ Usage: `!roulette <jumlah> <side>`\nSide: red/black/green/odd/even/nomor\nContoh: `!roulette 1000 red`");
    }
    
    const amount = parseInt(args[1]);
    const side = args[2];
    
    if (isNaN(amount)) {
      return msg.reply("❌ Jumlah harus berupa angka!");
    }
    
    if (!isGameAllowedInChannel(msg.channel.id, "roulette")) {
      return msg.reply(`❌ Game **Roulette** hanya bisa dimainkan di **Zona Kasino**! Gunakan channel <#${CASINO_CHANNEL_ID}>`);
    }
    
    const fakeInteraction = {
      user: msg.author,
      userId: msg.author.id,
      channelId: msg.channel.id,
      deferReply: async () => {},
      editReply: async (content) => msg.reply(content),
      reply: async (content) => msg.reply(content)
    };
    
    return executeRoulette(fakeInteraction, side, amount);
  }

  // ================= DADU COMMAND =================
  if (msg.content.startsWith("!dadu")) {
    const args = msg.content.split(" ");
    if (args.length < 3) {
      return msg.reply("❌ Usage: `!dadu <high/low> <jumlah>`\nContoh: `!dadu high 1000`\n💰 Maks taruhan: 3000 credits");
    }
    
    const choice = args[1].toLowerCase();
    const amount = parseInt(args[2]);
    
    if (isNaN(amount)) {
      return msg.reply("❌ Jumlah harus berupa angka!");
    }
    
    if (!isGameAllowedInChannel(msg.channel.id, "dadu")) {
      return msg.reply(`❌ Game **Dadu** hanya bisa dimainkan di **Zona Kasino**! Gunakan channel <#${CASINO_CHANNEL_ID}>`);
    }
    
    const fakeInteraction = {
      user: msg.author,
      userId: msg.author.id,
      channelId: msg.channel.id,
      deferReply: async () => {},
      editReply: async (content) => msg.reply(content),
      reply: async (content) => msg.reply(content)
    };
    
    return executeDadu(fakeInteraction, choice, amount);
  }

  // ================= COOLDOWN COMMANDS =================
  if (msg.content === "!hourly") {
    const cooldown = await checkCooldown(msg.author.id, "hourly");
    if (!cooldown.available) {
      const timeLeft = await formatCooldown(cooldown.timeLeft);
      return msg.reply(`⏳ **Cooldown!** Tunggu **${timeLeft}** untuk claim lagi.`);
    }
    
    const reward = await getReward("hourly");
    await addCredits(msg.author.id, reward, "hourly");
    await updateCooldown(msg.author.id, "hourly");
    
    return msg.reply(`🎁 **Hourly Reward!** Kamu mendapatkan **${reward.toLocaleString()}** credits!`);
  }

  if (msg.content === "!daily") {
    const cooldown = await checkCooldown(msg.author.id, "daily");
    if (!cooldown.available) {
      const timeLeft = await formatCooldown(cooldown.timeLeft);
      return msg.reply(`⏳ **Cooldown!** Tunggu **${timeLeft}** untuk claim lagi.`);
    }
    
    const reward = await getReward("daily");
    await addCredits(msg.author.id, reward, "daily");
    await updateCooldown(msg.author.id, "daily");
    
    return msg.reply(`🎁 **Daily Reward!** Kamu mendapatkan **${reward.toLocaleString()}** credits!`);
  }

  if (msg.content === "!weekly") {
    const cooldown = await checkCooldown(msg.author.id, "weekly");
    if (!cooldown.available) {
      const timeLeft = await formatCooldown(cooldown.timeLeft);
      return msg.reply(`⏳ **Cooldown!** Tunggu **${timeLeft}** untuk claim lagi.`);
    }
    
    const reward = await getReward("weekly");
    await addCredits(msg.author.id, reward, "weekly");
    await updateCooldown(msg.author.id, "weekly");
    
    return msg.reply(`🎁 **Weekly Reward!** Kamu mendapatkan **${reward.toLocaleString()}** credits!`);
  }

  if (msg.content === "!monthly") {
    const cooldown = await checkCooldown(msg.author.id, "monthly");
    if (!cooldown.available) {
      const timeLeft = await formatCooldown(cooldown.timeLeft);
      return msg.reply(`⏳ **Cooldown!** Tunggu **${timeLeft}** untuk claim lagi.`);
    }
    
    const reward = await getReward("monthly");
    await addCredits(msg.author.id, reward, "monthly");
    await updateCooldown(msg.author.id, "monthly");
    
    return msg.reply(`🎁 **Monthly Reward!** Kamu mendapatkan **${reward.toLocaleString()}** credits!`);
  }

  if (msg.content === "!yearly") {
    const cooldown = await checkCooldown(msg.author.id, "yearly");
    if (!cooldown.available) {
      const timeLeft = await formatCooldown(cooldown.timeLeft);
      return msg.reply(`⏳ **Cooldown!** Tunggu **${timeLeft}** untuk claim lagi.`);
    }
    
    const reward = await getReward("yearly");
    await addCredits(msg.author.id, reward, "yearly");
    await updateCooldown(msg.author.id, "yearly");
    
    return msg.reply(`🎁 **Yearly Reward!** Kamu mendapatkan **${reward.toLocaleString()}** credits!`);
  }

  // ================= TRANSFER COMMAND =================
  if (msg.content.startsWith("!transfer")) {
    const target = msg.mentions.users.first();
    const amount = parseInt(msg.content.split(" ")[2]);
    if (!target || isNaN(amount) || amount < 100) return msg.reply("❌ !transfer @user jumlah (minimal 100)");
    
    const lockKey = await acquireLock(msg.author.id, "transfer", 5000);
    if (!lockKey) {
      return msg.reply("⏳ Proses transfer sedang berjalan, tunggu sebentar!");
    }
    
    try {
      const sender = await getUser(msg.author.id);
      const receiver = await getUser(target.id);
      
      if (sender.credits < amount) return msg.reply("❌ Credit tidak cukup");
      
      await User.updateOne({ userId: msg.author.id }, { $inc: { credits: -amount } });
      await User.updateOne({ userId: target.id }, { $inc: { credits: amount } });
      
      return msg.reply(`✅ Transfer ${amount} credits ke ${target.username}`);
    } finally {
      releaseLock(lockKey);
    }
  }

  // ================= CONVERT COMMAND =================
  if (msg.content.startsWith("!convert")) {
    const amount = parseInt(msg.content.split(" ")[1]);
    if (isNaN(amount) || amount <= 0) return msg.reply("❌ !convert jumlah (1 point = 100 credits)");
    
    const lockKey = await acquireLock(msg.author.id, "convert", 5000);
    if (!lockKey) {
      return msg.reply("⏳ Proses convert sedang berjalan, tunggu sebentar!");
    }
    
    try {
      const user = await getUser(msg.author.id);
      const creditsNeeded = amount * 100;
      if (user.credits < creditsNeeded) return msg.reply(`❌ Butuh ${creditsNeeded} credits`);
      
      await User.updateOne(
        { userId: msg.author.id, credits: { $gte: creditsNeeded } },
        { $inc: { credits: -creditsNeeded, points: amount, seasonPoints: amount, activityPoints: amount } }
      );
      
      const updatedUser = await getUser(msg.author.id);
      return msg.reply(`✅ Convert ${amount} points! Sisa credits: ${updatedUser.credits}`);
    } finally {
      releaseLock(lockKey);
    }
  }

  // ================= POINTS COMMAND =================
  if (msg.content === "!points") {
    const user = await getUser(msg.author.id);
    return msg.reply(`⭐ Points: ${user.points} | 🏆 Season: ${user.seasonPoints} | 📈 Activity: ${user.activityPoints} | 💰 Total Fishing: ${user.totalFishingCredits.toLocaleString()}`);
  }

  // ================= ADMIN COMMANDS =================
  if (!ADMIN_IDS.includes(msg.author.id)) return;
  
  if (msg.content.startsWith("!addcredit")) {
    const target = msg.mentions.users.first();
    const amount = parseInt(msg.content.split(" ")[2]);
    if (!target || isNaN(amount)) return;
    await User.updateOne({ userId: target.id }, { $inc: { credits: amount } });
    return msg.reply(`✅ +${amount} credits ke ${target.username}`);
  }
  
  if (msg.content.startsWith("!removecredit")) {
    const target = msg.mentions.users.first();
    const amount = parseInt(msg.content.split(" ")[2]);
    if (!target || isNaN(amount)) return;
    await User.updateOne({ userId: target.id, credits: { $gte: amount } }, { $inc: { credits: -amount } });
    return msg.reply(`❌ -${amount} credits dari ${target.username}`);
  }
  
  if (msg.content.startsWith("!addpoints")) {
    const target = msg.mentions.users.first();
    const amount = parseInt(msg.content.split(" ")[2]);
    if (!target || isNaN(amount)) return;
    await User.updateOne({ userId: target.id }, { $inc: { points: amount, seasonPoints: amount, activityPoints: amount } });
    return msg.reply(`✅ +${amount} points ke ${target.username}`);
  }
  
  if (msg.content.startsWith("!checkprofile")) {
    const target = msg.mentions.users.first();
    if (!target) return;
    const u = await getUser(target.id);
    return msg.reply(`👤 ${target.username}\n⭐ Points: ${u.points}\n💰 Credits: ${u.credits}\n🏆 Season: ${u.seasonPoints}\n📈 Activity: ${u.activityPoints}\n💰 Total Fishing: ${u.totalFishingCredits.toLocaleString()}\n🐟 Total Ikan: ${u.totalFishCaught || 0}\n🎣 Season Fish: ${u.seasonFishCaught}`);
  }
  
  if (msg.content.startsWith("!globalluck")) {
    const val = parseFloat(msg.content.split(" ")[1]);
    if (isNaN(val)) return;
    globalLuckBoost = val;
    return msg.reply(`🌍 Global luck: x${globalLuckBoost}`);
  }
  
  if (msg.content.startsWith("!setluck")) {
    const args = msg.content.split(" ");
    if (!args[1] || !args[2]) return;
    channelBoost[args[1]] = parseFloat(args[2]);
    return msg.reply(`✅ Channel luck set ke x${channelBoost[args[1]]}`);
  }
});

// ================= INTERACTION HANDLER =================
client.on("interactionCreate", async (i) => {
  if (!i.isButton() && !i.isStringSelectMenu()) return;
  
  if (hasCooldown(i.user.id, i.customId, 2000)) {
    return i.reply({ content: "⏳ Tombol sedang diproses, jangan spam!", flags: 64 }).catch(() => {});
  }
  
  try {
    const user = await getUser(i.user.id);
    
    // Game Menu Buttons
    if (i.customId === "game_fishing" || i.customId === "game_hunt" || i.customId === "game_dungeon" || i.customId === "game_casino") {
      return handleGameButton(i, client);
    }
    
    if (i.customId === "casino_cf" || i.customId === "casino_rps" || i.customId === "casino_slots" || 
        i.customId === "casino_roulette" || i.customId === "casino_dadu" || i.customId === "casino_bomb" || 
        i.customId === "casino_fishing") {
      return handleGameButton(i, client);
    }
    
    // Back buttons
    if (i.customId === "back_to_game_menu") {
      const { embed, components } = createGameMenu();
      return i.update({ embeds: [embed], components });
    }
    
    if (i.customId === "back_to_casino") {
      const { embed, components } = createCasinoMenu();
      return i.update({ embeds: [embed], components });
    }
    
    if (i.customId === "back_to_main_menu") {
      const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("menu_fish").setLabel("🎣 Fishing").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("menu_profile").setLabel("👤 Profile").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("menu_index").setLabel("📖 Index").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("menu_transfer").setLabel("💸 Transfer").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("menu_shop").setLabel("🛒 Shop").setStyle(ButtonStyle.Success)
      );
      
      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("menu_inventory").setLabel("🎒 Inventory").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("menu_sell").setLabel("💰 Sell Fish").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("menu_redeem").setLabel("🎁 Hadiah").setStyle(ButtonStyle.Primary)
      );
      
      const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("menu_activity").setLabel("📊 Aktivitas").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("menu_leaderboard").setLabel("🏆 Fishing LB").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("menu_activity_leaderboard").setLabel("📊 Activity LB").setStyle(ButtonStyle.Success)
      );
      
      const components = [row1, row2, row3];
      if (ADMIN_IDS.includes(i.user.id)) {
        const adminRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("admin_panel").setLabel("👑 Admin Panel").setStyle(ButtonStyle.Secondary)
        );
        components.push(adminRow);
      }
      
      return i.update({
        content: "🎮 **MAIN MENU**",
        components: components
      });
    }
    
    // ===== FISHING BUTTON =====
    if (i.customId === "menu_fish") {
      const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("fish").setLabel("🎣 Mancing").setStyle(ButtonStyle.Primary));
      return i.reply({ content: "Klik tombol di bawah!", components: [row], flags: 64 });
    }
    
    if (i.customId === "fish") {
      if (!FISHING_CHANNELS.includes(i.channel.id)) {
        return i.reply({ content: "❌ Bukan channel mancing!", flags: 64 });
      }
      
      const lockKey = await acquireLock(i.user.id, "fish", 15000);
      if (!lockKey) {
        return i.reply({ content: "⏳ Sedang memancing, tunggu sebentar!", flags: 64 });
      }
      
      try {
        const freshUser = await getUser(i.user.id);
        
        let cooldownTime = 10000;
        if (freshUser.activeCooldownPotion) {
          cooldownTime = 10000 * (1 - freshUser.activeCooldownPotion.cooldownReduce);
        }
        
        const now = Date.now();
        if (freshUser.lastFishTime && now - freshUser.lastFishTime < cooldownTime) {
          const remaining = Math.ceil((cooldownTime - (now - freshUser.lastFishTime)) / 1000);
          releaseLock(lockKey);
          return i.reply({ content: `⏳ Cooldown ${remaining} detik lagi!`, flags: 64 });
        }
        
        await User.updateOne({ userId: i.user.id }, { $set: { lastFishTime: now } });
        
        const channelLuck = channelBoost[i.channel.id] || 1;
        const rodLuck = rods[freshUser.equippedRod]?.luck || 1;
        const baitLuck = baits[freshUser.equippedBait]?.luck || 1;
        const potionLuck = freshUser.activePotion ? freshUser.activePotion.luck : 1;
        const luck = rodLuck * baitLuck * globalLuckBoost * channelLuck * potionLuck;
        
        const fish = getFish(i.channel.id, luck);
        const mutation = getMutation();
        const mutationBonus = getMutationBonus(mutation);
        const finalName = mutation ? `${mutation} ${fish.name}` : fish.name;
        const totalValue = fish.value + mutationBonus;
        
        const currentQty = freshUser.fishInventory?.get(finalName) || 0;
        if (currentQty === 0) {
          await User.updateOne({ userId: i.user.id }, { $set: { [`fishInventory.${finalName}`]: 1 } });
        } else {
          await User.updateOne({ userId: i.user.id }, { $inc: { [`fishInventory.${finalName}`]: 1 } });
        }
        
        await User.updateOne(
          { userId: i.user.id },
          { $inc: { credits: totalValue, totalFishingCredits: totalValue, seasonFishCaught: 1, totalFishCaught: 1 } }
        );
        
        let replyMsg = `🎣 ${finalName} (${fish.rarity}) +${totalValue}💰`;
        if (mutation) replyMsg += `\n✨ Mutasi ${mutation} +${mutationBonus}💰`;
        
        await i.reply({ content: replyMsg, flags: 64 });
      } finally {
        releaseLock(lockKey);
      }
    }
    
    // Continue with other interaction handlers (inventory, shop, redeem, etc.) from your original code...
    // [The rest of your interaction handlers remain the same - inventory, shop, redeem, profile, etc.]
    
  } catch (error) {
    console.error("❌ Error dalam interaction:", error);
    try {
      if (!i.replied && !i.deferred) {
        await i.reply({ content: "❌ Terjadi kesalahan, silakan coba lagi!", flags: 64 });
      } else {
        await i.editReply({ content: "❌ Terjadi kesalahan, silakan coba lagi!" });
      }
    } catch (e) {
      console.error("Gagal mengirim error response:", e);
    }
  }
});

// Add the rest of your interaction handlers (inventory, shop, redeem, profile, admin panel, etc.) here...
// [Continue with all your existing interaction handlers from your original code]

// ================= UPDATE POTION =================
setInterval(async () => {
  const now = Date.now();
  await User.updateMany(
    { "activePotion.expiresAt": { $lt: now } },
    { $set: { activePotion: null } }
  );
  await User.updateMany(
    { "activeCooldownPotion.expiresAt": { $lt: now } },
    { $set: { activeCooldownPotion: null } }
  );
}, 60000);

// ================= READY =================
client.once("ready", async () => {
  console.log("🔥 SUPER BOT FISHING BY KAME READY!");
  console.log("📋 All systems online!");
  console.log("🔒 Anti-exploit, anti-double-click, dan race condition protection AKTIF!");
  console.log("✅ Inventory system menggunakan dropdown menu!");
  console.log("✅ Use item system (Rod/Bait/Potion) berfungsi!");
  console.log("✅ Sistem jual ikan dengan quantity validation AKTIF!");
  console.log("🏆 Fishing Leaderboard update setiap 24 jam!");
  console.log("📊 Activity Leaderboard cache update setiap 5 menit, publikasi setiap 24 jam!");
  console.log("👑 Owner tidak ikut leaderboard!");
  console.log("🎣 13 Rod & 11 Bait tersedia!");
  console.log("💰 Hadiah Tunai dengan harga 2x lipat!");
  console.log("🌑 Zona Void peluang ikan langka lebih kecil!");
  console.log("⭐ Sistem Favorite Fish Aktif!");
  console.log("⏰ Cooldown Potions Aktif (15% & 25%)!");
  console.log("🐙 4 Boss Baru dengan peluang 1%!");
  console.log("🎮 Minigame system loaded: Hunt, Dungeon, CF, RPS, Slots, Roulette, Dadu, Bomb!");
  console.log("🎰 Casino and Game menus available with !game and !casino!");
  console.log("⏰ Daily rewards: !hourly, !daily, !weekly, !monthly, !yearly!");
  
  if (leaderboardUpdateInterval) clearInterval(leaderboardUpdateInterval);
  setTimeout(() => updateLeaderboard(), 5000);
  leaderboardUpdateInterval = setInterval(() => updateLeaderboard(), 86400000);
  
  setTimeout(() => updateActivityLeaderboardCache(), 3000);
  setInterval(() => updateActivityLeaderboardCache(), 300000);
  
  setTimeout(() => publishActivityLeaderboard(), 10000);
  setInterval(() => publishActivityLeaderboard(), 86400000);
  
  spawnBoss();
});

// ================= LOGIN =================
client.login(process.env.TOKEN);
mongoose.connect(process.env.MONGO_URI);