const { EmbedBuilder } = require('discord.js');
const economy = require('../utils/economy');
const channelValidator = require('../utils/channelValidator');

const MAX_BET = 3000;

module.exports = {
    name: 'dadu',
    description: 'Dice High/Low game',
    
    async executePrefix(message, args, client) {
        console.log(`[DADU] Command executed by ${message.author.username}`);
        
        if (!channelValidator.validateCasinoChannel(message.channelId) && message.channelId !== channelValidator.TEST_CHANNEL_ID) {
            return message.reply(`❌ Game Dadu hanya bisa dimainkan di channel <#${channelValidator.CASINO_CHANNEL_ID}>!`);
        }
        
        if (args.length < 2) {
            return message.reply('❌ Usage: !dadu <high/low> <amount>\nContoh: !dadu high 100');
        }
        
        const choice = args[0].toLowerCase();
        if (choice !== 'high' && choice !== 'low') {
            return message.reply('❌ Pilihan harus "high" atau "low"!');
        }
        
        const amount = parseInt(args[1]);
        if (isNaN(amount) || amount <= 0) {
            return message.reply('❌ Taruhan harus berupa angka positif!');
        }
        
        if (amount > MAX_BET) {
            return message.reply(`❌ Maksimal taruhan adalah ${MAX_BET} credits!`);
        }
        
        const userId = message.author.id;
        const balance = await economy.getBalance(userId);
        
        if (balance < amount) {
            return message.reply(`❌ Saldo tidak cukup! Kamu punya ${balance} credits`);
        }
        
        const dice = Math.floor(Math.random() * 6) + 1;
        const isHigh = dice >= 4;
        const isWin = (choice === "high" && isHigh) || (choice === "low" && !isHigh);
        
        const diceEmojis = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
        
        if (isWin) {
            const winAmount = amount * 2;
            await economy.addCredits(userId, winAmount);
        } else {
            await economy.removeCredits(userId, amount);
        }
        
        const newBalance = await economy.getBalance(userId);
        
        const embed = new EmbedBuilder()
            .setTitle("🎲 **DADU HIGH/LOW** 🎲")
            .setColor(isWin ? 0x00ff00 : 0xff0000)
            .addFields(
                { name: "🎯 **Pilihan**", value: choice.toUpperCase(), inline: true },
                { name: "🎲 **Hasil Dadu**", value: `${diceEmojis[dice-1]} **${dice}**`, inline: true },
                { name: "📊 **Kategori**", value: dice >= 4 ? "HIGH" : "LOW", inline: true },
                { name: "💰 **Hasil**", value: isWin ? `✅ MENANG! +${amount * 2} credits` : `❌ KALAH! -${amount} credits`, inline: false },
                { name: "💎 **Saldo Akhir**", value: `${newBalance} credits`, inline: true }
            )
            .setFooter({ text: message.author.username, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();
        
        await message.reply({ embeds: [embed] });
    }
};