const { EmbedBuilder } = require('discord.js');
const economy = require('../utils/economy');
const channelValidator = require('../utils/channelValidator');

module.exports = {
    name: 'cf',
    description: 'Coin Flip game',
    
    async executePrefix(message, args, client) {
        console.log(`[CF] Command executed by ${message.author.username}`);
        
        // Validasi channel
        if (!channelValidator.validateCasinoChannel(message.channelId) && message.channelId !== channelValidator.TEST_CHANNEL_ID) {
            return message.reply(`❌ Game CF hanya bisa dimainkan di channel <#${channelValidator.CASINO_CHANNEL_ID}>!`);
        }
        
        if (args.length < 2) {
            return message.reply('❌ Usage: !cf <kepala/ekor> <amount>\nContoh: !cf kepala 100');
        }
        
        const choice = args[0].toLowerCase();
        if (choice !== 'kepala' && choice !== 'ekor') {
            return message.reply('❌ Pilihan harus "kepala" atau "ekor"!');
        }
        
        const bet = parseInt(args[1]);
        if (isNaN(bet) || bet <= 0) {
            return message.reply('❌ Taruhan harus berupa angka positif!');
        }
        
        const userId = message.author.id;
        const balance = await economy.getBalance(userId);
        
        console.log(`[CF] User ${message.author.username} balance: ${balance}, bet: ${bet}`);
        
        if (balance < bet) {
            return message.reply(`❌ Saldo tidak cukup! Kamu punya ${balance} credits`);
        }
        
        const winChance = Math.random() < 0.3;
        const result = Math.random() < 0.5 ? 'kepala' : 'ekor';
        const isWin = winChance && choice === result;
        const winAmount = isWin ? bet * 2 : 0;
        
        console.log(`[CF] Choice: ${choice}, Result: ${result}, Win: ${isWin}, WinAmount: ${winAmount}`);
        
        if (isWin) {
            const success = await economy.addCredits(userId, winAmount);
            console.log(`[CF] Add credits success: ${success}`);
        } else {
            const success = await economy.removeCredits(userId, bet);
            console.log(`[CF] Remove credits success: ${success}`);
        }
        
        const newBalance = await economy.getBalance(userId);
        
        const embed = new EmbedBuilder()
            .setColor(isWin ? '#00ff00' : '#ff0000')
            .setTitle('🪙 COIN FLIP 🪙')
            .addFields(
                { name: 'Pilihanmu', value: choice.toUpperCase(), inline: true },
                { name: 'Hasil', value: result.toUpperCase(), inline: true },
                { name: 'Status', value: isWin ? '✅ MENANG!' : '❌ KALAH!', inline: true },
                { name: 'Taruhan', value: `${bet} credits`, inline: true },
                { name: 'Hasil Akhir', value: isWin ? `+${winAmount} credits` : `-${bet} credits`, inline: true },
                { name: 'Saldo Akhir', value: `${newBalance} credits`, inline: true }
            )
            .setFooter({ text: message.author.username, iconURL: message.author.displayAvatarURL() });
        
        await message.reply({ embeds: [embed] });
        console.log(`[CF] Command completed for ${message.author.username}`);
    }
};