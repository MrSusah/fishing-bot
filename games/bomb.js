const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { addCredits, getBalance, removeCredits } = require("../utils/economy");

const GRID_SIZE = 8;
const TOTAL_BOMBS = 10;
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
    
    this.multiplier *= 1.1;
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
  
  getGridButtons() {
    const rows = [];
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
          if (isRevealed) {
            if (isBomb) {
              emoji = "💣";
              style = ButtonStyle.Danger;
            } else {
              emoji = "💎";
              style = ButtonStyle.Success;
            }
          }
          disabled = true;
        } else if (isRevealed) {
          emoji = "💎";
          style = ButtonStyle.Success;
          disabled = true;
        }
        
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`bomb_cell_${index}`)
            .setLabel(emoji)
            .setStyle(style)
            .setDisabled(disabled)
        );
      }
      rows.push(row);
    }
    return rows;
  }
  
  getActionButtons() {
    const rows = [];
    const row1 = new ActionRowBuilder();
    
    if (this.isActive && !this.isCashedOut) {
      row1.addComponents(
        new ButtonBuilder()
          .setCustomId("bomb_cashout")
          .setLabel(`💰 Cashout (${this.getCurrentWin().toLocaleString()} credits)`)
          .setStyle(ButtonStyle.Success)
      );
    }
    
    row1.addComponents(
      new ButtonBuilder()
        .setCustomId("back_to_casino")
        .setLabel("🎰 Kembali ke Casino")
        .setStyle(ButtonStyle.Secondary)
    );
    
    rows.push(row1);
    return rows;
  }
  
  getEmbed() {
    const embed = new EmbedBuilder()
      .setTitle("💣 **MINES - BOMB SQUAD** 💣")
      .setColor(this.isActive ? 0x00ff00 : (this.isCashedOut ? 0xffaa00 : 0xff0000))
      .addFields(
        { name: "💰 **Taruhan**", value: `${this.betAmount.toLocaleString()} credits`, inline: true },
        { name: "🎯 **Multiplier**", value: `${this.multiplier.toFixed(2)}x`, inline: true },
        { name: "💎 **Selamat**", value: `${this.revealedCells.size} selamat`, inline: true },
        { name: "💣 **Bom**", value: `${TOTAL_BOMBS} bom tersembunyi`, inline: true }
      )
      .setTimestamp();
    
    if (!this.isActive && !this.isCashedOut) {
      embed.setDescription("💥 **KAMU KENA BOM!** Semua taruhan hangus! 💥");
    } else if (this.isCashedOut) {
      const winAmount = this.getCurrentWin();
      embed.setDescription(`✅ **CASHOUT BERHASIL!** Kamu mendapatkan **${winAmount.toLocaleString()}** credits! ✅`);
    } else {
      embed.setDescription("🔍 Klik kotak untuk mencari harta karun! Hindari bom! 💣\n\n⚡ **Aturan:** Setiap kotak aman = multiplier +10% | Kena bom = kalah semua");
    }
    
    return embed;
  }
}

const activeGames = new Map();

async function executeBomb(interaction, amount) {
  try {
    console.log(`[BOMB] Starting game for ${interaction.user.username} with amount ${amount}`);
    
    // Pastikan interaction didefer
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply();
    }
    
    const balance = await getBalance(interaction.user.id);
    
    if (amount < 10) {
      return interaction.editReply({ content: "❌ Minimal taruhan adalah **10 credits**!" });
    }
    
    if (balance < amount) {
      return interaction.editReply({ content: `❌ Credit tidak cukup! Saldo: **${balance.toLocaleString()}** credits` });
    }
    
    // Kurangi kredit
    await removeCredits(interaction.user.id, amount, "bomb");
    console.log(`[BOMB] Removed ${amount} credits from ${interaction.user.username}`);
    
    // Buat game baru
    const game = new BombGame(interaction.user.id, amount);
    activeGames.set(interaction.user.id, game);
    console.log(`[BOMB] Game created for ${interaction.user.id}`);
    
    // Kirim embed dan button
    const components = [...game.getGridButtons(), ...game.getActionButtons()];
    
    return interaction.editReply({
      embeds: [game.getEmbed()],
      components: components
    });
  } catch (error) {
    console.error("[BOMB] Error in executeBomb:", error);
    return interaction.editReply({ content: "❌ Terjadi kesalahan saat memulai game Bomb!" });
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
      
      const components = [...game.getGridButtons(), ...game.getActionButtons()];
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
      
      const components = [...game.getGridButtons(), ...game.getActionButtons()];
      return interaction.update({
        embeds: [game.getEmbed()],
        components: components
      });
    }
    
    return interaction.deferUpdate();
    
  } catch (error) {
    console.error("[BOMB] Error in handleBombInteraction:", error);
    return interaction.reply({ content: "❌ Terjadi kesalahan dalam game Bomb!", ephemeral: true });
  }
}

// Fungsi untuk membersihkan game yang tidak aktif (optional)
setInterval(() => {
  const now = Date.now();
  for (const [userId, game] of activeGames.entries()) {
    // Hapus game yang sudah tidak aktif lebih dari 30 menit
    if (!game.isActive && game.endTime && now - game.endTime > 1800000) {
      activeGames.delete(userId);
    }
  }
}, 600000);

module.exports = { executeBomb, handleBombInteraction };