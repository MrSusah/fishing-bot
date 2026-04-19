const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
  name: "casino",
  description: "Menampilkan menu casino dengan tombol interaktif",
  
  async execute(message, args, client) {
    const embed = new EmbedBuilder()
      .setTitle("🎰 **CASINO MENU** 🎰")
      .setDescription("**Pilih permainan kasino:**\n\n" +
        "🪙 **Coin Flip** - Tebak kepala/ekor (30% win chance)\n" +
        "✊ **RPS** - Rock Paper Scissors vs Bot\n" +
        "🎰 **Slots** - Slot machine dengan berbagai hadiah\n" +
        "🎡 **Roulette** - Taruhan pada angka/warna\n" +
        "🎲 **Dadu** - Tebak High/Low (1-6)\n" +
        "💣 **Bomb** - Cari harta karun hindari bom\n\n" +
        "🎣 **Fishing** - Mancing ikan di channel khusus\n\n" +
        "💡 **Cara bermain:** Klik tombol game lalu ikuti petunjuk command!")
      .setColor(0xffaa00)
      .setTimestamp()
      .setFooter({ text: `Diminta oleh ${message.author.username}`, iconURL: message.author.displayAvatarURL() });
    
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("casino_cf").setLabel("🪙 CF").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("casino_rps").setLabel("✊ RPS").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("casino_slots").setLabel("🎰 Slots").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("casino_roulette").setLabel("🎡 Roulette").setStyle(ButtonStyle.Secondary)
    );
    
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("casino_bomb").setLabel("💣 Bomb").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("casino_dadu").setLabel("🎲 Dadu").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("casino_fishing").setLabel("🎣 Fishing").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("back_to_game_menu").setLabel("🔙 Kembali").setStyle(ButtonStyle.Secondary)
    );
    
    return message.reply({ embeds: [embed], components: [row1, row2] });
  }
};