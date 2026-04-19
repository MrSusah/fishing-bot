const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const economy = require('../utils/economy');
const User = require('../models/User');

const ADMIN_ID = '756609192277835858';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('Panel admin untuk manage ekonomi (Admin only)')
        .addSubcommand(sub => 
            sub.setName('add')
                .setDescription('Tambah credits ke user')
                .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
                .addIntegerOption(opt => opt.setName('amount').setDescription('Jumlah credits').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('remove')
                .setDescription('Kurangi credits dari user')
                .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
                .addIntegerOption(opt => opt.setName('amount').setDescription('Jumlah credits').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('set')
                .setDescription('Set balance user')
                .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
                .addIntegerOption(opt => opt.setName('amount').setDescription('Jumlah credits').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('stats')
                .setDescription('Lihat statistik ekonomi server')),
    
    async execute(interaction) {
        try {
            if (interaction.user.id !== ADMIN_ID) {
                return await interaction.reply({ 
                    content: '❌ Command ini hanya untuk admin!', 
                    ephemeral: true 
                });
            }
            
            await interaction.deferReply({ ephemeral: true });
            
            const subcommand = interaction.options.getSubcommand();
            
            switch(subcommand) {
                case 'add':
                    const addUser = interaction.options.getUser('user');
                    const addAmount = interaction.options.getInteger('amount');
                    await economy.addCredits(addUser.id, addAmount);
                    await interaction.editReply({ 
                        content: `✅ Berhasil menambah ${addAmount} credits ke ${addUser.username}` 
                    });
                    break;
                    
                case 'remove':
                    const removeUser = interaction.options.getUser('user');
                    const removeAmount = interaction.options.getInteger('amount');
                    await economy.removeCredits(removeUser.id, removeAmount);
                    await interaction.editReply({ 
                        content: `✅ Berhasil mengurangi ${removeAmount} credits dari ${removeUser.username}` 
                    });
                    break;
                    
                case 'set':
                    const setUser = interaction.options.getUser('user');
                    const setAmount = interaction.options.getInteger('amount');
                    await economy.setBalance(setUser.id, setAmount);
                    await interaction.editReply({ 
                        content: `✅ Berhasil set balance ${setUser.username} menjadi ${setAmount} credits` 
                    });
                    break;
                    
                case 'stats':
                    const users = await User.find().sort({ balance: -1 }).limit(10);
                    const totalUsers = await User.countDocuments();
                    const totalBalance = await User.aggregate([{ $group: { _id: null, total: { $sum: '$balance' } } }]);
                    
                    const embed = new EmbedBuilder()
                        .setColor('#ffd700')
                        .setTitle('📊 Statistik Ekonomi Server')
                        .addFields(
                            { name: '👥 Total User', value: `${totalUsers}`, inline: true },
                            { name: '💰 Total Credits', value: `${totalBalance[0]?.total || 0}`, inline: true },
                            { name: '📈 Rata-rata', value: `${Math.floor((totalBalance[0]?.total || 0) / totalUsers)}`, inline: true },
                            { name: '🏆 Top 10 Richest', value: users.map((u, i) => `${i+1}. <@${u.userId}>: ${u.balance} credits`).join('\n') || 'Tidak ada data' }
                        );
                    
                    await interaction.editReply({ embeds: [embed] });
                    break;
            }
        } catch (error) {
            console.error('Error in admin command:', error);
            await interaction.editReply({ content: 'Terjadi kesalahan!', ephemeral: true });
        }
    }
};