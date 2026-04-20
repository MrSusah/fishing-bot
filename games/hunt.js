const { EmbedBuilder } = require('discord.js');
const economy = require('../utils/economy');
const cooldown = require('../utils/cooldown');
const channelValidator = require('../utils/channelValidator');

const animals = ['rusa', 'harimau', 'kelinci', 'beruang', 'serigala', 'babi hutan', 'kancil', 'buaya', 'ular', 'elang', 'kijang', 'macan tutul', 'gajah', 'badak', 'jerapah', 'zebra', 'singa', 'cheetah', 'kuda nil', 'komodo'];

module.exports = {
    name: 'hunt',
    description: 'Berburu hewan di hutan',
    
    async executePrefix(message, args, client) {
        // Validasi channel hutan
        if (!channelValidator.validateHuntChannel(message.channelId)) {
            return message.reply(`❌ Game hunt hanya bisa dimainkan di channel <#${channelValidator.HUNT_CHANNEL_ID}>!`);
        }
        
        const userId = message.author.id;
        const username = message.author.username;
        
        // Cek cooldown 1 jam
        const cdCheck = await cooldown.checkCooldown(userId, 'hunt', 3600000);
        if (!cdCheck.allowed) {
            return message.reply(`⏰ Cooldown! Kamu bisa berburu lagi ${cdCheck.timeLeft}`);
        }
        
        const animal = animals[Math.floor(Math.random() * animals.length)];
        const winChance = Math.random() < 0.6;
        const reward = winChance ? Math.floor(Math.random() * 151) + 50 : 0;
        
        if (winChance && reward > 0) {
            await economy.addCredits(userId, reward);
            await cooldown.setCooldown(userId, 'hunt');
            
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('🏹 PERBURUAN BERHASIL! 🏹')
                .setDescription(`Kamu berburu **${animal}**... 🏹\n\n✨ **BERHASIL!** ✨\n+${reward} credits`)
                .setFooter({ text: username, iconURL: message.author.displayAvatarURL() });
            
            await message.reply({ embeds: [embed] });
        } else {
            await cooldown.setCooldown(userId, 'hunt');
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('😔 PERBURUAN GAGAL 😔')
                .setDescription(`Kamu berburu **${animal}**... 🏹\n\n💔 **GAGAL!** 💔\n+0 credits`)
                .setFooter({ text: username, iconURL: message.author.displayAvatarURL() });
            
            await message.reply({ embeds: [embed] });
        }
    }
};