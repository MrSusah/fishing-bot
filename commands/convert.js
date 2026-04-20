const { EmbedBuilder } = require("discord.js");
const { User } = require("../database/mongo");

module.exports = {
    name: "convert",
    description: "Convert credits ke points (100 credits = 1 point)",
    aliases: ["conv"],
    
    async execute(message, args, client) {
        const amount = parseInt(args[0]);
        
        if (isNaN(amount) || amount <= 0) {
            return message.reply("❌ Usage: `!convert <jumlah_credits>`\n\n💡 100 credits = 1 point\nContoh: `!convert 1000` → 10 points");
        }
        
        const pointsAmount = Math.floor(amount / 100);
        if (pointsAmount < 1) {
            return message.reply("❌ Minimal convert 100 credits untuk mendapatkan 1 point!");
        }
        
        const actualCreditsNeeded = pointsAmount * 100;
        
        try {
            const user = await User.findOne({ userId: message.author.id });
            
            if (!user || user.credits < actualCreditsNeeded) {
                return message.reply(`❌ Credit tidak cukup! Butuh ${actualCreditsNeeded} credits untuk ${pointsAmount} points.`);
            }
            
            await User.updateOne(
                { userId: message.author.id },
                {
                    $inc: {
                        credits: -actualCreditsNeeded,
                        points: pointsAmount,
                        seasonPoints: pointsAmount,
                        activityPoints: pointsAmount
                    }
                }
            );
            
            const embed = new EmbedBuilder()
                .setTitle("🔄 **CONVERT BERHASIL**")
                .setColor(0x00ff88)
                .addFields(
                    { name: "Credits digunakan", value: `${actualCreditsNeeded.toLocaleString()} credits`, inline: true },
                    { name: "Points didapat", value: `${pointsAmount} points`, inline: true },
                    { name: "Rate", value: "100 credits = 1 point", inline: true }
                )
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error("Convert error:", error);
            return message.reply("❌ Terjadi kesalahan saat convert!");
        }
    }
};