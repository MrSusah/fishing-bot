const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'casino',
    description: 'Menu utama casino',
    
    async executePrefix(message, args, client) {
        const embed = new EmbedBuilder()
            .setColor('#ffd700')
            .setTitle('🎰 CASINO ROYALE 🎰')
            .setDescription('Pilih permainan casino di bawah ini:')
            .addFields(
                { name: '🪙 Coin Flip', value: '`!cf kepala 100` atau `!cf ekor 100`', inline: true },
                { name: '✊ RPS', value: '`!rps rock 100` / `!rps paper 100` / `!rps scissors 100`', inline: true },
                { name: '🎰 Slots', value: '`!slots 100`', inline: true },
                { name: '🎡 Roulette', value: '`!roulette 100 red` / `!roulette 100 black` / `!roulette 100 7`', inline: true },
                { name: '🎲 Dice', value: '`!dadu high 100` atau `!dadu low 100`', inline: true }
            )
            .setFooter({ text: 'Semua game menggunakan credits | Cek saldo dengan !points' });

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