const { EmbedBuilder } = require('discord.js');
const economy = require('../utils/economy');
const cooldown = require('../utils/cooldown');

const animals = ['rusa', 'harimau', 'kelinci', 'beruang', 'serigala', 'babi hutan', 'kancil', 'buaya', 'ular', 'elang', 'kijang', 'macan tutul', 'gajah', 'badak', 'jerapah', 'zebra', 'singa', 'cheetah', 'kuda nil', 'komodo'];

async function executeHunt(interaction, client) {
    await interaction.deferReply();
    
    const userId = interaction.user.id;
    const username = interaction.user.username;
    
    const result = await this.startHunt(userId, username);
    
    if (result.error) {
        return interaction.editReply({ content: result.message });
    }
    
    await interaction.editReply({ embeds: [result.embed] });
}

async function startHunt(userId, username) {
    // Cek cooldown 1 jam
    const cdCheck = await cooldown.checkCooldown(userId, 'hunt', 3600000);
    if (!cdCheck.allowed) {
        return {
            error: true,
            message: `⏰ Cooldown! Kamu bisa berburu lagi ${cdCheck.timeLeft}`
        };
    }

    const animal = animals[Math.floor(Math.random() * animals.length)];
    const winChance = Math.random() < 0.6; // 60% win chance
    const reward = winChance ? Math.floor(Math.random() * 151) + 50 : 0; // 50-200 credits

    if (winChance && reward > 0) {
        await economy.addCredits(userId, reward);
        await cooldown.setCooldown(userId, 'hunt');
        
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🏹 PERBURUAN BERHASIL! 🏹')
            .setDescription(`Kamu berburu **${animal}**... 🏹\n\n✨ **BERHASIL!** ✨\n+${reward} credits`)
            .setFooter({ text: username });
        
        return { embed, reward };
    } else {
        await cooldown.setCooldown(userId, 'hunt');
        
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('😔 PERBURUAN GAGAL 😔')
            .setDescription(`Kamu berburu **${animal}**... 🏹\n\n💔 **GAGAL!** 💔\n+0 credits`)
            .setFooter({ text: username });
        
        return { embed, reward: 0 };
    }
}

module.exports = { executeHunt, startHunt };