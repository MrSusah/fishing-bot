const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { addCredits, getUser } = require("../utils/economy");
const { checkCooldown, updateCooldown, formatCooldown } = require("../utils/cooldown");

const ANIMALS = [
  "rusa", "harimau", "kelinci", "beruang", "serigala", "babi hutan", "kancil", 
  "buaya", "ular", "elang", "kijang", "macan tutul", "gajah", "badak", 
  "jerapah", "zebra", "singa", "cheetah", "kuda nil", "komodo"
];

async function executeHunt(interaction) {
  await interaction.deferReply();
  
  const cooldown = await checkCooldown(interaction.user.id, "hunt");
  if (!cooldown.available) {
    const timeLeft = await formatCooldown(cooldown.timeLeft);
    return interaction.editReply({ 
      content: `⏳ **Cooldown!** Kamu harus menunggu **${timeLeft}** sebelum berburu lagi.` 
    });
  }
  
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const isWin = Math.random() < 0.6;
  
  let embed = new EmbedBuilder()
    .setTitle("🏹 **PERBURUAN** 🏹")
    .setColor(isWin ? 0x00ff00 : 0xff0000)
    .setDescription(`Kamu berburu ${animal}... 🏹`)
    .setTimestamp();
  
  if (isWin) {
    const reward = Math.floor(Math.random() * (500 - 50 + 1)) + 50;
    await addCredits(interaction.user.id, reward, "hunt");
    await updateCooldown(interaction.user.id, "hunt");
    
    embed.addFields(
      { name: "✅ **BERHASIL!**", value: `Kamu berhasil menangkap **${animal}**!`, inline: false },
      { name: "💰 **Hadiah**", value: `+${reward.toLocaleString()} credits`, inline: true }
    );
  } else {
    await updateCooldown(interaction.user.id, "hunt");
    embed.addFields(
      { name: "❌ **GAGAL!**", value: `${animal} berhasil melarikan diri...`, inline: false },
      { name: "💰 **Hadiah**", value: `0 credits`, inline: true }
    );
  }
  
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("back_to_game_menu").setLabel("🔙 Kembali").setStyle(ButtonStyle.Secondary)
  );
  
  return interaction.editReply({ embeds: [embed], components: [row] });
}

module.exports = { executeHunt };