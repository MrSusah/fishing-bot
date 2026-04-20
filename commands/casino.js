const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'casino',
    description: 'Menu utama casino',
    
    async executePrefix(message, args, client) {
        const embed = new EmbedBuilder()
            .setColor('#ffd700')
            .setTitle('🎰 CASINO ROYALE 🎰')
            .setDescription('Pilih permainan casino di bawah ini!')
            .addFields(
                { name: '🪙 Coin Flip', value: 'Tebak kepala/ekor - 30% win chance (x2)', inline: true },
                { name: '✊ RPS', value: 'Rock Paper Scissors - Menang dapat x2', inline: true },
                { name: '🎰 Slots', value: 'Slot machine - Jackpot hingga x15', inline: true },
                { name: '🎡 Roulette', value: 'Tebak warna/nomor - x2 sampai x36', inline: true },
                { name: '🎲 Dice', value: 'Tebak High/Low - x2', inline: true }
            )
            .setFooter({ text: 'Semua game menggunakan credits | Gunakan !points untuk cek saldo' });

        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId("casino_cf").setLabel('🪙 Coin Flip').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("casino_rps").setLabel('✊ RPS').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("casino_slots").setLabel('🎰 Slots').setStyle(ButtonStyle.Primary)
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId("casino_roulette").setLabel('🎡 Roulette').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId("casino_dice").setLabel('🎲 Dice').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId("back_to_main_menu").setLabel('🔙 Kembali').setStyle(ButtonStyle.Secondary)
            );

        await message.reply({
            embeds: [embed],
            components: [row1, row2]
        });
    }
};