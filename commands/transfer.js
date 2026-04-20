const { EmbedBuilder } = require("discord.js");
const { showTransferInfo } = require('../utils/gameHandler');
const { User } = require("../database/mongo");

module.exports = {
    name: 'transfer',
    description: 'Transfer credits ke user lain',
    
    async executePrefix(message, args, client) {
        if (args.length === 0 || !message.mentions.users.first()) {
            const fakeInteraction = {
                user: message.author,
                member: message.member,
                channel: message.channel,
                guild: message.guild,
                reply: async (options) => {
                    if (options.flags === 64) {
                        return message.reply(options);
                    }
                    return message.reply(options);
                },
                editReply: async (options) => message.editReply(options),
                deferReply: async () => {},
                deferred: false,
                replied: false,
                customId: null
            };
            return showTransferInfo(fakeInteraction);
        }
        
        const target = message.mentions.users.first();
        const amount = parseInt(args[0]);
        
        if (isNaN(amount) || amount < 100) {
            return message.reply("❌ Jumlah harus angka dan minimal 100 credits!");
        }
        
        if (target.id === message.author.id) {
            return message.reply("❌ Tidak bisa transfer ke diri sendiri!");
        }
        
        try {
            const sender = await User.findOne({ userId: message.author.id });
            
            if (!sender || sender.credits < amount) {
                return message.reply(`❌ Credit tidak cukup! Saldo: ${sender?.credits?.toLocaleString() || 0} credits`);
            }
            
            await User.updateOne(
                { userId: message.author.id },
                { $inc: { credits: -amount } }
            );
            
            await User.updateOne(
                { userId: target.id },
                { $inc: { credits: amount } },
                { upsert: true }
            );
            
            const embed = new EmbedBuilder()
                .setTitle("💸 **TRANSFER BERHASIL** 💸")
                .setColor(0x00ff00)
                .addFields(
                    { name: "Pengirim", value: message.author.username, inline: true },
                    { name: "Penerima", value: target.username, inline: true },
                    { name: "Jumlah", value: `${amount.toLocaleString()} credits`, inline: true }
                )
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error("Transfer error:", error);
            return message.reply("❌ Terjadi kesalahan saat transfer!");
        }
    }
};