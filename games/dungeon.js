const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const economy = require('../utils/economy');
const cooldown = require('../utils/cooldown');
const channelValidator = require('../utils/channelValidator');

const monsters = ['goblin', 'orc', 'troll', 'ogre', 'skeleton', 'zombie', 'hantu', 'vampire', 'werewolf', 'naga', 'cyclops', 'minotaur', 'chimera', 'griffin', 'hydra', 'phoenix', 'lich', 'demon', 'dragon', 'titan'];

module.exports = {
    name: 'dungeon',
    description: 'Bertarung melawan monster di dungeon',
    
    async showGameMenu(interaction) {
        if (!channelValidator.validateHuntChannel(interaction.channel.id)) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Channel Tidak Valid')
                .setDescription(`Game dungeon hanya bisa dimainkan di channel <#${channelValidator.HUNT_CHANNEL_ID}>!`);
            
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("back_to_main_menu").setLabel("🔙 Kembali").setStyle(ButtonStyle.Secondary)
            );
            
            return interaction.reply({ embeds: [embed], components: [row], flags: 64 });
        }
        
        const embed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setTitle('🏰 **DUNGEON** 🏰')
            .setDescription('Jelajahi dungeon dan lawan monster!')
            .addFields(
                { name: '💰 Reward', value: '200-1000 credits', inline: true },
                { name: '🎯 Win Chance', value: '40%', inline: true },
                { name: '⏰ Cooldown', value: '2 jam', inline: true }
            );
        
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("play_dungeon").setLabel("🏰 Mulai Dungeon").setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId("back_to_main_menu").setLabel("🔙 Kembali").setStyle(ButtonStyle.Secondary)
        );
        
        return interaction.reply({ embeds: [embed], components: [row], flags: 64 });
    },
    
    async executeGame(interaction) {
        if (!channelValidator.validateHuntChannel(interaction.channel.id)) {
            return interaction.reply({ 
                content: `❌ Game dungeon hanya bisa dimainkan di channel <#${channelValidator.HUNT_CHANNEL_ID}>!`,
                flags: 64 
            });
        }
        
        const userId = interaction.user.id;
        const username = interaction.user.username;
        
        const cdCheck = await cooldown.checkCooldown(userId, 'dungeon', 7200000);
        if (!cdCheck.allowed) {
            return interaction.reply({ content: `⏰ Cooldown! Kamu bisa masuk dungeon lagi ${cdCheck.timeLeft}`, flags: 64 });
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
                .setFooter({ text: username, iconURL: interaction.user.displayAvatarURL() });
            
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("play_dungeon").setLabel("🏰 Dungeon Lagi").setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId("back_to_main_menu").setLabel("🔙 Kembali").setStyle(ButtonStyle.Secondary)
            );
            
            return interaction.reply({ embeds: [embed], components: [row], flags: 64 });
        } else {
            await cooldown.setCooldown(userId, 'dungeon');
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('💀 KEGAGALAN FATAL 💀')
                .setDescription(`Kamu memasuki dungeon dan bertemu **${monster}**... ⚔️\n\n💀 **KAMU DIKALAHKAN!** 💀\n+0 credits`)
                .setFooter({ text: username, iconURL: interaction.user.displayAvatarURL() });
            
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("play_dungeon").setLabel("🏰 Dungeon Lagi").setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId("back_to_main_menu").setLabel("🔙 Kembali").setStyle(ButtonStyle.Secondary)
            );
            
            return interaction.reply({ embeds: [embed], components: [row], flags: 64 });
        }
    },
    
    async executePrefix(message, args, client) {
        if (!channelValidator.validateHuntChannel(message.channelId)) {
            return message.reply(`❌ Game dungeon hanya bisa dimainkan di channel <#${channelValidator.HUNT_CHANNEL_ID}>!`);
        }
        
        const userId = message.author.id;
        
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
            return message.reply(`⚔️ **BERHASIL!** Kamu mengalahkan ${monster} dan mendapat ${reward} credits!`);
        } else {
            await cooldown.setCooldown(userId, 'dungeon');
            return message.reply(`💀 **GAGAL!** Kamu dikalahkan oleh ${monster} dan tidak mendapat apa-apa.`);
        }
    }
};