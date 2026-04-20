const { EmbedBuilder } = require("discord.js");
const { User } = require("../database/mongo");
const { Cooldown } = require("../database/mongo");

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
                    { name: "📅 Daily", value: "`!reward daily`\n50-100 credits\n⏰ Cooldown: 24 jam", inline: true },
                    { name: "⏰ Hourly", value: "`!reward hourly`\n10-50 credits\n⏰ Cooldown: 1 jam", inline: true },
                    { name: "📆 Weekly", value: "`!reward weekly`\n200-500 credits\n⏰ Cooldown: 7 hari", inline: true },
                    { name: "🌙 Monthly", value: "`!reward monthly`\n1000-2000 credits\n⏰ Cooldown: 30 hari", inline: true },
                    { name: "🎉 Yearly", value: "`!reward yearly`\n3000-5000 credits\n⏰ Cooldown: 365 hari", inline: true }
                )
                .setFooter({ text: "Gunakan !reward <jenis> untuk klaim!" })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        const userId = message.author.id;
        let cooldownTime, rewardMin, rewardMax, rewardName;
        
        switch (subCommand) {
            case "daily":
                cooldownTime = 86400000;
                rewardMin = 50;
                rewardMax = 100;
                rewardName = "Daily";
                break;
            case "hourly":
                cooldownTime = 3600000;
                rewardMin = 10;
                rewardMax = 50;
                rewardName = "Hourly";
                break;
            case "weekly":
                cooldownTime = 604800000;
                rewardMin = 200;
                rewardMax = 500;
                rewardName = "Weekly";
                break;
            case "monthly":
                cooldownTime = 2592000000;
                rewardMin = 1000;
                rewardMax = 2000;
                rewardName = "Monthly";
                break;
            case "yearly":
                cooldownTime = 31536000000;
                rewardMin = 3000;
                rewardMax = 5000;
                rewardName = "Yearly";
                break;
            default:
                return message.reply("❌ Pilihan tidak valid! Gunakan: daily, hourly, weekly, monthly, yearly");
        }
        
        try {
            // Cek cooldown
            const cooldown = await Cooldown.findOne({ userId, command: subCommand });
            
            if (cooldown) {
                const timeLeft = cooldownTime - (Date.now() - new Date(cooldown.lastUsed).getTime());
                if (timeLeft > 0) {
                    const hours = Math.floor(timeLeft / 3600000);
                    const minutes = Math.floor((timeLeft % 3600000) / 60000);
                    let timeText = "";
                    if (hours > 0) timeText += `${hours} jam `;
                    if (minutes > 0) timeText += `${minutes} menit`;
                    
                    return message.reply(`⏰ Cooldown! Kamu bisa klaim **${rewardName}** lagi ${timeText} lagi.`);
                }
            }
            
            // Hitung reward
            const reward = Math.floor(Math.random() * (rewardMax - rewardMin + 1)) + rewardMin;
            
            // Update database
            await User.findOneAndUpdate(
                { userId },
                { $inc: { credits: reward } },
                { upsert: true }
            );
            
            // Set cooldown
            await Cooldown.findOneAndUpdate(
                { userId, command: subCommand },
                { lastUsed: new Date() },
                { upsert: true }
            );
            
            const embed = new EmbedBuilder()
                .setTitle(`✅ **${rewardName} REWARD CLAIMED!**`)
                .setDescription(`Kamu mendapat **${reward.toLocaleString()} credits**!`)
                .setColor(0x00ff00)
                .addFields(
                    { name: "💰 Reward", value: `${reward.toLocaleString()} credits`, inline: true },
                    { name: "📅 Type", value: rewardName, inline: true }
                )
                .setFooter({ text: "Kembali lagi besok untuk reward berikutnya!" })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error("Reward error:", error);
            return message.reply("❌ Terjadi kesalahan saat klaim reward!");
        }
    }
};