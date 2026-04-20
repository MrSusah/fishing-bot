const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require("discord.js");
const economy = require('../utils/economy');
const channelValidator = require('../utils/channelValidator');

module.exports = {
    name: 'cf',
    description: 'Coin Flip game',
    
    async showGameMenu(interaction) {
        if (!channelValidator.validateCasinoChannel(interaction.channel.id) && interaction.channel.id !== channelValidator.TEST_CHANNEL_ID) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Channel Tidak Valid')
                .setDescription(`Game CF hanya bisa dimainkan di channel <#${channelValidator.CASINO_CHANNEL_ID}>!`)
                .setFooter({ text: "Kembali ke menu casino untuk memilih game lain" });
            
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("back_to_casino").setLabel("🔙 Kembali ke Casino").setStyle(ButtonStyle.Secondary)
            );
            
            if (interaction.deferred || interaction.replied) {
                return interaction.editReply({ embeds: [embed], components: [row] });
            }
            return interaction.reply({ embeds: [embed], components: [row], flags: 64 });
        }
        
        const embed = new EmbedBuilder()
            .setColor('#ffd700')
            .setTitle('🪙 COIN FLIP 🪙')
            .setDescription('Tebak kepala atau ekor!')
            .addFields(
                { name: '🎯 Win Chance', value: '30%', inline: true },
                { name: '💰 Payout', value: 'x2', inline: true }
            )
            .setFooter({ text: 'Pilih pilihan dan masukkan jumlah taruhan' });
        
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId("cf_choice")
            .setPlaceholder("Pilih kepala atau ekor...")
            .addOptions([
                { label: "Kepala", value: "kepala", emoji: "🪙", description: "Tebak kepala" },
                { label: "Ekor", value: "ekor", emoji: "🪙", description: "Tebak ekor" }
            ]);
        
        const row = new ActionRowBuilder().addComponents(selectMenu);
        const backRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("back_to_casino").setLabel("🔙 Kembali ke Casino").setStyle(ButtonStyle.Secondary)
        );
        
        if (interaction.deferred || interaction.replied) {
            return interaction.editReply({ embeds: [embed], components: [row, backRow] });
        }
        return interaction.reply({ embeds: [embed], components: [row, backRow], flags: 64 });
    },
    
    async handleSelectMenu(interaction, client) {
        if (interaction.customId === "cf_choice") {
            const choice = interaction.values[0];
            
            const modal = new ModalBuilder()
                .setCustomId(`cf_modal_${choice}`)
                .setTitle("🪙 Coin Flip");
            
            const amountInput = new TextInputBuilder()
                .setCustomId("amount")
                .setLabel("Jumlah Taruhan (credits)")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("Masukkan jumlah taruhan...")
                .setRequired(true);
            
            const row = new ActionRowBuilder().addComponents(amountInput);
            modal.addComponents(row);
            
            await interaction.showModal(modal);
            return true;
        }
        return false;
    },
    
    async handleModalSubmit(interaction, client) {
        if (interaction.customId.startsWith("cf_modal_")) {
            const choice = interaction.customId.replace("cf_modal_", "");
            const amount = parseInt(interaction.fields.getTextInputValue("amount"));
            
            if (isNaN(amount) || amount <= 0) {
                return interaction.reply({ content: "❌ Taruhan harus berupa angka positif!", flags: 64 });
            }
            
            const userId = interaction.user.id;
            const balance = await economy.getBalance(userId);
            
            if (balance < amount) {
                return interaction.reply({ content: `❌ Saldo tidak cukup! Kamu punya ${balance} credits`, flags: 64 });
            }
            
            const winChance = Math.random() < 0.3;
            const result = Math.random() < 0.5 ? 'kepala' : 'ekor';
            const isWin = winChance && choice === result;
            const winAmount = isWin ? amount * 2 : 0;
            
            if (isWin) {
                await economy.addCredits(userId, winAmount - amount);
            } else {
                await economy.removeCredits(userId, amount);
            }
            
            const embed = new EmbedBuilder()
                .setColor(isWin ? '#00ff00' : '#ff0000')
                .setTitle('🪙 COIN FLIP 🪙')
                .addFields(
                    { name: 'Pilihanmu', value: choice.toUpperCase(), inline: true },
                    { name: 'Hasil', value: result.toUpperCase(), inline: true },
                    { name: 'Status', value: isWin ? '✅ MENANG!' : '❌ KALAH!', inline: true },
                    { name: 'Taruhan', value: `${amount} credits`, inline: true },
                    { name: 'Hasil Akhir', value: isWin ? `+${winAmount} credits` : `-${amount} credits`, inline: true }
                )
                .setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL() });
            
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("back_to_casino").setLabel("🎰 Kembali ke Casino").setStyle(ButtonStyle.Secondary)
            );
            
            return interaction.reply({ embeds: [embed], components: [row], flags: 64 });
        }
        return false;
    },
    
    async executePrefix(message, args, client) {
        if (!channelValidator.validateCasinoChannel(message.channelId)) {
            return message.reply(`❌ Game CF hanya bisa dimainkan di channel <#${channelValidator.CASINO_CHANNEL_ID}>!`);
        }
        
        if (args.length < 2) {
            return message.reply('❌ Usage: !cf <kepala/ekor> <amount>');
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
        
        if (balance < bet) {
            return message.reply(`❌ Saldo tidak cukup! Kamu punya ${balance} credits`);
        }
        
        const winChance = Math.random() < 0.3;
        const result = Math.random() < 0.5 ? 'kepala' : 'ekor';
        const isWin = winChance && choice === result;
        const winAmount = isWin ? bet * 2 : 0;
        
        if (isWin) {
            await economy.addCredits(userId, winAmount - bet);
        } else {
            await economy.removeCredits(userId, bet);
        }
        
        const embed = new EmbedBuilder()
            .setColor(isWin ? '#00ff00' : '#ff0000')
            .setTitle('🪙 COIN FLIP 🪙')
            .addFields(
                { name: 'Pilihanmu', value: choice.toUpperCase(), inline: true },
                { name: 'Hasil', value: result.toUpperCase(), inline: true },
                { name: 'Status', value: isWin ? '✅ MENANG!' : '❌ KALAH!', inline: true },
                { name: 'Taruhan', value: `${bet} credits`, inline: true },
                { name: 'Hasil Akhir', value: isWin ? `+${winAmount} credits` : `-${bet} credits`, inline: true }
            )
            .setFooter({ text: message.author.username, iconURL: message.author.displayAvatarURL() });
        
        await message.reply({ embeds: [embed] });
    }
};