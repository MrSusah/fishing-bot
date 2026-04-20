const { EmbedBuilder } = require('discord.js');
const economy = require('../utils/economy');
const cooldown = require('../utils/cooldown');
const channelValidator = require('../utils/channelValidator');

const monsters = ['goblin', 'orc', 'troll', 'ogre', 'skeleton', 'zombie', 'hantu', 'vampire', 'werewolf', 'naga', 'cyclops', 'minotaur', 'chimera', 'griffin', 'hydra', 'phoenix', 'lich', 'demon', 'dragon', 'titan'];

module.exports = {
    name: 'dungeon',
    description: 'Bertarung melawan monster di dungeon',
    
    async executePrefix(message, args, client) {
        // Validasi channel hutan
        if (!channelValidator.validateHuntChannel(message.channelId)) {
            return message.reply(`❌ Game dungeon hanya bisa dimainkan di channel <#${channelValidator.HUNT_CHANNEL_ID}>!`);
        }
        
        const userId = message.author.id;
        const username = message.author.username;
        
        // Cek cooldown 2 jam
        const cdCheck = await cooldown.checkCooldown(userId, 'dungeon', 7200000);
        if (!cdCheck.allowed) {
            return message.reply(`⏰ Cooldown! Kamu bisa masuk dungeon lagi ${cdCheck.timeLeft}`);
        }
        
        const monster = monsters[Math.floor(Math.random() * monsters.length)];
        const winChance = Math.random() < 0.4;
        const reward = winChance ? Math.floor(Math.random() * 801) + 200 : 0;
        
        if (winChance && reward > 0) {
            await economy.addCredits(userId, reward);
            await cooldown.setCooldown(userId, 'dungeon');
            
            const embed = new EmbedBuilder()
                .setColor('#9b59b6')
                .setTitle('⚔️ KEMENANGAN EPIC! ⚔️')
                .setDescription(`Kamu memasuki dungeon dan bertemu **${monster}**... ⚔️\n\n✨ **BERHASIL MENGALAHKANNYA!** ✨\n+${reward} credits`)
                .setFooter({ text: username, iconURL: message.author.displayAvatarURL() });
            
            await message.reply({ embeds: [embed] });
        } else {
            await cooldown.setCooldown(userId, 'dungeon');
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('💀 KEGAGALAN FATAL 💀')
                .setDescription(`Kamu memasuki dungeon dan bertemu **${monster}**... ⚔️\n\n💀 **KAMU DIKALAHKAN!** 💀\n+0 credits`)
                .setFooter({ text: username, iconURL: message.author.displayAvatarURL() });
            
            await message.reply({ embeds: [embed] });
        }
    }
};