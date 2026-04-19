const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { addCredits, getUser } = require("../utils/economy");
const { checkCooldown, updateCooldown, formatCooldown } = require("../utils/cooldown");

const MONSTERS = [
  "goblin", "orc", "troll", "ogre", "skeleton", "zombie", "hantu", 
  "vampire", "werewolf", "naga", "cyclops", "minotaur", "chimera", 
  "griffin", "hydra", "phoenix", "lich", "demon", "dragon", "titan"
];

async function executeDungeon(interaction) {
  await interaction.deferReply({ flags: 64 });
  
  const cooldown = await checkCooldown(interaction.user.id, "dungeon");
  if (!cooldown.available) {
    const timeLeft = await formatCooldown(cooldown.timeLeft);
    return interaction.editReply({ 
      content: `⏳ **Cooldown!** Kamu harus menunggu **${timeLeft}** sebelum masuk dungeon lagi.` 
    });
  }
  
  const monster = MONSTERS[Math.floor(Math.random() * MONSTERS.length)];
  const isWin = Math.random() < 0.4;
  
  let embed = new EmbedBuilder()
    .setTitle("⚔️ **DUNGEON** ⚔️")
    .setColor(isWin ? 0x00ff00 : 0xff0000)
    .setDescription(`Kamu memasuki dungeon dan bertemu ${monster}... ⚔️`)
    .setTimestamp();
  
  if (isWin) {
    const reward = Math.floor(Math.random() * (2000 - 200 + 1)) + 200;
    await addCredits(interaction.user.id, reward, "dungeon");
    await updateCooldown(interaction.user.id, "dungeon");
    
    embed.addFields(
      { name: "✅ **BERHASIL!**", value: `Kamu berhasil mengalahkan **${monster}**!`, inline: false },
      { name: "💰 **Hadiah**", value: `+${reward.toLocaleString()} credits`, inline: true }
    );
  } else {
    await updateCooldown(interaction.user.id, "dungeon");
    embed.addFields(
      { name: "❌ **GAGAL!**", value: `${monster} mengalahkanmu...`, inline: false },
      { name: "💰 **Hadiah**", value: `0 credits`, inline: true }
    );
  }
  
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("back_to_game_menu").setLabel("🔙 Kembali").setStyle(ButtonStyle.Secondary)
  );
  
  return interaction.editReply({ embeds: [embed], components: [row] });
}

module.exports = { executeDungeon };