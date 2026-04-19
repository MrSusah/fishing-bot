const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { isGameAllowedInChannel } = require("../utils/channelValidator");
const { executeHunt } = require("../games/hunt");
const { executeDungeon } = require("../games/dungeon");
const { executeFishing } = require("../games/fishing");
const { executeBomb, handleBombInteraction } = require("../games/bomb");

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
    return interaction.reply({ content: "⏳ Tombol sedang diproses, jangan spam!", flags: 64 });
  }
  
  const embed = new EmbedBuilder()
    .setTitle("🎮 **GAME MENU** 🎮")
    .setDescription("Pilih game yang ingin dimainkan!")
    .setColor(0x5865f2)
    .setTimestamp();
  
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("game_fishing").setLabel("🎣 Fishing").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("game_hunt").setLabel("🏹 Hunt").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("game_dungeon").setLabel("🏰 Dungeon").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("game_casino").setLabel("🎰 Casino").setStyle(ButtonStyle.Secondary)
  );
  
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("back_to_main_menu").setLabel("🔙 Menu Utama").setStyle(ButtonStyle.Secondary)
  );
  
  return interaction.reply({ embeds: [embed], components: [row1, row2], flags: 64 });
}

async function handleCasinoMenu(interaction) {
  if (hasButtonCooldown(interaction.user.id, "casino_menu")) {
    return interaction.reply({ content: "⏳ Tombol sedang diproses, jangan spam!", flags: 64 });
  }
  
  const embed = new EmbedBuilder()
    .setTitle("🎰 **CASINO MENU** 🎰")
    .setDescription("**Pilih permainan kasino:**\n\n" +
      "🪙 **Coin Flip** - Tebak kepala/ekor (30% win chance)\n" +
      "✊ **RPS** - Rock Paper Scissors vs Bot\n" +
      "🎰 **Slots** - Slot machine dengan berbagai hadiah\n" +
      "🎡 **Roulette** - Taruhan pada angka/warna\n" +
      "🎲 **Dadu** - Tebak High/Low (1-6)\n" +
      "💣 **Bomb** - Cari harta karun hindari bom\n\n" +
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
    new ButtonBuilder().setCustomId("casino_bomb").setLabel("💣 Bomb").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("casino_dadu").setLabel("🎲 Dadu").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("casino_fishing").setLabel("🎣 Fishing").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("back_to_game_menu").setLabel("🔙 Kembali").setStyle(ButtonStyle.Secondary)
  );
  
  return interaction.reply({ embeds: [embed], components: [row1, row2], flags: 64 });
}

async function handleGameButton(interaction, client) {
  const channelId = interaction.channelId;
  const gameName = interaction.customId.replace("game_", "").replace("casino_", "");
  
  // Validasi channel untuk hunt dan dungeon
  if (gameName === "hunt" || gameName === "dungeon") {
    if (!isGameAllowedInChannel(channelId, gameName)) {
      return interaction.reply({ 
        content: `❌ Game **${gameName}** hanya bisa dimainkan di **Zona Hutan**! Gunakan channel <#1495049686363410535>`, 
        flags: 64 
      });
    }
  }
  
  // Validasi channel untuk casino games
  const casinoGames = ["cf", "rps", "slots", "roulette", "dadu", "bomb"];
  if (casinoGames.includes(gameName)) {
    if (!isGameAllowedInChannel(channelId, gameName)) {
      return interaction.reply({ 
        content: `❌ Game **${gameName}** hanya bisa dimainkan di **Zona Kasino**! Gunakan channel <#1495050723522641970>`, 
        flags: 64 
      });
    }
  }
  
  // Handle game execution
  switch (gameName) {
    case "hunt":
      return executeHunt(interaction);
    case "dungeon":
      return executeDungeon(interaction);
    case "fishing":
    case "casino_fishing":
      return executeFishing(interaction, client);
    case "cf":
    case "casino_cf":
      return interaction.reply({
        content: "🪙 **Coin Flip**\nGunakan command: `!cf <kepala/ekor> <jumlah>`\n\nContoh: `!cf kepala 1000`\n\n💡 Win chance: 30% | Menang x2",
        flags: 64
      });
    case "rps":
    case "casino_rps":
      return interaction.reply({
        content: "✊ **Rock Paper Scissors**\nGunakan command: `!rps <rock/paper/scissors> <jumlah>`\n\nContoh: `!rps rock 1000`\n\n💡 Menang x2 | Seri uang kembali",
        flags: 64
      });
    case "slots":
    case "casino_slots":
      return interaction.reply({
        content: "🎰 **Slot Machine**\nGunakan command: `!slots <jumlah>`\n\nContoh: `!slots 1000`\n\n💡 Pair x1.5 | Triple x3-10 | Jackpot x15",
        flags: 64
      });
    case "roulette":
    case "casino_roulette":
      return interaction.reply({
        content: "🎡 **Roulette**\nGunakan command: `!roulette <jumlah> <side>`\n\nSide: `red`, `black`, `green`, `odd`, `even`, atau `0-36`\n\nContoh: `!roulette 1000 red`\n\n💡 Red/Black x2 | Odd/Even x2 | Green x17 | Single x36",
        flags: 64
      });
    case "dadu":
    case "casino_dadu":
      return interaction.reply({
        content: "🎲 **Dadu High/Low**\nGunakan command: `!dadu <high/low> <jumlah>`\n\nContoh: `!dadu high 1000`\n\n💡 High (4-6) menang | Low (1-3) menang | Menang x2\n💰 Maks taruhan: 3000 credits",
        flags: 64
      });
    case "bomb":
    case "casino_bomb":
      return interaction.reply({
        content: "💣 **Bomb Squad**\nGunakan command: `!bomb <jumlah>`\n\nContoh: `!bomb 1000`\n\n💡 Grid 8x8 dengan 10 bom tersembunyi\n💎 Setiap langkah aman multiplier +10%\n💣 Kena bom = kalah semua\n💰 Cashout kapan saja!",
        flags: 64
      });
    default:
      return interaction.reply({ content: "❌ Game tidak ditemukan!", flags: 64 });
  }
}

module.exports = {
  handleGameMenu,
  handleCasinoMenu,
  handleGameButton,
  handleBombInteraction
};