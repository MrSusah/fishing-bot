const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { addCredits, removeCredits, getBalance } = require("../utils/economy");

const MAX_BET = 3000;

async function executeDadu(interaction, choice, amount) {
  await interaction.deferReply({ flags: 64 });
  
  const balance = await getBalance(interaction.user.id);
  
  if (amount < 10) {
    return interaction.editReply({ content: "❌ Minimal taruhan adalah **10 credits**!" });
  }
  
  if (amount > MAX_BET) {
    return interaction.editReply({ content: `❌ Maksimal taruhan adalah **${MAX_BET.toLocaleString()}** credits!` });
  }
  
  if (balance < amount) {
    return interaction.editReply({ content: `❌ Credit tidak cukup! Saldo: **${balance.toLocaleString()}** credits` });
  }
  
  const validChoices = ["high", "low"];
  if (!validChoices.includes(choice.toLowerCase())) {
    return interaction.editReply({ content: "❌ Pilihan harus **high** atau **low**!" });
  }
  
  const dice = Math.floor(Math.random() * 6) + 1;
  const isHigh = dice >= 4;
  const isWin = (choice.toLowerCase() === "high" && isHigh) || (choice.toLowerCase() === "low" && !isHigh);
  
  const diceEmojis = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
  
  let embed = new EmbedBuilder()
    .setTitle("🎲 **DADU HIGH/LOW** 🎲")
    .setColor(isWin ? 0x00ff00 : 0xff0000)
    .addFields(
      { name: "🎯 **Pilihan**", value: choice.toUpperCase(), inline: true },
      { name: "🎲 **Hasil Dadu**", value: `${diceEmojis[dice-1]} **${dice}**`, inline: true },
      { name: "📊 **Kategori**", value: dice >= 4 ? "HIGH" : "LOW", inline: true }
    )
    .setTimestamp();
  
  if (isWin) {
    const winAmount = amount * 2;
    await addCredits(interaction.user.id, winAmount, "dadu");
    embed.addFields({ name: "✅ **MENANG!**", value: `Kamu menang **${winAmount.toLocaleString()}** credits!`, inline: false });
  } else {
    await removeCredits(interaction.user.id, amount, "dadu");
    embed.addFields({ name: "❌ **KALAH!**", value: `Kamu kehilangan **${amount.toLocaleString()}** credits!`, inline: false });
  }
  
  const newBalance = await getBalance(interaction.user.id);
  embed.setFooter({ text: `💰 Saldo sekarang: ${newBalance.toLocaleString()} credits` });
  
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("back_to_casino").setLabel("🎰 Kembali ke Casino").setStyle(ButtonStyle.Secondary)
  );
  
  return interaction.editReply({ embeds: [embed], components: [row] });
}

module.exports = { executeDadu };