const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const economy = require('../utils/economy');
const cooldown = require('../utils/cooldown');
const channelValidator = require('../utils/channelValidator');

const animals = ['rusa', 'harimau', 'kelinci', 'beruang', 'serigala', 'babi hutan', 'kancil', 'buaya', 'ular', 'elang', 'kijang', 'macan tutul', 'gajah', 'badak', 'jerapah', 'zebra', 'singa', 'cheetah', 'kuda nil', 'komodo'];

module.exports = {
    name: 'hunt',
    description: 'Berburu hewan di hutan',
    
    async showGameMenu(interaction) {
        if (!channelValidator.validateHuntChannel(interaction.channel.id)) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Channel Tidak Valid')
                .setDescription(`Game hunt hanya bisa dimainkan di channel <#${channelValidator.HUNT_CHANNEL_ID}>!`)
                .setFooter({ text: "Kembali ke menu utama untuk memilih game lain" });
            
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("back_to_main_menu").setLabel("🔙 Kembali ke Menu Utama").setStyle(ButtonStyle.Secondary)
            );
            
            if (interaction.deferred || interaction.replied) {
                return interaction.editReply({ embeds: [embed], components: [row] });
            }
            return interaction.reply({ embeds: [embed], components: [row], flags: 64 });
        }
        
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🏹 **HUNT** 🏹')
            .setDescription('Berburu hewan di hutan!')
            .addFields(
                { name: '💰 Reward', value: '50-200 credits', inline: true },
                { name: '🎯 Win Chance', value: '60%', inline: true },
                { name: '⏰ Cooldown', value: '1 jam', inline: true }
            )
            .setFooter({ text: 'Klik tombol di bawah untuk berburu!' });
        
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("play_hunt").setLabel("🏹 Mulai Hunt").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId("back_to_main_menu").setLabel("🔙 Kembali").setStyle(ButtonStyle.Secondary)
        );
        
        if (interaction.deferred || interaction.replied) {
            return interaction.editReply({ embeds: [embed], components: [row] });
        }
        return interaction.reply({ embeds: [embed], components: [row], flags: 64 });
    },
    
    async executeGame(interaction) {
        if (!channelValidator.validateHuntChannel(interaction.channel.id)) {
            return interaction.reply({ 
                content: `❌ Game hunt hanya bisa dimainkan di channel <#${channelValidator.HUNT_CHANNEL_ID}>!`,
                flags: 64 
            });
        }
        
        const userId = interaction.user.id;
        const username = interaction.user.username;
        
        const cdCheck = await cooldown.checkCooldown(userId, 'hunt', 3600000);
        if (!cdCheck.allowed) {
            return interaction.reply({ content: `⏰ Cooldown! Kamu bisa berburu lagi ${cdCheck.timeLeft}`, flags: 64 });
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
                .setFooter({ text: username, iconURL: interaction.user.displayAvatarURL() });
            
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("play_hunt").setLabel("🏹 Hunt Lagi").setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId("back_to_main_menu").setLabel("🔙 Kembali").setStyle(ButtonStyle.Secondary)
            );
            
            return interaction.reply({ embeds: [embed], components: [row], flags: 64 });
        } else {
            await cooldown.setCooldown(userId, 'hunt');
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('😔 PERBURUAN GAGAL 😔')
                .setDescription(`Kamu berburu **${animal}**... 🏹\n\n💔 **GAGAL!** 💔\n+0 credits`)
                .setFooter({ text: username, iconURL: interaction.user.displayAvatarURL() });
            
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("play_hunt").setLabel("🏹 Hunt Lagi").setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId("back_to_main_menu").setLabel("🔙 Kembali").setStyle(ButtonStyle.Secondary)
            );
            
            return interaction.reply({ embeds: [embed], components: [row], flags: 64 });
        }
    },
    
    async handleButton(interaction, client) {
        if (interaction.customId === "play_hunt") {
            await this.executeGame(interaction);
            return true;
        }
        return false;
    },
    
    async executePrefix(message, args, client) {
        if (!channelValidator.validateHuntChannel(message.channelId)) {
            return message.reply(`❌ Game hunt hanya bisa dimainkan di channel <#${channelValidator.HUNT_CHANNEL_ID}>!`);
        }
        
        const userId = message.author.id;
        const username = message.author.username;
        
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