// Wrapper untuk memanggil sistem fishing yang sudah ada di index.js
async function executeFishing(interaction, client) {
  const FISHING_CHANNELS = [
    "1492058905499402271",
    "1492077755322470530",
    "1492077857042862161",
    "1492077877301084351",
    "1492077899870765166"
  ];
  
  if (!FISHING_CHANNELS.includes(interaction.channelId)) {
    return interaction.reply({ 
      content: "❌ Channel ini bukan zona fishing! Gunakan channel fishing yang tersedia.\n\n📋 **Zona Fishing:**\n<#1492058905499402271> - Desa\n<#1492077755322470530> - Sungai\n<#1492077857042862161> - Laut\n<#1492077877301084351> - Es\n<#1492077899870765166> - Void", 
      flags: 64 
    });
  }
  
  // Trigger sistem fishing dengan membuat interaction tiruan
  const fakeInteraction = {
    ...interaction,
    customId: "menu_fish",
    reply: interaction.reply.bind(interaction),
    deferReply: interaction.deferReply.bind(interaction),
    editReply: interaction.editReply.bind(interaction),
    update: interaction.update?.bind(interaction)
  };
  
  // Cari handler fishing di client
  if (client.fishingHandler) {
    return client.fishingHandler(fakeInteraction);
  }
  
  // Jika tidak ada, beri instruksi
  return interaction.reply({
    content: "🎣 Gunakan command `!fishing` untuk membuka menu memancing!",
    flags: 64
  });
}

module.exports = { executeFishing };