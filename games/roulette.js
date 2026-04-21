const { EmbedBuilder } = require('discord.js');
const economy = require('../utils/economy');
const channelValidator = require('../utils/channelValidator');

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

function getNumberColor(number) {
    if (number === 0) return "green";
    if (RED_NUMBERS.includes(number)) return "red";
    return "black";
}

module.exports = {
    name: 'roulette',
    description: 'Roulette game',
    
    async executePrefix(message, args, client) {
        if (!channelValidator.validateCasinoChannel(message.channelId) && message.channelId !== channelValidator.TEST_CHANNEL_ID) {
            return message.reply(`❌ Game Roulette hanya bisa dimainkan di channel <#${channelValidator.CASINO_CHANNEL_ID}>!`);
        }
        
        if (args.length < 2) {
            return message.reply('❌ Usage: !roulette <amount> <red/black/green/odd/even/number>\nContoh: !roulette 100 red');
        }
        
        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount <= 0) {
            return message.reply('❌ Taruhan harus berupa angka positif!');
        }
        
        const side = args[1].toLowerCase();
        
        const userId = message.author.id;
        const balance = await economy.getBalance(userId);
        
        if (balance < amount) {
            return message.reply(`❌ Saldo tidak cukup! Kamu punya ${balance} credits`);
        }
        
        const result = Math.floor(Math.random() * 37);
        const resultColor = getNumberColor(result);
        const isEven = result > 0 && result % 2 === 0;
        const isOdd = result > 0 && result % 2 === 1;
        
        let multiplier = 0;
        let winText = "";
        
        if (side === "red" && resultColor === "red") {
            multiplier = 2;
            winText = "Merah!";
        } else if (side === "black" && resultColor === "black") {
            multiplier = 2;
            winText = "Hitam!";
        } else if (side === "green" && result === 0) {
            multiplier = 17;
            winText = "Hijau (0)!";
        } else if (side === "odd" && isOdd) {
            multiplier = 2;
            winText = "Ganjil!";
        } else if (side === "even" && isEven) {
            multiplier = 2;
            winText = "Genap!";
        } else if (!isNaN(parseInt(side)) && parseInt(side) === result) {
            multiplier = 36;
            winText = `Nomor ${result}!`;
        }
        
        let embed = new EmbedBuilder()
            .setTitle("🎡 **ROULETTE** 🎡")
            .setColor(multiplier > 0 ? 0x00ff00 : 0xff0000)
            .addFields(
                { name: "🎲 **Taruhan**", value: side.toUpperCase(), inline: true },
                { name: "🎯 **Hasil**", value: result.toString(), inline: true },
                { name: "🎨 **Warna**", value: resultColor.toUpperCase(), inline: true }
            )
            .setTimestamp();
        
        if (multiplier > 0) {
            const winAmount = amount * multiplier;
            await economy.addCredits(userId, winAmount);
            embed.addFields({ name: "✅ **MENANG!**", value: `${winText} Kamu menang **${winAmount.toLocaleString()}** credits! (x${multiplier})`, inline: false });
        } else {
            await economy.removeCredits(userId, amount);
            embed.addFields({ name: "❌ **KALAH!**", value: `Kamu kehilangan **${amount.toLocaleString()}** credits!`, inline: false });
        }
        
        const newBalance = await economy.getBalance(userId);
        embed.setFooter({ text: `💰 Saldo sekarang: ${newBalance.toLocaleString()} credits` });
        
        await message.reply({ embeds: [embed] });
    }
};