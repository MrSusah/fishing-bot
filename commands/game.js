const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
  name: "game",
  description: "Menampilkan menu game dengan tombol interaktif",
  
  async execute(message, args, client) {
    const embed = new EmbedBuilder()
      .setTitle("🎮 **GAME MENU** 🎮")
      .setDescription("Pilih game yang ingin dimainkan!")
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
      new ButtonBuilder().setCustomId("back_to_main_menu").setLabel("🔙 Menu Utama").setStyle(ButtonStyle.Secondary)
    );
    
    return message.reply({ embeds: [embed], components: [row1, row2] });
  }
};