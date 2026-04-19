const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

// Sistem fishing - Memanggil sistem fishing yang sudah ada di index.js
async function executeFishing(interaction, client) {
  const FISHING_CHANNELS = [
    "1492058905499402271",
    "1492077755322470530",
    "1492077857042862161",
    "1492077877301084351",
    "1492077899870765166"
  ];
  
  // Cek apakah di channel fishing
  if (!FISHING_CHANNELS.includes(interaction.channelId)) {
    return interaction.reply({ 
      content: "❌ Channel ini bukan zona fishing! Gunakan channel fishing yang tersedia.\n\n📋 **Zona Fishing:**\n<#1492058905499402271> - Desa\n<#1492077755322470530> - Sungai\n<#1492077857042862161> - Laut\n<#1492077877301084351> - Es\n<#1492077899870765166> - Void", 
      flags: 64 
    });
  }
  
  // Kirim tombol fishing
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("menu_fish")
      .setLabel("🎣 Mulai Mancing")
      .setStyle(ButtonStyle.Primary)
  );
  
  return interaction.reply({
    content: "🎣 **SISTEM MANCING** 🎣\n\nKlik tombol di bawah untuk mulai memancing!",
    components: [row],
    flags: 64
  });
}

module.exports = { executeFishing };