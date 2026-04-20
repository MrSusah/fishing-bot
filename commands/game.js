const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const economy = require('../utils/economy');
const cooldown = require('../utils/cooldown');
const channelValidator = require('../utils/channelValidator');

module.exports = {
    name: 'game',
    description: 'Menu utama game',
    
    async executePrefix(message, args, client) {
        const allowedChannelId = '1494682289530081413';
        if (message.channelId !== allowedChannelId) {
            return message.reply(`❌ Game hanya bisa dijalankan di channel <#${allowedChannelId}>!`);
        }

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🎮 Pilih Game')
            .setDescription('Klik tombol di bawah untuk memulai game!')
            .setFooter({ text: message.author.username, iconURL: message.author.displayAvatarURL() });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`game_fishing_${message.author.id}`)
                    .setLabel('🎣 Fishing')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`game_hunt_${message.author.id}`)
                    .setLabel('🏹 Hunt')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`game_dungeon_${message.author.id}`)
                    .setLabel('🏰 Dungeon')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(`game_casino_${message.author.id}`)
                    .setLabel('🎰 Casino')
                    .setStyle(ButtonStyle.Secondary)
            );

        await message.reply({
            embeds: [embed],
            components: [row]
        });
    }
};