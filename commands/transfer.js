const { EmbedBuilder } = require("discord.js");
const { User } = require("../database/mongo");

module.exports = {
    name: "transfer",
    description: "Transfer credits ke user lain",
    
    async execute(message, args, client) {
        const target = message.mentions.users.first();
        const amount = parseInt(args[0]);
        
        if (!target) {
            return message.reply("❌ Mention user yang akan ditransfer!\nContoh: `!transfer @user 1000`");
        }
        
        if (isNaN(amount) || amount < 100) {
            return message.reply("❌ Jumlah harus angka dan minimal 100 credits!");
        }
        
        if (target.id === message.author.id) {
            return message.reply("❌ Tidak bisa transfer ke diri sendiri!");
        }
        
        // Lock untuk mencegah double transfer (sederhana)
        const processingLocks = new Map();
        const lockKey = `${message.author.id}:transfer`;
        
        if (processingLocks.has(lockKey)) {
            return message.reply("⏳ Proses transfer sedang berjalan, tunggu sebentar!");
        }
        
        processingLocks.set(lockKey, Date.now());
        setTimeout(() => processingLocks.delete(lockKey), 5000);
        
        try {
            const sender = await User.findOne({ userId: message.author.id });
            const receiver = await User.findOne({ userId: target.id });
            
            if (!sender || sender.credits < amount) {
                processingLocks.delete(lockKey);
                return message.reply(`❌ Credit tidak cukup! Saldo: ${sender?.credits?.toLocaleString() || 0} credits`);
            }
            
            // Transfer
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
            
            processingLocks.delete(lockKey);
            return message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error("Transfer error:", error);
            processingLocks.delete(lockKey);
            return message.reply("❌ Terjadi kesalahan saat transfer!");
        }
    }
};