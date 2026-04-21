const { EmbedBuilder } = require('discord.js');
const economy = require('../utils/economy');
const channelValidator = require('../utils/channelValidator');

const symbols = ['🍒', '🍋', '🍊', '🍉', '🎰', '💎', '🍇', '🔔', '🍓', '🥝'];
const multipliers = {
    '🍒': 3, '🍋': 3, '🍊': 3, '🍉': 4, '🎰': 15,
    '💎': 10, '🍇': 3, '🔔': 5, '🍓': 3, '🥝': 3
};

module.exports = {
    name: 'slots',
    description: 'Slot machine game',
    
    async executePrefix(message, args, client) {
        if (!channelValidator.validateCasinoChannel(message.channelId) && message.channelId !== channelValidator.TEST_CHANNEL_ID) {
            return message.reply(`❌ Game Slots hanya bisa dimainkan di channel <#${channelValidator.CASINO_CHANNEL_ID}>!`);
        }
        
        if (args.length < 1) {
            return message.reply('❌ Usage: !slots <amount>\nContoh: !slots 100');
        }
        
        const bet = parseInt(args[0]);
        if (isNaN(bet) || bet <= 0) {
            return message.reply('❌ Taruhan harus berupa angka positif!');
        }
        
        const userId = message.author.id;
        const balance = await economy.getBalance(userId);
        
        if (balance < bet) {
            return message.reply(`❌ Saldo tidak cukup! Kamu punya ${balance} credits`);
        }
        
        const slot1 = symbols[Math.floor(Math.random() * symbols.length)];
        const slot2 = symbols[Math.floor(Math.random() * symbols.length)];
        const slot3 = symbols[Math.floor(Math.random() * symbols.length)];
        
        let multiplier = 0;
        let result = '';
        
        if (slot1 === slot2 && slot2 === slot3) {
            multiplier = multipliers[slot1];
            result = `JACKPOT! ${multiplier}x`;
        } else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
            multiplier = 1.5;
            result = 'PAIR! 1.5x';
        } else {
            multiplier = 0;
            result = 'KALAH! 0x';
        }
        
        const winAmount = Math.floor(bet * multiplier);
        
        if (winAmount > 0) {
            await economy.addCredits(userId, winAmount);
        } else {
            await economy.removeCredits(userId, bet);
        }
        
        const newBalance = await economy.getBalance(userId);
        
        const embed = new EmbedBuilder()
            .setColor(winAmount > 0 ? '#00ff00' : '#ff0000')
            .setTitle('🎰 SLOT MACHINE 🎰')
            .setDescription(`╔═══╗\n║ ${slot1} ║\n║ ${slot2} ║\n║ ${slot3} ║\n╚═══╝`)
            .addFields(
                { name: 'Hasil', value: result, inline: true },
                { name: 'Taruhan', value: `${bet} credits`, inline: true },
                { name: 'Kemenangan', value: winAmount > 0 ? `+${winAmount} credits` : `-${bet} credits`, inline: true },
                { name: 'Saldo Akhir', value: `${newBalance} credits`, inline: true }
            )
            .setFooter({ text: message.author.username, iconURL: message.author.displayAvatarURL() });
        
        await message.reply({ embeds: [embed] });
    }
};