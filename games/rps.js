const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { addCredits, removeCredits, getBalance } = require("../utils/economy");

const choices = ["rock", "paper", "scissors"];
const emojiMap = { rock: "🪨", paper: "📄", scissors: "✂️" };
const nameMap = { rock: "Batu", paper: "Kertas", scissors: "Gunting" };

function getWinner(player, bot) {
  if (player === bot) return "draw";
  if (
    (player === "rock" && bot === "scissors") ||
    (player === "paper" && bot === "rock") ||
    (player === "scissors" && bot === "paper")
  ) {
    return "player";
  }
  return "bot";
}

async function executeRPS(interaction, choice, amount) {
  await interaction.deferReply({ flags: 64 });
  
  const balance = await getBalance(interaction.user.id);
  
  if (amount < 10) {
    return interaction.editReply({ content: "❌ Minimal taruhan adalah **10 credits**!" });
  }
  
  if (balance < amount) {
    return interaction.editReply({ content: `❌ Credit tidak cukup! Saldo: **${balance.toLocaleString()}** credits` });
  }
  
  const validChoices = ["rock", "paper", "scissors"];
  if (!validChoices.includes(choice.toLowerCase())) {
    return interaction.editReply({ content: "❌ Pilihan harus **rock**, **paper**, atau **scissors**!" });
  }
  
  const botChoice = choices[Math.floor(Math.random() * choices.length)];
  const winner = getWinner(choice.toLowerCase(), botChoice);
  
  let embed = new EmbedBuilder()
    .setTitle("✊ **ROCK PAPER SCISSORS** ✋")
    .setColor(winner === "player" ? 0x00ff00 : winner === "bot" ? 0xff0000 : 0xffff00)
    .addFields(
      { name: "👤 **Kamu**", value: `${emojiMap[choice]} ${nameMap[choice]}`, inline: true },
      { name: "🤖 **Bot**", value: `${emojiMap[botChoice]} ${nameMap[botChoice]}`, inline: true }
    )
    .setTimestamp();
  
  if (winner === "player") {
    const winAmount = amount * 2;
    await addCredits(interaction.user.id, winAmount, "rps");
    embed.addFields({ name: "✅ **MENANG!**", value: `Kamu menang **${winAmount.toLocaleString()}** credits!`, inline: false });
  } else if (winner === "bot") {
    await removeCredits(interaction.user.id, amount, "rps");
    embed.addFields({ name: "❌ **KALAH!**", value: `Kamu kehilangan **${amount.toLocaleString()}** credits!`, inline: false });
  } else {
    await addCredits(interaction.user.id, amount, "rps");
    embed.addFields({ name: "🤝 **SERI!**", value: `Uang dikembalikan **${amount.toLocaleString()}** credits!`, inline: false });
  }
  
  const newBalance = await getBalance(interaction.user.id);
  embed.setFooter({ text: `💰 Saldo sekarang: ${newBalance.toLocaleString()} credits` });
  
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("back_to_casino").setLabel("🎰 Kembali ke Casino").setStyle(ButtonStyle.Secondary)
  );
  
  return interaction.editReply({ embeds: [embed], components: [row] });
}

module.exports = { executeRPS };