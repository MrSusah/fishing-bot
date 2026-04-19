const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { isGameAllowedInChannel } = require("../utils/channelValidator");
const { executeHunt } = require("../games/hunt");
const { executeDungeon } = require("../games/dungeon");
const { executeFishing } = require("../games/fishing");
const { getUser } = require("../utils/economy");

// ================= RODS & BAITS (untuk profile) =================
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

let globalLuckBoost = 1;
let channelBoost = {};

const buttonCooldowns = new Map();

function hasButtonCooldown(userId, buttonId) {
  const key = `${userId}:${buttonId}`;
  const lastUsed = buttonCooldowns.get(key);
  if (lastUsed && Date.now() - lastUsed < 2000) {
    return true;
  }
  buttonCooldowns.set(key, Date.now());
  return false;
}

async function handleGameMenu(interaction) {
  if (hasButtonCooldown(interaction.user.id, "game_menu")) {
    return interaction.reply({ content: "⏳ Tombol sedang diproses, jangan spam!" });
  }
  
  const embed = new EmbedBuilder()
    .setTitle("🎮 **GAME MENU** 🎮")
    .setDescription("Pilih menu di bawah ini!")
    .setColor(0x5865f2)
    .setTimestamp();
  
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("game_fishing").setLabel("🎣 Fishing").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("game_hunt").setLabel("🏹 Hunt").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("game_dungeon").setLabel("🏰 Dungeon").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("game_casino").setLabel("🎰 Casino").setStyle(ButtonStyle.Secondary)
  );
  
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("game_profile").setLabel("👤 Profile").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("back_to_main_menu").setLabel("🔙 Menu Utama").setStyle(ButtonStyle.Secondary)
  );
  
  return interaction.reply({ embeds: [embed], components: [row1, row2] });
}

async function handleCasinoMenu(interaction) {
  if (hasButtonCooldown(interaction.user.id, "casino_menu")) {
    return interaction.reply({ content: "⏳ Tombol sedang diproses, jangan spam!" });
  }
  
  const embed = new EmbedBuilder()
    .setTitle("🎰 **CASINO MENU** 🎰")
    .setDescription("**Pilih permainan kasino:**\n\n" +
      "🪙 **Coin Flip** - Tebak kepala/ekor (30% win chance)\n" +
      "✊ **RPS** - Rock Paper Scissors vs Bot\n" +
      "🎰 **Slots** - Slot machine dengan berbagai hadiah\n" +
      "🎡 **Roulette** - Taruhan pada angka/warna\n" +
      "🎲 **Dadu** - Tebak High/Low (1-6)\n\n" +
      "🎣 **Fishing** - Mancing ikan di channel khusus")
    .setColor(0xffaa00)
    .setTimestamp();
  
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("casino_cf").setLabel("🪙 CF").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("casino_rps").setLabel("✊ RPS").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("casino_slots").setLabel("🎰 Slots").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("casino_roulette").setLabel("🎡 Roulette").setStyle(ButtonStyle.Secondary)
  );
  
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("casino_dadu").setLabel("🎲 Dadu").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("casino_fishing").setLabel("🎣 Fishing").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("back_to_game_menu").setLabel("🔙 Kembali").setStyle(ButtonStyle.Secondary)
  );
  
  return interaction.reply({ embeds: [embed], components: [row1, row2] });
}

async function showProfile(interaction) {
  await interaction.deferReply({ flags: 64 });
  
  const freshUser = await getUser(interaction.user.id);
  let totalFish = freshUser.totalFishCaught || 0;
  const totalJenis = freshUser.fishInventory?.size || 0;
  
  const rodLuck = rods[freshUser.equippedRod]?.luck || 1;
  const baitLuck = baits[freshUser.equippedBait]?.luck || 1;
  const channelLuck = channelBoost[interaction.channel?.id] || 1;
  const potionLuck = freshUser.activePotion ? freshUser.activePotion.luck : 1;
  const totalLuck = rodLuck * baitLuck * globalLuckBoost * channelLuck * potionLuck;
  
  const formattedRod = rodLuck.toFixed(2);
  const formattedBait = baitLuck.toFixed(2);
  const formattedGlobal = globalLuckBoost.toFixed(2);
  const formattedChannel = channelLuck.toFixed(2);
  const formattedPotion = potionLuck.toFixed(2);
  const formattedTotal = totalLuck.toFixed(2);
  
  const luckPercentage = Math.min(100, (totalLuck / 10) * 100);
  const barLength = Math.floor(luckPercentage / 10);
  const luckBar = "█".repeat(barLength) + "░".repeat(10 - barLength);
  
  let potionStatus = "Tidak aktif";
  if (freshUser.activePotion) {
    potionStatus = `${freshUser.activePotion.name}\n⏰ ${freshUser.activePotion.remain} menit`;
  }
  if (freshUser.activeCooldownPotion) {
    potionStatus += `\n⏰ Cooldown: ${freshUser.activeCooldownPotion.name} (${freshUser.activeCooldownPotion.remain} menit)`;
  }
  
  const embed = new EmbedBuilder()
    .setTitle(`🎣 ${interaction.user.username}'s Fishing Profile`)
    .setColor(0x00ae86)
    .setThumbnail(interaction.user.displayAvatarURL())
    .addFields(
      { name: "💰 **Credits**", value: `${freshUser.credits.toLocaleString()} credits`, inline: true },
      { name: "⭐ **Points**", value: `${freshUser.points.toLocaleString()} points`, inline: true },
      { name: "📈 **Activity Points**", value: `${freshUser.activityPoints.toLocaleString()} pts`, inline: true },
      { name: "🏆 **Total Fishing Credits**", value: `${freshUser.totalFishingCredits.toLocaleString()} credits`, inline: true },
      { name: "🐟 **Total Ikan**", value: `${totalFish} ekor`, inline: true },
      { name: "📋 **Jenis Ikan**", value: `${totalJenis} jenis`, inline: true },
      { name: "🎣 **Rod**", value: `${freshUser.equippedRod}\n\`${formattedRod}x luck\``, inline: true },
      { name: "🪱 **Bait**", value: `${freshUser.equippedBait}\n\`${formattedBait}x luck\``, inline: true },
      { name: "🧪 **Potion**", value: potionStatus, inline: true },
      { name: "✨ **Total Luck**", value: `\`${formattedTotal}x\`\n${luckBar}`, inline: false },
      { name: "📊 **Luck Breakdown**", value: `┌ 🎣 Rod: **${formattedRod}x**\n├ 🪱 Bait: **${formattedBait}x**\n├ 🧪 Potion: **${formattedPotion}x**\n├ 🌍 Global: **${formattedGlobal}x**\n└ 📡 Channel: **${formattedChannel}x**`, inline: false }
    )
    .setFooter({ text: "Semakin tinggi luck, semakin langka ikan yang didapat!" })
    .setTimestamp();
  
  return interaction.editReply({ embeds: [embed] });
}

async function handleGameButton(interaction, client) {
  const channelId = interaction.channelId;
  const customId = interaction.customId;
  
  // Handle profile button
  if (customId === "game_profile") {
    return showProfile(interaction);
  }
  
  // Handle direct game buttons
  if (customId === "game_hunt") {
    if (!isGameAllowedInChannel(channelId, "hunt")) {
      return interaction.reply({ 
        content: `❌ Game **Hunt** hanya bisa dimainkan di **Zona Hutan**! Gunakan channel <#1495049686363410535>`
      });
    }
    return executeHunt(interaction);
  }
  
  if (customId === "game_dungeon") {
    if (!isGameAllowedInChannel(channelId, "dungeon")) {
      return interaction.reply({ 
        content: `❌ Game **Dungeon** hanya bisa dimainkan di **Zona Hutan**! Gunakan channel <#1495049686363410535>`
      });
    }
    return executeDungeon(interaction);
  }
  
  if (customId === "game_fishing" || customId === "casino_fishing") {
    return executeFishing(interaction, client);
  }
  
  if (customId === "game_casino") {
    return handleCasinoMenu(interaction);
  }
  
  // Handle casino buttons
  if (customId === "casino_cf") {
    if (!isGameAllowedInChannel(channelId, "cf")) {
      return interaction.reply({ 
        content: `❌ Game **Coin Flip** hanya bisa dimainkan di **Zona Kasino**! Gunakan channel <#1495050723522641970>`
      });
    }
    return interaction.reply({
      content: "🪙 **Coin Flip**\nGunakan command: `!cf <kepala/ekor> <jumlah>`\n\nContoh: `!cf kepala 1000`\n\n💡 Win chance: 30% | Menang x2"
    });
  }
  
  if (customId === "casino_rps") {
    if (!isGameAllowedInChannel(channelId, "rps")) {
      return interaction.reply({ 
        content: `❌ Game **RPS** hanya bisa dimainkan di **Zona Kasino**! Gunakan channel <#1495050723522641970>`
      });
    }
    return interaction.reply({
      content: "✊ **Rock Paper Scissors**\nGunakan command: `!rps <rock/paper/scissors> <jumlah>`\n\nContoh: `!rps rock 1000`\n\n💡 Menang x2 | Seri uang kembali"
    });
  }
  
  if (customId === "casino_slots") {
    if (!isGameAllowedInChannel(channelId, "slots")) {
      return interaction.reply({ 
        content: `❌ Game **Slots** hanya bisa dimainkan di **Zona Kasino**! Gunakan channel <#1495050723522641970>`
      });
    }
    return interaction.reply({
      content: "🎰 **Slot Machine**\nGunakan command: `!slots <jumlah>`\n\nContoh: `!slots 1000`\n\n💡 Pair x1.5 | Triple x3-10 | Jackpot x15"
    });
  }
  
  if (customId === "casino_roulette") {
    if (!isGameAllowedInChannel(channelId, "roulette")) {
      return interaction.reply({ 
        content: `❌ Game **Roulette** hanya bisa dimainkan di **Zona Kasino**! Gunakan channel <#1495050723522641970>`
      });
    }
    return interaction.reply({
      content: "🎡 **Roulette**\nGunakan command: `!roulette <jumlah> <side>`\n\nSide: `red`, `black`, `green`, `odd`, `even`, atau `0-36`\n\nContoh: `!roulette 1000 red`\n\n💡 Red/Black x2 | Odd/Even x2 | Green x17 | Single x36"
    });
  }
  
  if (customId === "casino_dadu") {
    if (!isGameAllowedInChannel(channelId, "dadu")) {
      return interaction.reply({ 
        content: `❌ Game **Dadu** hanya bisa dimainkan di **Zona Kasino**! Gunakan channel <#1495050723522641970>`
      });
    }
    return interaction.reply({
      content: "🎲 **Dadu High/Low**\nGunakan command: `!dadu <high/low> <jumlah>`\n\nContoh: `!dadu high 1000`\n\n💡 High (4-6) menang | Low (1-3) menang | Menang x2\n💰 Maks taruhan: 3000 credits"
    });
  }
  
  // Handle back buttons
  if (customId === "back_to_game_menu") {
    return handleGameMenu(interaction);
  }
  
  if (customId === "back_to_casino") {
    return handleCasinoMenu(interaction);
  }
  
  // Jika tidak ada yang cocok
  console.log(`[WARNING] Unknown button: ${customId}`);
  return interaction.reply({ content: "❌ Game tidak ditemukan!" });
}

function createGameMenu() {
  const embed = new EmbedBuilder()
    .setTitle("🎮 **GAME MENU** 🎮")
    .setDescription("Pilih menu di bawah ini!")
    .setColor(0x5865f2)
    .setTimestamp();
  
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("game_fishing").setLabel("🎣 Fishing").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("game_hunt").setLabel("🏹 Hunt").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("game_dungeon").setLabel("🏰 Dungeon").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("game_casino").setLabel("🎰 Casino").setStyle(ButtonStyle.Secondary)
  );
  
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("game_profile").setLabel("👤 Profile").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("back_to_main_menu").setLabel("🔙 Menu Utama").setStyle(ButtonStyle.Secondary)
  );
  
  return { embed, components: [row1, row2] };
}

function createCasinoMenu() {
  const embed = new EmbedBuilder()
    .setTitle("🎰 **CASINO MENU** 🎰")
    .setDescription("**Pilih permainan kasino:**\n\n" +
      "🪙 **Coin Flip** - Tebak kepala/ekor (30% win chance)\n" +
      "✊ **RPS** - Rock Paper Scissors vs Bot\n" +
      "🎰 **Slots** - Slot machine dengan berbagai hadiah\n" +
      "🎡 **Roulette** - Taruhan pada angka/warna\n" +
      "🎲 **Dadu** - Tebak High/Low (1-6)\n\n" +
      "🎣 **Fishing** - Mancing ikan di channel khusus")
    .setColor(0xffaa00)
    .setTimestamp();
  
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("casino_cf").setLabel("🪙 CF").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("casino_rps").setLabel("✊ RPS").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("casino_slots").setLabel("🎰 Slots").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("casino_roulette").setLabel("🎡 Roulette").setStyle(ButtonStyle.Secondary)
  );
  
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("casino_dadu").setLabel("🎲 Dadu").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("casino_fishing").setLabel("🎣 Fishing").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("back_to_game_menu").setLabel("🔙 Kembali").setStyle(ButtonStyle.Secondary)
  );
  
  return { embed, components: [row1, row2] };
}

module.exports = {
  handleGameMenu,
  handleCasinoMenu,
  handleGameButton,
  createGameMenu,
  createCasinoMenu
};