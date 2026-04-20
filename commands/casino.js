const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'casino',
    description: 'Menu utama casino',
    
    async executePrefix(message, args, client) {
        const allowedChannelId = '1494682289530081413';
        if (message.channelId !== allowedChannelId) {
            return message.reply(`❌ Casino hanya bisa dijalankan di channel <#${allowedChannelId}>!`);
        }

        const embed = new EmbedBuilder()
            .setColor('#ffd700')
            .setTitle('🎰 CASINO ROYALE 🎰')
            .setDescription('Pilih permainan casino di bawah ini!')
            .addFields(
                { name: '🪙 Coin Flip', value: '!cf <kepala/ekor> <amount> - 30% win chance', inline: true },
                { name: '🎣 Fishing', value: '!fishing - Mancing ikan', inline: true },
                { name: '✊ RPS', value: '!rps <rock/paper/scissors> <amount>', inline: true },
                { name: '🎰 Slots', value: '!slots <amount> - Slot machine', inline: true },
                { name: '🎡 Roulette', value: '!roulette <amount> <red/black/green/odd/even/number>', inline: true },
                { name: '💣 Bomb', value: '!bomb <amount> - Mines game', inline: true },
                { name: '🎲 Dice', value: '!dadu <high/low> <amount> - Max 1000', inline: true }
            )
            .setFooter({ text: 'Gunakan command yang tertera untuk bermain!' });

        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`casino_cf_${message.author.id}`)
                    .setLabel('🪙 Coin Flip')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`casino_fishing_${message.author.id}`)
                    .setLabel('🎣 Fishing')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`casino_rps_${message.author.id}`)
                    .setLabel('✊ RPS')
                    .setStyle(ButtonStyle.Primary)
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`casino_slots_${message.author.id}`)
                    .setLabel('🎰 Slots')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`casino_roulette_${message.author.id}`)
                    .setLabel('🎡 Roulette')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`casino_bomb_${message.author.id}`)
                    .setLabel('💣 Bomb')
                    .setStyle(ButtonStyle.Danger)
            );

        const row3 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`casino_dice_${message.author.id}`)
                    .setLabel('🎲 Dice')
                    .setStyle(ButtonStyle.Secondary)
            );

        await message.reply({
            embeds: [embed],
            components: [row1, row2, row3]
        });
    }
};