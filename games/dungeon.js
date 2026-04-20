const { EmbedBuilder } = require('discord.js');
const economy = require('../utils/economy');
const cooldown = require('../utils/cooldown');

const monsters = ['goblin', 'orc', 'troll', 'ogre', 'skeleton', 'zombie', 'hantu', 'vampire', 'werewolf', 'naga', 'cyclops', 'minotaur', 'chimera', 'griffin', 'hydra', 'phoenix', 'lich', 'demon', 'dragon', 'titan'];

async function executeDungeon(interaction, client) {
    await interaction.deferReply();
    
    const userId = interaction.user.id;
    const username = interaction.user.username;
    
    const result = await this.startDungeon(userId, username);
    
    if (result.error) {
        return interaction.editReply({ content: result.message });
    }
    
    await interaction.editReply({ embeds: [result.embed] });
}

async function startDungeon(userId, username) {
    // Cek cooldown 2 jam
    const cdCheck = await cooldown.checkCooldown(userId, 'dungeon', 7200000);
    if (!cdCheck.allowed) {
        return {
            error: true,
            message: `⏰ Cooldown! Kamu bisa masuk dungeon lagi ${cdCheck.timeLeft}`
        };
    }

    const monster = monsters[Math.floor(Math.random() * monsters.length)];
    const winChance = Math.random() < 0.4; // 40% win chance
    const reward = winChance ? Math.floor(Math.random() * 801) + 200 : 0; // 200-1000 credits

    if (winChance && reward > 0) {
        await economy.addCredits(userId, reward);
        await cooldown.setCooldown(userId, 'dungeon');
        
        const embed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setTitle('⚔️ KEMENANGAN EPIC! ⚔️')
            .setDescription(`Kamu memasuki dungeon dan bertemu **${monster}**... ⚔️\n\n✨ **BERHASIL MENGALAHKANNYA!** ✨\n+${reward} credits`)
            .setFooter({ text: username });
        
        return { embed, reward };
    } else {
        await cooldown.setCooldown(userId, 'dungeon');
        
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('💀 KEGAGALAN FATAL 💀')
            .setDescription(`Kamu memasuki dungeon dan bertemu **${monster}**... ⚔️\n\n💀 **KAMU DIKALAHKAN!** 💀\n+0 credits`)
            .setFooter({ text: username });
        
        return { embed, reward: 0 };
    }
}

module.exports = { executeDungeon, startDungeon };