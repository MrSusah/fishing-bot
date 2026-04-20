const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { User } = require("../database/mongo");
const cooldown = require("../utils/cooldown");

module.exports = {
    name: "reward",
    description: "Klaim reward harian/mingguan/bulanan",
    
    async execute(message, args, client) {
        const subCommand = args[0]?.toLowerCase();
        
        if (!subCommand) {
            const embed = new EmbedBuilder()
                .setTitle("🎁 **REWARD SYSTEM** 🎁")
                .setDescription("Pilih jenis reward yang ingin diklaim:")
                .setColor(0xffaa00)
                .addFields(
                    { name: "📅 Daily", value: "`!reward daily`\n50-100 credits", inline: true },
                    { name: "⏰ Hourly", value: "`!reward hourly`\n10-50 credits", inline: true },
                    { name: "📆 Weekly", value: "`!reward weekly`\n200-500 credits", inline: true },
                    { name: "🌙 Monthly", value: "`!reward monthly`\n1000-2000 credits", inline: true },
                    { name: "🎉 Yearly", value: "`!reward yearly`\n3000-5000 credits", inline: true }
                )
                .setFooter({ text: "Setiap reward memiliki cooldown masing-masing!" })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        const userId = message.author.id;
        
        switch (subCommand) {
            case "daily": {
                const cdCheck = await cooldown.checkCooldown(userId, "daily", 86400000); // 24 jam
                if (!cdCheck.allowed) {
                    return message.reply(`⏰ Cooldown! Kamu bisa klaim daily lagi ${cdCheck.timeLeft}`);
                }
                
                const reward = Math.floor(Math.random() * 51) + 50; // 50-100
                await User.findOneAndUpdate(
                    { userId },
                    { $inc: { credits: reward } },
                    { upsert: true }
                );
                await cooldown.setCooldown(userId, "daily");
                
                return message.reply(`✅ **Daily Reward!** +${reward} credits`);
            }
            
            case "hourly": {
                const cdCheck = await cooldown.checkCooldown(userId, "hourly", 3600000); // 1 jam
                if (!cdCheck.allowed) {
                    return message.reply(`⏰ Cooldown! Kamu bisa klaim hourly lagi ${cdCheck.timeLeft}`);
                }
                
                const reward = Math.floor(Math.random() * 41) + 10; // 10-50
                await User.findOneAndUpdate(
                    { userId },
                    { $inc: { credits: reward } },
                    { upsert: true }
                );
                await cooldown.setCooldown(userId, "hourly");
                
                return message.reply(`✅ **Hourly Reward!** +${reward} credits`);
            }
            
            case "weekly": {
                const cdCheck = await cooldown.checkCooldown(userId, "weekly", 604800000); // 7 hari
                if (!cdCheck.allowed) {
                    return message.reply(`⏰ Cooldown! Kamu bisa klaim weekly lagi ${cdCheck.timeLeft}`);
                }
                
                const reward = Math.floor(Math.random() * 301) + 200; // 200-500
                await User.findOneAndUpdate(
                    { userId },
                    { $inc: { credits: reward } },
                    { upsert: true }
                );
                await cooldown.setCooldown(userId, "weekly");
                
                return message.reply(`✅ **Weekly Reward!** +${reward} credits`);
            }
            
            case "monthly": {
                const cdCheck = await cooldown.checkCooldown(userId, "monthly", 2592000000); // 30 hari
                if (!cdCheck.allowed) {
                    return message.reply(`⏰ Cooldown! Kamu bisa klaim monthly lagi ${cdCheck.timeLeft}`);
                }
                
                const reward = Math.floor(Math.random() * 1001) + 1000; // 1000-2000
                await User.findOneAndUpdate(
                    { userId },
                    { $inc: { credits: reward } },
                    { upsert: true }
                );
                await cooldown.setCooldown(userId, "monthly");
                
                return message.reply(`✅ **Monthly Reward!** +${reward} credits`);
            }
            
            case "yearly": {
                const cdCheck = await cooldown.checkCooldown(userId, "yearly", 31536000000); // 365 hari
                if (!cdCheck.allowed) {
                    return message.reply(`⏰ Cooldown! Kamu bisa klaim yearly lagi ${cdCheck.timeLeft}`);
                }
                
                const reward = Math.floor(Math.random() * 2001) + 3000; // 3000-5000
                await User.findOneAndUpdate(
                    { userId },
                    { $inc: { credits: reward } },
                    { upsert: true }
                );
                await cooldown.setCooldown(userId, "yearly");
                
                return message.reply(`✅ **Yearly Reward!** +${reward} credits`);
            }
            
            default:
                return message.reply("❌ Pilihan tidak valid! Gunakan: daily, hourly, weekly, monthly, yearly");
        }
    }
};