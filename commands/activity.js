const { EmbedBuilder } = require("discord.js");
const { User } = require("../database/mongo");

module.exports = {
    name: "activity",
    description: "Lihat aktivitas dan points",
    
    async execute(message, args, client) {
        let targetUser = message.author;
        
        if (message.mentions.users.first()) {
            targetUser = message.mentions.users.first();
        }
        
        const user = await User.findOne({ userId: targetUser.id });
        if (!user) {
            return message.reply("❌ User tidak ditemukan!");
        }
        
        const embed = new EmbedBuilder()
            .setTitle(`📊 ${targetUser.username}'s Activity`)
            .setColor(0x00ff88)
            .addFields(
                { name: "⭐ Total Points", value: `${user.points.toLocaleString()} points`, inline: true },
                { name: "🏆 Season Points", value: `${user.seasonPoints.toLocaleString()} points`, inline: true },
                { name: "📈 Activity Points", value: `${user.activityPoints.toLocaleString()} points`, inline: true },
                { name: "🐟 Total Fish Caught", value: `${user.totalFishCaught || 0} ekor`, inline: true },
                { name: "🎣 Season Fish", value: `${user.seasonFishCaught || 0} ekor`, inline: true },
                { name: "🎙️ Voice Minutes", value: `${user.totalVoiceMinutes || 0} menit`, inline: true }
            )
            .addFields(
                { name: "📋 **Cara Mendapatkan Points**", value: 
                    "💬 **Chat** = +1 points/pesan\n" +
                    "📸 **Gallery** = +5 post, +2 komentar\n" +
                    "🎯 **Reaction** = +3 points\n" +
                    "🎙️ **Voice** = +1 points/2 menit (min 2 orang)\n" +
                    "🎣 **Fishing** = Dapat credits & points\n" +
                    "🔄 **Convert** = 100 credits = 1 point", inline: false }
            )
            .setFooter({ text: "Gunakan !convert <credits> untuk convert ke points" })
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    }
};