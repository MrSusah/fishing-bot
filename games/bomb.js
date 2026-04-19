const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { addCredits, getBalance, removeCredits } = require("../utils/economy");

const GRID_SIZE = 5;
const TOTAL_BOMBS = 5;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

class BombGame {
  constructor(userId, betAmount) {
    this.userId = userId;
    this.betAmount = betAmount;
    this.bombPositions = new Set();
    this.revealedCells = new Set();
    this.multiplier = 1.0;
    this.isActive = true;
    this.isCashedOut = false;
    this.messageId = null;
    this.channelId = null;
    this.generateBombs();
  }
  
  generateBombs() {
    while (this.bombPositions.size < TOTAL_BOMBS) {
      const pos = Math.floor(Math.random() * TOTAL_CELLS);
      this.bombPositions.add(pos);
    }
  }
  
  revealCell(index) {
    if (!this.isActive || this.revealedCells.has(index)) {
      return { success: false, isBomb: false, gameOver: false };
    }
    
    this.revealedCells.add(index);
    
    if (this.bombPositions.has(index)) {
      this.isActive = false;
      return { success: true, isBomb: true, gameOver: true };
    }
    
    this.multiplier = parseFloat((this.multiplier * 1.2).toFixed(2));
    return { success: true, isBomb: false, gameOver: false, multiplier: this.multiplier };
  }
  
  cashout() {
    if (!this.isActive || this.isCashedOut) {
      return 0;
    }
    this.isCashedOut = true;
    this.isActive = false;
    return Math.floor(this.betAmount * this.multiplier);
  }
  
  getCurrentWin() {
    return Math.floor(this.betAmount * this.multiplier);
  }
  
  getGridComponents() {
    const components = [];
    
    for (let i = 0; i < GRID_SIZE; i++) {
      const row = new ActionRowBuilder();
      for (let j = 0; j < GRID_SIZE; j++) {
        const index = i * GRID_SIZE + j;
        const isRevealed = this.revealedCells.has(index);
        const isBomb = this.bombPositions.has(index);
        
        let emoji = "❓";
        let style = ButtonStyle.Secondary;
        let disabled = false;
        
        if (!this.isActive) {
          if (isBomb) {
            emoji = "💣";
            style = ButtonStyle.Danger;
          } else if (isRevealed) {
            emoji = "💎";
            style = ButtonStyle.Success;
          } else {
            emoji = "⬛";
            style = ButtonStyle.Secondary;
          }
          disabled = true;
        } 
        else if (isRevealed) {
          emoji = "💎";
          style = ButtonStyle.Success;
          disabled = true;
        }
        
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`bomb_cell_${index}`)
            .setEmoji(emoji)
            .setStyle(style)
            .setDisabled(disabled)
        );
      }
      components.push(row);
    }
    
    return components;
  }
  
  getActionComponents() {
    const components = [];
    const row = new ActionRowBuilder();
    
    if (this.isActive && !this.isCashedOut) {
      const winAmount = this.getCurrentWin();
      row.addComponents(
        new ButtonBuilder()
          .setCustomId("bomb_cashout")
          .setLabel(`💰 Cashout (${winAmount.toLocaleString()} credits)`)
          .setStyle(ButtonStyle.Success)
      );
    }
    
    row.addComponents(
      new ButtonBuilder()
        .setCustomId("back_to_casino")
        .setLabel("🎰 Casino Menu")
        .setStyle(ButtonStyle.Secondary)
    );
    
    components.push(row);
    return components;
  }
  
  getAllComponents() {
    return [...this.getGridComponents(), ...this.getActionComponents()];
  }
  
  getEmbed() {
    const embed = new EmbedBuilder()
      .setTitle("💣 **MINES - BOMB SQUAD** 💣")
      .setColor(this.isActive ? 0x00ff00 : (this.isCashedOut ? 0xffaa00 : 0xff0000))
      .addFields(
        { name: "💰 **Taruhan**", value: `${this.betAmount.toLocaleString()} credits`, inline: true },
        { name: "🎯 **Multiplier**", value: `${this.multiplier.toFixed(2)}x`, inline: true },
        { name: "💎 **Selamat**", value: `${this.revealedCells.size} kotak`, inline: true },
        { name: "💣 **Bom**", value: `${TOTAL_BOMBS} bom`, inline: true },
        { name: "🎁 **Potensi Menang**", value: `${this.getCurrentWin().toLocaleString()} credits`, inline: true }
      )
      .setTimestamp();
    
    if (!this.isActive && !this.isCashedOut) {
      embed.setDescription("💥 **KAMU KENA BOM!** Semua taruhan hangus! 💥");
      embed.setColor(0xff0000);
    } else if (this.isCashedOut) {
      const winAmount = this.getCurrentWin();
      embed.setDescription(`✅ **CASHOUT BERHASIL!** Kamu mendapatkan **${winAmount.toLocaleString()}** credits! ✅`);
      embed.setColor(0xffaa00);
    } else {
      embed.setDescription(`⚡ **Grid 5x5** dengan **${TOTAL_BOMBS} bom** tersembunyi\n💎 Setiap kotak aman = multiplier +20%\n💣 Kena bom = kalah semua\n💰 Cashout kapan saja!`);
    }
    
    return embed;
  }
}

const activeGames = new Map();

async function executeBomb(messageOrInteraction, amount) {
  try {
    console.log(`[BOMB] Starting game for user with amount ${amount}`);
    
    // Tentukan apakah ini dari message atau interaction
    const isMessage = messageOrInteraction.author !== undefined;
    const user = isMessage ? messageOrInteraction.author : messageOrInteraction.user;
    
    console.log(`[BOMB] User: ${user.username}, IsMessage: ${isMessage}`);
    
    const balance = await getBalance(user.id);
    
    if (amount < 10) {
      if (isMessage) {
        return messageOrInteraction.reply("❌ Minimal taruhan adalah **10 credits**!");
      } else {
        return messageOrInteraction.reply({ content: "❌ Minimal taruhan adalah **10 credits**!", ephemeral: true });
      }
    }
    
    if (balance < amount) {
      if (isMessage) {
        return messageOrInteraction.reply(`❌ Credit tidak cukup! Saldo: **${balance.toLocaleString()}** credits`);
      } else {
        return messageOrInteraction.reply({ content: `❌ Credit tidak cukup! Saldo: **${balance.toLocaleString()}** credits`, ephemeral: true });
      }
    }
    
    // Kurangi kredit
    await removeCredits(user.id, amount, "bomb");
    console.log(`[BOMB] Removed ${amount} credits from ${user.id}`);
    
    // Buat game baru
    const game = new BombGame(user.id, amount);
    activeGames.set(user.id, game);
    console.log(`[BOMB] Game created for ${user.id}`);
    
    // Kirim embed dan button
    const components = game.getAllComponents();
    
    if (isMessage) {
      // Ini dari command message
      const sentMessage = await messageOrInteraction.reply({
        embeds: [game.getEmbed()],
        components: components
      });
      game.messageId = sentMessage.id;
      game.channelId = messageOrInteraction.channel.id;
    } else {
      // Ini dari interaction (button)
      if (!messageOrInteraction.deferred && !messageOrInteraction.replied) {
        await messageOrInteraction.deferReply();
      }
      const reply = await messageOrInteraction.editReply({
        embeds: [game.getEmbed()],
        components: components
      });
      game.messageId = reply.id;
      game.channelId = messageOrInteraction.channelId;
    }
    
    return true;
    
  } catch (error) {
    console.error("[BOMB] Error in executeBomb:", error);
    console.error("[BOMB] Error stack:", error.stack);
    
    if (messageOrInteraction.author) {
      return messageOrInteraction.reply("❌ Terjadi kesalahan saat memulai game Bomb! " + error.message);
    } else {
      if (!messageOrInteraction.replied) {
        return messageOrInteraction.reply({ content: "❌ Terjadi kesalahan saat memulai game Bomb!", ephemeral: true });
      }
    }
  }
}

async function handleBombInteraction(interaction) {
  try {
    console.log(`[BOMB] Handling interaction: ${interaction.customId} for user ${interaction.user.id}`);
    
    const game = activeGames.get(interaction.user.id);
    
    if (!game) {
      return interaction.reply({ 
        content: "❌ Tidak ada game Bomb yang aktif! Gunakan `!bomb <jumlah>` untuk memulai.", 
        ephemeral: true 
      });
    }
    
    if (!game.isActive) {
      activeGames.delete(interaction.user.id);
      return interaction.update({
        content: "❌ Game sudah berakhir! Gunakan `!bomb <jumlah>` untuk bermain lagi.",
        components: [],
        embeds: []
      });
    }
    
    // Handle cashout
    if (interaction.customId === "bomb_cashout") {
      console.log(`[BOMB] Cashout from ${interaction.user.id}`);
      const winAmount = game.cashout();
      
      if (winAmount > 0) {
        await addCredits(interaction.user.id, winAmount, "bomb");
        console.log(`[BOMB] Added ${winAmount} credits to ${interaction.user.id}`);
      }
      
      activeGames.delete(interaction.user.id);
      
      const components = game.getAllComponents();
      return interaction.update({
        embeds: [game.getEmbed()],
        components: components
      });
    }
    
    // Handle cell click
    if (interaction.customId.startsWith("bomb_cell_")) {
      const cellIndex = parseInt(interaction.customId.split("_")[2]);
      console.log(`[BOMB] Cell ${cellIndex} clicked by ${interaction.user.id}`);
      
      const result = game.revealCell(cellIndex);
      console.log(`[BOMB] Result: isBomb=${result.isBomb}, gameOver=${result.gameOver}, multiplier=${game.multiplier}`);
      
      if (!result.success) {
        return interaction.deferUpdate();
      }
      
      if (result.isBomb) {
        console.log(`[BOMB] Game over for ${interaction.user.id} - KENA BOM!`);
        activeGames.delete(interaction.user.id);
      }
      
      const components = game.getAllComponents();
      return interaction.update({
        embeds: [game.getEmbed()],
        components: components
      });
    }
    
    return interaction.deferUpdate();
    
  } catch (error) {
    console.error("[BOMB] Error in handleBombInteraction:", error);
    console.error("[BOMB] Error stack:", error.stack);
    return interaction.reply({ content: "❌ Terjadi kesalahan dalam game Bomb!", ephemeral: true });
  }
}

// Cleanup inactive games every 10 minutes
setInterval(() => {
  for (const [userId, game] of activeGames.entries()) {
    if (!game.isActive) {
      activeGames.delete(userId);
    }
  }
  console.log(`[BOMB] Cleanup: ${activeGames.size} active games remaining`);
}, 600000);

module.exports = { executeBomb, handleBombInteraction };