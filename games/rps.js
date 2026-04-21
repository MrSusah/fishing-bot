const { EmbedBuilder } = require('discord.js');
const economy = require('../utils/economy');
const channelValidator = require('../utils/channelValidator');

const choices = ['rock', 'paper', 'scissors'];
const emojis = { rock: '🪨', paper: '📄', scissors: '✂️' };

module.exports = {
    name: 'rps',
    description: 'Rock Paper Scissors game',
    
    async executePrefix(message, args, client) {
        if (!channelValidator.validateCasinoChannel(message.channelId) && message.channelId !== channelValidator.TEST_CHANNEL_ID) {
            return message.reply(`❌ Game RPS hanya bisa dimainkan di channel <#${channelValidator.CASINO_CHANNEL_ID}>!`);
        }
        
        if (args.length < 2) {
            return message.reply('❌ Usage: !rps <rock/paper/scissors> <amount>\nContoh: !rps rock 100');
        }
        
        const playerChoice = args[0].toLowerCase();
        if (!choices.includes(playerChoice)) {
            return message.reply('❌ Pilihan harus rock, paper, atau scissors!');
        }
        
        const bet = parseInt(args[1]);
        if (isNaN(bet) || bet <= 0) {
            return message.reply('❌ Taruhan harus berupa angka positif!');
        }
        
        const userId = message.author.id;
        const balance = await economy.getBalance(userId);
        
        if (balance < bet) {
            return message.reply(`❌ Saldo tidak cukup! Kamu punya ${balance} credits`);
        }
        
        const botChoice = choices[Math.floor(Math.random() * choices.length)];
        let isWin = false;
        let isDraw = false;
        
        if (playerChoice === botChoice) {
            isDraw = true;
        } else if (
            (playerChoice === 'rock' && botChoice === 'scissors') ||
            (playerChoice === 'paper' && botChoice === 'rock') ||
            (playerChoice === 'scissors' && botChoice === 'paper')
        ) {
            isWin = true;
        }
        
        if (isWin) {
            await economy.addCredits(userId, bet);
        } else if (!isDraw) {
            await economy.removeCredits(userId, bet);
        }
        
        const newBalance = await economy.getBalance(userId);
        
        const embed = new EmbedBuilder()
            .setColor(isWin ? '#00ff00' : isDraw ? '#ffff00' : '#ff0000')
            .setTitle('✊ ROCK PAPER SCISSORS ✊')
            .addFields(
                { name: 'Kamu', value: `${emojis[playerChoice]} ${playerChoice.toUpperCase()}`, inline: true },
                { name: 'Bot', value: `${emojis[botChoice]} ${botChoice.toUpperCase()}`, inline: true },
                { name: 'Hasil', value: isWin ? '✅ MENANG!' : isDraw ? '🤝 SERI!' : '❌ KALAH!', inline: true },
                { name: 'Taruhan', value: `${bet} credits`, inline: true },
                { name: 'Hasil Akhir', value: isWin ? `+${bet} credits` : isDraw ? '+0 credits' : `-${bet} credits`, inline: true },
                { name: 'Saldo Akhir', value: `${newBalance} credits`, inline: true }
            )
            .setFooter({ text: message.author.username, iconURL: message.author.displayAvatarURL() });
        
        await message.reply({ embeds: [embed] });
    }
};