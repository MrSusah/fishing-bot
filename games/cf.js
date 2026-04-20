const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const economy = require("../utils/economy");

async function executeCF(interaction, choice, amount, client) {
  await interaction.deferReply({ flags: 64 });
  
  const balance = await economy.getBalance(interaction.user.id);
  
  if (amount < 10) {
    return interaction.editReply({ content: "❌ Minimal taruhan adalah **10 credits**!" });
  }
  
  if (balance < amount) {
    return interaction.editReply({ content: `❌ Credit tidak cukup! Saldo: **${balance.toLocaleString()}** credits` });
  }
  
  const validChoices = ["kepala", "ekor"];
  if (!validChoices.includes(choice.toLowerCase())) {
    return interaction.editReply({ content: "❌ Pilihan harus **kepala** atau **ekor**!" });
  }
  
  const result = Math.random() < 0.3 ? choice.toLowerCase() : (choice.toLowerCase() === "kepala" ? "ekor" : "kepala");
  const isWin = result === choice.toLowerCase();
  
  let embed = new EmbedBuilder()
    .setTitle("🪙 **COIN FLIP** 🪙")
    .setColor(isWin ? 0x00ff00 : 0xff0000)
    .addFields(
      { name: "🎲 **Pilihanmu**", value: choice.toUpperCase(), inline: true },
      { name: "🪙 **Hasil**", value: result.toUpperCase(), inline: true }
    )
    .setTimestamp();
  
  if (isWin) {
    const winAmount = amount * 2;
    await economy.addCredits(interaction.user.id, winAmount);
    embed.addFields(
      { name: "✅ **MENANG!**", value: `Kamu menang **${winAmount.toLocaleString()}** credits!`, inline: false }
    );
  } else {
    await economy.removeCredits(interaction.user.id, amount);
    embed.addFields(
      { name: "❌ **KALAH!**", value: `Kamu kehilangan **${amount.toLocaleString()}** credits!`, inline: false }
    );
  }
  
  const newBalance = await economy.getBalance(interaction.user.id);
  embed.setFooter({ text: `💰 Saldo sekarang: ${newBalance.toLocaleString()} credits` });
  
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("back_to_casino").setLabel("🎰 Kembali ke Casino").setStyle(ButtonStyle.Secondary)
  );
  
  return interaction.editReply({ embeds: [embed], components: [row] });
}

module.exports = { executeCF };