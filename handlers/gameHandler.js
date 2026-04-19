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
    return interaction.reply({ content: "⏳ Tombol sedang diproses, jangan spam!" });
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
  
  return interaction.reply({ embeds: [embed], components: [row1, row2] });
}

async function handleGameButton(interaction, client) {
  const channelId = interaction.channelId;
  const customId = interaction.customId;
  
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
  
  if (customId === "casino_bomb") {
    if (!isGameAllowedInChannel(channelId, "bomb")) {
      return interaction.reply({ 
        content: `❌ Game **Bomb** hanya bisa dimainkan di **Zona Kasino**! Gunakan channel <#1495050723522641970>`
      });
    }
    return interaction.reply({
      content: "💣 **Bomb Squad - Minesweeper Style** 💣\n\n" +
        "🎮 **Cara Bermain:**\n" +
        "Gunakan command: `!bomb <jumlah>`\n\n" +
        "📋 **Contoh:** `!bomb 1000`\n\n" +
        "⚡ **Aturan Main:**\n" +
        "• Grid **5x5** dengan **5 bom** tersembunyi\n" +
        "• Klik kotak untuk membuka (❓)\n" +
        "• 💎 Kotak aman = multiplier +20%\n" +
        "• 💣 Kena bom = kalah semua\n" +
        "• 💰 Cashout kapan saja untuk ambil kemenangan\n\n" +
        "🎁 **Multiplier progresif:** Setiap kotak aman menambah kemenangan!"
    });
  }
  
  // Handle back buttons
  if (customId === "back_to_game_menu") {
    return handleGameMenu(interaction);
  }
  
  if (customId === "back_to_casino") {
    return handleCasinoMenu(interaction);
  }
  
  // Handle bomb interactions (cell clicks and cashout)
  if (customId.startsWith("bomb_cell_") || customId === "bomb_cashout") {
    return handleBombInteraction(interaction);
  }
  
  // Jika tidak ada yang cocok
  console.log(`[WARNING] Unknown button: ${customId}`);
  return interaction.reply({ content: "❌ Game tidak ditemukan!" });
}

module.exports = {
  handleGameMenu,
  handleCasinoMenu,
  handleGameButton,
  handleBombInteraction
};