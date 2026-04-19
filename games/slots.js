const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { addCredits, removeCredits, getBalance } = require("../utils/economy");

const SLOTS_EMOJIS = ["🍒", "🍋", "🍊", "🍉", "🎰", "💎", "🍇", "🔔", "🍓", "🥝"];
const SLOTS_MULTIPLIERS = {
  "🍒": { pair: 1.5, triple: 3 },
  "🍋": { pair: 1.5, triple: 3 },
  "🍊": { pair: 1.5, triple: 3.5 },
  "🍉": { pair: 1.5, triple: 4 },
  "🎰": { pair: 2, triple: 15 },
  "💎": { pair: 2, triple: 10 },
  "🍇": { pair: 1.5, triple: 3.5 },
  "🔔": { pair: 1.5, triple: 4 },
  "🍓": { pair: 1.5, triple: 3 },
  "🥝": { pair: 1.5, triple: 3 }
};

async function executeSlots(interaction, amount) {
  await interaction.deferReply({ flags: 64 });
  
  const balance = await getBalance(interaction.user.id);
  
  if (amount < 10) {
    return interaction.editReply({ content: "❌ Minimal taruhan adalah **10 credits**!" });
  }
  
  if (balance < amount) {
    return interaction.editReply({ content: `❌ Credit tidak cukup! Saldo: **${balance.toLocaleString()}** credits` });
  }
  
  const slot1 = SLOTS_EMOJIS[Math.floor(Math.random() * SLOTS_EMOJIS.length)];
  const slot2 = SLOTS_EMOJIS[Math.floor(Math.random() * SLOTS_EMOJIS.length)];
  const slot3 = SLOTS_EMOJIS[Math.floor(Math.random() * SLOTS_EMOJIS.length)];
  
  let multiplier = 0;
  let resultText = "";
  
  if (slot1 === slot2 && slot2 === slot3) {
    multiplier = SLOTS_MULTIPLIERS[slot1].triple;
    resultText = `🎉 **JACKPOT!** ${slot1}${slot2}${slot3} - x${multiplier}! 🎉`;
  } else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
    multiplier = SLOTS_MULTIPLIERS[slot1].pair;
    resultText = `✨ **PAIR!** ${slot1}${slot2}${slot3} - x${multiplier}! ✨`;
  } else {
    multiplier = 0;
    resultText = `💔 **KALAH!** ${slot1}${slot2}${slot3} - Tidak ada yang cocok.`;
  }
  
  let winAmount = 0;
  let embedColor = 0xff0000;
  
  if (multiplier > 0) {
    winAmount = Math.floor(amount * multiplier);
    await addCredits(interaction.user.id, winAmount, "slots");
    embedColor = 0x00ff00;
  } else {
    await removeCredits(interaction.user.id, amount, "slots");
    embedColor = 0xff0000;
  }
  
  const embed = new EmbedBuilder()
    .setTitle("🎰 **SLOT MACHINE** 🎰")
    .setColor(embedColor)
    .setDescription(`\`\`\`\n┌─────┬─────┬─────┐\n│ ${slot1}  │ ${slot2}   │ ${slot3}    │\n└─────┴─────┴─────┘\n\`\`\``)
    .addFields(
      { name: "📊 **Hasil**", value: resultText, inline: false },
      { name: "💰 **Taruhan**", value: `${amount.toLocaleString()} credits`, inline: true }
    )
    .setTimestamp();
  
  if (multiplier > 0) {
    embed.addFields({ name: "🎁 **Kemenangan**", value: `+${winAmount.toLocaleString()} credits (x${multiplier})`, inline: true });
  } else {
    embed.addFields({ name: "💸 **Kekalahan**", value: `-${amount.toLocaleString()} credits`, inline: true });
  }
  
  const newBalance = await getBalance(interaction.user.id);
  embed.setFooter({ text: `💰 Saldo sekarang: ${newBalance.toLocaleString()} credits` });
  
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("back_to_casino").setLabel("🎰 Kembali ke Casino").setStyle(ButtonStyle.Secondary)
  );
  
  return interaction.editReply({ embeds: [embed], components: [row] });
}

module.exports = { executeSlots };