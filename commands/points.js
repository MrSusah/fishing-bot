const { EmbedBuilder } = require("discord.js");
const { User } = require("../database/mongo");

module.exports = {
    name: "points",
    description: "Cek total points",
    aliases: ["pts", "point"],
    
    async execute(message, args, client) {
        let targetUser = message.author;
        
        if (message.mentions.users.first()) {
            targetUser = message.mentions.users.first();
        }
        
        const user = await User.findOne({ userId: targetUser.id });
        if (!user) {
            return message.reply("❌ User tidak ditemukan dalam database!");
        }
        
        const embed = new EmbedBuilder()
            .setTitle(`⭐ ${targetUser.username}'s Points`)
            .setColor(0xffd700)
            .addFields(
                { name: "💰 Total Points", value: `${user.points.toLocaleString()} points`, inline: true },
                { name: "🏆 Season Points", value: `${user.seasonPoints.toLocaleString()} points`, inline: true },
                { name: "📈 Activity Points", value: `${user.activityPoints.toLocaleString()} points`, inline: true },
                { name: "💎 Credits", value: `${user.credits.toLocaleString()} credits`, inline: true },
                { name: "🔄 Konversi", value: "100 credits = 1 point\n1 point = 100 credits", inline: false }
            )
            .addFields(
                { name: "📋 **Command yang tersedia**", value: 
                    "`!convert <credits>` - Credits → Points\n" +
                    "`!convertpoint <points>` - Points → Credits\n" +
                    "`!transfer @user <jumlah>` - Transfer credits", inline: false }
            )
            .setFooter({ text: "Terus beraktivitas untuk mendapat lebih banyak points!" })
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    }
};