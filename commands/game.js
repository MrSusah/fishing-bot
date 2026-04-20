const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
  name: "game",
  description: "Menampilkan menu game dengan tombol interaktif",
  
  async execute(message, args, client) {
    const embed = new EmbedBuilder()
      .setTitle("🎮 **GAME MENU** 🎮")
      .setDescription("Pilih menu di bawah ini!\n\n💡 **Info:**\n• 100 credits = 1 point\n• Gunakan `!profile` untuk lihat profil\n• Gunakan `!points` untuk lihat points\n• Gunakan `!activity` untuk lihat aktivitas")
      .setColor(0x5865f2)
      .setTimestamp()
      .setFooter({ text: `Diminta oleh ${message.author.username}`, iconURL: message.author.displayAvatarURL() });
    
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("game_fishing").setLabel("🎣 Fishing").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("game_hunt").setLabel("🏹 Hunt").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("game_dungeon").setLabel("🏰 Dungeon").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("game_casino").setLabel("🎰 Casino").setStyle(ButtonStyle.Secondary)
    );
    
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("game_profile").setLabel("👤 Profile").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("game_activity").setLabel("📊 Activity").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("game_reward").setLabel("🎁 Reward").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("game_transfer").setLabel("💸 Transfer").setStyle(ButtonStyle.Danger)
    );
    
    const row3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("game_leaderboard").setLabel("🏆 Leaderboard").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("back_to_main_menu").setLabel("🔙 Menu Utama").setStyle(ButtonStyle.Secondary)
    );
    
    return message.reply({ embeds: [embed], components: [row1, row2, row3] });
  }
};