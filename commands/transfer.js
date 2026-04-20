// Tambahkan fungsi transfer dengan modal (popup input)
async function showTransferModal(interaction) {
    const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
    
    const modal = new ModalBuilder()
        .setCustomId('transfer_modal')
        .setTitle('💸 Transfer Credits');
    
    const userInput = new TextInputBuilder()
        .setCustomId('target_user')
        .setLabel('User ID atau Mention (contoh: 756609192277835858)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Masukkan User ID atau @username')
        .setRequired(true);
    
    const amountInput = new TextInputBuilder()
        .setCustomId('amount')
        .setLabel('Jumlah Credits')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Minimal 100 credits')
        .setRequired(true);
    
    const row1 = new ActionRowBuilder().addComponents(userInput);
    const row2 = new ActionRowBuilder().addComponents(amountInput);
    modal.addComponents(row1, row2);
    
    await interaction.showModal(modal);
}

// Handler untuk modal transfer
async function handleTransferModal(interaction, client) {
    const targetId = interaction.fields.getTextInputValue('target_user');
    const amount = parseInt(interaction.fields.getTextInputValue('amount'));
    
    // Extract user ID dari mention jika ada
    let userId = targetId;
    const mentionMatch = targetId.match(/<@!?(\d+)>/);
    if (mentionMatch) {
        userId = mentionMatch[1];
    }
    
    if (isNaN(amount) || amount < 100) {
        return interaction.reply({ content: "❌ Jumlah harus angka dan minimal 100 credits!", flags: 64 });
    }
    
    if (userId === interaction.user.id) {
        return interaction.reply({ content: "❌ Tidak bisa transfer ke diri sendiri!", flags: 64 });
    }
    
    const { User } = require("../database/mongo");
    
    try {
        const sender = await User.findOne({ userId: interaction.user.id });
        const receiver = await User.findOne({ userId: userId });
        
        if (!sender || sender.credits < amount) {
            return interaction.reply({ content: `❌ Credit tidak cukup! Saldo: ${sender?.credits?.toLocaleString() || 0} credits`, flags: 64 });
        }
        
        // Transfer
        await User.updateOne(
            { userId: interaction.user.id },
            { $inc: { credits: -amount } }
        );
        
        await User.updateOne(
            { userId: userId },
            { $inc: { credits: amount } },
            { upsert: true }
        );
        
        // Dapatkan username penerima
        let receiverName = userId;
        try {
            const user = await client.users.fetch(userId);
            receiverName = user.username;
        } catch {}
        
        const embed = new EmbedBuilder()
            .setTitle("✅ **TRANSFER BERHASIL**")
            .setColor(0x00ff00)
            .addFields(
                { name: "📤 Pengirim", value: interaction.user.username, inline: true },
                { name: "📥 Penerima", value: receiverName, inline: true },
                { name: "💰 Jumlah", value: `${amount.toLocaleString()} credits`, inline: true }
            )
            .setTimestamp();
        
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("back_to_game_menu").setLabel("🔙 Kembali ke Menu").setStyle(ButtonStyle.Secondary)
        );
        
        return interaction.reply({ embeds: [embed], components: [row] });
        
    } catch (error) {
        console.error("Transfer error:", error);
        return interaction.reply({ content: "❌ Terjadi kesalahan saat transfer! Pastikan User ID valid.", flags: 64 });
    }
}

// Update handleGameButton untuk transfer
if (customId === "game_transfer") {
    return showTransferModal(interaction);
}