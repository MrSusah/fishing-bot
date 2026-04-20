const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'game',
    description: 'Menu utama game',
    
    async executePrefix(message, args, client) {
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🎮 **TIANYU BOT - MAIN MENU** 🎮')
            .setDescription('Selamat datang! Pilih kategori di bawah ini:')
            .addFields(
                { name: '🎣 **Fishing**', value: 'Mancing ikan di berbagai zona', inline: true },
                { name: '🏹 **Hunt**', value: 'Berburu hewan di hutan (Cooldown: 1 jam)', inline: true },
                { name: '🏰 **Dungeon**', value: 'Jelajahi dungeon lawan monster (Cooldown: 2 jam)', inline: true },
                { name: '🎰 **Casino**', value: 'Coin Flip, RPS, Slots, Roulette, Dice', inline: true },
                { name: '━━━━━━━━━━', value: '━━━━━━━━━━━━━━━━━━', inline: false },
                { name: '👤 **Profile**', value: 'Lihat profil dan stats kamu', inline: true },
                { name: '🎁 **Reward**', value: 'Klaim reward harian/mingguan', inline: true },
                { name: '📊 **Activity**', value: 'Lihat aktivitas dan leaderboard', inline: true },
                { name: '🏆 **Fishing LB**', value: 'Leaderboard fishing credits', inline: true },
                { name: '⭐ **Points LB**', value: 'Leaderboard points', inline: true }
            )
            .setFooter({ text: 'Gunakan !command untuk perintah cepat' })
            .setTimestamp();

        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId("menu_fishing").setLabel('🎣 Fishing').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("menu_hunt").setLabel('🏹 Hunt').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId("menu_dungeon").setLabel('🏰 Dungeon').setStyle(ButtonStyle.Danger)
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId("menu_casino").setLabel('🎰 Casino').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("menu_profile").setLabel('👤 Profile').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("menu_reward").setLabel('🎁 Reward').setStyle(ButtonStyle.Success)
            );

        const row3 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId("menu_activity").setLabel('📊 Activity').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("menu_fishing_lb").setLabel('🏆 Fishing LB').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("menu_points_lb").setLabel('⭐ Points LB').setStyle(ButtonStyle.Primary)
            );

        await message.reply({
            embeds: [embed],
            components: [row1, row2, row3]
        });
    }
};