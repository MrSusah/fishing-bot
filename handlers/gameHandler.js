const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { isGameAllowedInChannel, HUNT_CHANNEL_ID, CASINO_CHANNEL_ID } = require("../utils/channelValidator");
const HuntGame = require("../games/hunt");
const DungeonGame = require("../games/dungeon");
const FishingGame = require("../games/fishing");
const CoinFlipGame = require("../games/cf");
const RPSGame = require("../games/rps");
const SlotsGame = require("../games/slots");
const RouletteGame = require("../games/roulette");
const DaduGame = require("../games/dadu");
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

function createGameMenu() {
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
  
  return { embed, components: [row1, row2] };
}

function createCasinoMenu() {
  const embed = new EmbedBuilder()
    .setTitle("🎰 **CASINO MENU** 🎰")
    .setDescription("**Pilih permainan kasino:**\n\n" +
      "🪙 **Coin Flip** - Tebak kepala/ekor\n" +
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
  
  return { embed, components: [row1, row2] };
}

async function handleGameMenu(interaction) {
  if (hasButtonCooldown(interaction.user.id, "game_menu")) {
    return interaction.reply({ content: "⏳ Tombol sedang diproses, jangan spam!", ephemeral: true });
  }
  
  const { embed, components } = createGameMenu();
  return interaction.update({ embeds: [embed], components });
}

async function handleCasinoMenu(interaction) {
  if (hasButtonCooldown(interaction.user.id, "casino_menu")) {
    return interaction.reply({ content: "⏳ Tombol sedang diproses, jangan spam!", ephemeral: true });
  }
  
  const { embed, components } = createCasinoMenu();
  return interaction.update({ embeds: [embed], components });
}

async function handleGameButton(interaction, client) {
  const channelId = interaction.channelId;
  const customId = interaction.customId;
  
  // Defer reply untuk menghindari timeout
  await interaction.deferReply({ ephemeral: false });
  
  try {
    // Handle HUNT
    if (customId === "game_hunt") {
      if (!isGameAllowedInChannel(channelId, "hunt")) {
        return interaction.editReply({ 
          content: `❌ Game **Hunt** hanya bisa dimainkan di **Zona Hutan**! Gunakan channel <#${HUNT_CHANNEL_ID}>`
        });
      }
      const result = await HuntGame.play(interaction.user.id, interaction.user.username);
      if (result.message) {
        return interaction.editReply({ content: result.message });
      }
      return interaction.editReply({ embeds: [result.embed] });
    }
    
    // Handle DUNGEON
    if (customId === "game_dungeon") {
      if (!isGameAllowedInChannel(channelId, "dungeon")) {
        return interaction.editReply({ 
          content: `❌ Game **Dungeon** hanya bisa dimainkan di **Zona Hutan**! Gunakan channel <#${HUNT_CHANNEL_ID}>`
        });
      }
      const result = await DungeonGame.play(interaction.user.id, interaction.user.username);
      if (result.message) {
        return interaction.editReply({ content: result.message });
      }
      return interaction.editReply({ embeds: [result.embed] });
    }
    
    // Handle FISHING
    if (customId === "game_fishing" || customId === "casino_fishing") {
      const result = await FishingGame.play(interaction.user.id, interaction.user.username);
      if (result.message) {
        return interaction.editReply({ content: result.message });
      }
      return interaction.editReply({ embeds: [result.embed] });
    }
    
    // Handle GAME CASINO (navigate to casino menu)
    if (customId === "game_casino") {
      const { embed, components } = createCasinoMenu();
      return interaction.editReply({ embeds: [embed], components });
    }
    
    // Handle CASINO CF
    if (customId === "casino_cf") {
      if (!isGameAllowedInChannel(channelId, "cf")) {
        return interaction.editReply({ 
          content: `❌ Game **Coin Flip** hanya bisa dimainkan di **Zona Kasino**! Gunakan channel <#${CASINO_CHANNEL_ID}>`
        });
      }
      const embed = new EmbedBuilder()
        .setTitle("🪙 **Coin Flip**")
        .setDescription("Gunakan command: `!cf <kepala/ekor> <jumlah>`")
        .addFields(
          { name: "📋 Contoh", value: "`!cf kepala 1000`", inline: true },
          { name: "💰 Pembayaran", value: "Menang x2", inline: true },
          { name: "💰 Maks Taruhan", value: "10.000 credits", inline: true }
        )
        .setColor(0xffaa00);
      return interaction.editReply({ embeds: [embed] });
    }
    
    // Handle CASINO RPS
    if (customId === "casino_rps") {
      if (!isGameAllowedInChannel(channelId, "rps")) {
        return interaction.editReply({ 
          content: `❌ Game **RPS** hanya bisa dimainkan di **Zona Kasino**! Gunakan channel <#${CASINO_CHANNEL_ID}>`
        });
      }
      const embed = new EmbedBuilder()
        .setTitle("✊ **Rock Paper Scissors**")
        .setDescription("Gunakan command: `!rps <rock/paper/scissors> <jumlah>`")
        .addFields(
          { name: "📋 Contoh", value: "`!rps rock 1000`", inline: true },
          { name: "💰 Pembayaran", value: "Menang x2 | Seri uang kembali", inline: true },
          { name: "💰 Maks Taruhan", value: "10.000 credits", inline: true }
        )
        .setColor(0xffaa00);
      return interaction.editReply({ embeds: [embed] });
    }
    
    // Handle CASINO SLOTS
    if (customId === "casino_slots") {
      if (!isGameAllowedInChannel(channelId, "slots")) {
        return interaction.editReply({ 
          content: `❌ Game **Slots** hanya bisa dimainkan di **Zona Kasino**! Gunakan channel <#${CASINO_CHANNEL_ID}>`
        });
      }
      const embed = new EmbedBuilder()
        .setTitle("🎰 **Slot Machine**")
        .setDescription("Gunakan command: `!slots <jumlah>`")
        .addFields(
          { name: "📋 Contoh", value: "`!slots 1000`", inline: true },
          { name: "💰 Pembayaran", value: "Pair x1.5 | Triple x3-10 | Jackpot x15", inline: true },
          { name: "💰 Maks Taruhan", value: "10.000 credits", inline: true }
        )
        .setColor(0xffaa00);
      return interaction.editReply({ embeds: [embed] });
    }
    
    // Handle CASINO ROULETTE
    if (customId === "casino_roulette") {
      if (!isGameAllowedInChannel(channelId, "roulette")) {
        return interaction.editReply({ 
          content: `❌ Game **Roulette** hanya bisa dimainkan di **Zona Kasino**! Gunakan channel <#${CASINO_CHANNEL_ID}>`
        });
      }
      const embed = new EmbedBuilder()
        .setTitle("🎡 **Roulette**")
        .setDescription("Gunakan command: `!roulette <jumlah> <side>`")
        .addFields(
          { name: "📋 Side", value: "`red`, `black`, `green`, `odd`, `even`, atau `0-36`", inline: false },
          { name: "📋 Contoh", value: "`!roulette 1000 red`", inline: true },
          { name: "💰 Pembayaran", value: "Red/Black x2 | Odd/Even x2 | Green x17 | Single x36", inline: true },
          { name: "💰 Maks Taruhan", value: "10.000 credits", inline: true }
        )
        .setColor(0xffaa00);
      return interaction.editReply({ embeds: [embed] });
    }
    
    // Handle CASINO DADU
    if (customId === "casino_dadu") {
      if (!isGameAllowedInChannel(channelId, "dadu")) {
        return interaction.editReply({ 
          content: `❌ Game **Dadu** hanya bisa dimainkan di **Zona Kasino**! Gunakan channel <#${CASINO_CHANNEL_ID}>`
        });
      }
      const embed = new EmbedBuilder()
        .setTitle("🎲 **Dadu High/Low**")
        .setDescription("Gunakan command: `!dadu <high/low> <jumlah>`")
        .addFields(
          { name: "📋 Contoh", value: "`!dadu high 1000`", inline: true },
          { name: "🎯 Aturan", value: "High (4-6) menang | Low (1-3) menang", inline: true },
          { name: "💰 Pembayaran", value: "Menang x2", inline: true },
          { name: "💰 Maks Taruhan", value: "3000 credits", inline: true }
        )
        .setColor(0xffaa00);
      return interaction.editReply({ embeds: [embed] });
    }
    
    // Handle BACK TO GAME MENU
    if (customId === "back_to_game_menu") {
      const { embed, components } = createGameMenu();
      return interaction.editReply({ embeds: [embed], components });
    }
    
    // Handle BACK TO CASINO
    if (customId === "back_to_casino") {
      const { embed, components } = createCasinoMenu();
      return interaction.editReply({ embeds: [embed], components });
    }
    
    // Handle BACK TO MAIN MENU (dari game menu)
    if (customId === "back_to_main_menu") {
      return interaction.editReply({ 
        content: "🔙 Kembali ke menu utama. Ketik `!fishing` untuk membuka menu utama!",
        components: []
      });
    }
    
    // Jika tidak ada yang cocok
    console.log(`[WARNING] Unknown button: ${customId}`);
    return interaction.editReply({ content: "❌ Game tidak ditemukan!" });
    
  } catch (error) {
    console.error(`[ERROR] Error in handleGameButton for ${customId}:`, error);
    return interaction.editReply({ content: "❌ Terjadi kesalahan saat memproses game! Silakan coba lagi." });
  }
}

module.exports = {
  createGameMenu,
  createCasinoMenu,
  handleGameMenu,
  handleCasinoMenu,
  handleGameButton,
  handleBombGameInteraction
};