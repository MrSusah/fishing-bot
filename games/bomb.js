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
    const row = new ActionRowBuilder();
    
    if (this.isActive && !this.isCashedOut) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId("bomb_cashout")
          .setLabel(`💰 Cashout (${this.getCurrentWin().toLocaleString()} credits)`)
          .setStyle(ButtonStyle.Success)
      );
    }
    
    row.addComponents(
      new ButtonBuilder()
        .setCustomId("back_to_casino")
        .setLabel("🎰 Kembali ke Casino")
        .setStyle(ButtonStyle.Secondary)
    );
    
    return [row];
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
      embed.setDescription("🔍 Klik kotak untuk mencari harta karun! Hindari bom! 💣");
    }
    
    return embed;
  }
}

const activeGames = new Map();

async function executeBomb(interaction, amount) {
  await interaction.deferReply();
  
  const balance = await getBalance(interaction.user.id);
  
  if (amount < 10) {
    return interaction.editReply({ content: "❌ Minimal taruhan adalah **10 credits**!", flags: 64 });
  }
  
  if (balance < amount) {
    return interaction.editReply({ content: `❌ Credit tidak cukup! Saldo: **${balance.toLocaleString()}** credits`, flags: 64 });
  }
  
  await removeCredits(interaction.user.id, amount, "bomb");
  
  const game = new BombGame(interaction.user.id, amount);
  activeGames.set(interaction.user.id, game);
  
  const components = [...game.getGridButtons(), ...game.getActionButtons()];
  
  return interaction.editReply({
    embeds: [game.getEmbed()],
    components: components
  });
}

async function handleBombInteraction(interaction) {
  const game = activeGames.get(interaction.user.id);
  if (!game || !game.isActive) {
    return interaction.update({
      content: "❌ Game tidak aktif atau sudah berakhir!",
      components: [],
      embeds: []
    });
  }
  
  if (interaction.customId === "bomb_cashout") {
    const winAmount = game.cashout();
    if (winAmount > 0) {
      await addCredits(interaction.user.id, winAmount, "bomb");
    }
    activeGames.delete(interaction.user.id);
    
    const components = [...game.getGridButtons(), ...game.getActionButtons()];
    return interaction.update({
      embeds: [game.getEmbed()],
      components: components
    });
  }
  
  if (interaction.customId.startsWith("bomb_cell_")) {
    const cellIndex = parseInt(interaction.customId.split("_")[2]);
    const result = game.revealCell(cellIndex);
    
    if (!result.success) {
      return interaction.deferUpdate();
    }
    
    if (result.isBomb) {
      activeGames.delete(interaction.user.id);
    }
    
    const components = [...game.getGridButtons(), ...game.getActionButtons()];
    return interaction.update({
      embeds: [game.getEmbed()],
      components: components
    });
  }
}

module.exports = { executeBomb, handleBombInteraction };