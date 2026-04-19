const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { addCredits, removeCredits, getBalance } = require("../utils/economy");

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

function getNumberColor(number) {
  if (number === 0) return "green";
  if (RED_NUMBERS.includes(number)) return "red";
  return "black";
}

async function executeRoulette(interaction, side, amount) {
  await interaction.deferReply({ flags: 64 });
  
  const balance = await getBalance(interaction.user.id);
  
  if (amount < 10) {
    return interaction.editReply({ content: "❌ Minimal taruhan adalah **10 credits**!" });
  }
  
  if (balance < amount) {
    return interaction.editReply({ content: `❌ Credit tidak cukup! Saldo: **${balance.toLocaleString()}** credits` });
  }
  
  const result = Math.floor(Math.random() * 37);
  const resultColor = getNumberColor(result);
  const isEven = result > 0 && result % 2 === 0;
  const isOdd = result > 0 && result % 2 === 1;
  
  let multiplier = 0;
  let winText = "";
  const sideLower = side.toLowerCase();
  
  if (sideLower === "red" && resultColor === "red") {
    multiplier = 2;
    winText = "Merah!";
  } else if (sideLower === "black" && resultColor === "black") {
    multiplier = 2;
    winText = "Hitam!";
  } else if (sideLower === "green" && result === 0) {
    multiplier = 17;
    winText = "Hijau (0)!";
  } else if (sideLower === "odd" && isOdd) {
    multiplier = 2;
    winText = "Ganjil!";
  } else if (sideLower === "even" && isEven) {
    multiplier = 2;
    winText = "Genap!";
  } else if (!isNaN(parseInt(sideLower)) && parseInt(sideLower) === result) {
    multiplier = 36;
    winText = `Nomor ${result}!`;
  }
  
  let embed = new EmbedBuilder()
    .setTitle("🎡 **ROULETTE** 🎡")
    .setColor(multiplier > 0 ? 0x00ff00 : 0xff0000)
    .addFields(
      { name: "🎲 **Taruhan**", value: side.toUpperCase(), inline: true },
      { name: "🎯 **Hasil**", value: result.toString(), inline: true },
      { name: "🎨 **Warna**", value: resultColor.toUpperCase(), inline: true }
    )
    .setTimestamp();
  
  if (multiplier > 0) {
    const winAmount = amount * multiplier;
    await addCredits(interaction.user.id, winAmount, "roulette");
    embed.addFields({ name: "✅ **MENANG!**", value: `${winText} Kamu menang **${winAmount.toLocaleString()}** credits! (x${multiplier})`, inline: false });
  } else {
    await removeCredits(interaction.user.id, amount, "roulette");
    embed.addFields({ name: "❌ **KALAH!**", value: `Kamu kehilangan **${amount.toLocaleString()}** credits!`, inline: false });
  }
  
  const newBalance = await getBalance(interaction.user.id);
  embed.setFooter({ text: `💰 Saldo sekarang: ${newBalance.toLocaleString()} credits` });
  
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("back_to_casino").setLabel("🎰 Kembali ke Casino").setStyle(ButtonStyle.Secondary)
  );
  
  return interaction.editReply({ embeds: [embed], components: [row] });
}

module.exports = { executeRoulette };