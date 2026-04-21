const { EmbedBuilder } = require("discord.js");
const { User } = require("../database/mongo");

module.exports = {
    name: 'activity',
    description: 'Lihat aktivitas dan points',
    aliases: ['act', 'aktivitas'],
    
    async executePrefix(message, args, client) {
        const user = await User.findOne({ userId: message.author.id });
        
        const embed = new EmbedBuilder()
            .setTitle("📊 **Activity Points System**")
            .setDescription("Dapatkan points dari aktivitas!")
            .setColor(0x00ff88)
            .addFields(
                { name: "💬 **Chat**", value: "+1 points/pesan (cooldown 10 detik/channel)", inline: false },
                { name: "📸 **Gallery**", value: "+5 points/post, +2 points/komentar", inline: false },
                { name: "🎯 **Reaction**", value: "+3 points (cooldown 30 detik)", inline: false },
                { name: "🎙️ **Voice**", value: "+1 points/2 menit (minimal 2 orang)", inline: false },
                { name: "🎣 **Fishing**", value: "Dapat credits dari mancing", inline: false },
                { name: "🔄 **Convert**", value: "100 credits = 1 point", inline: false },
                { name: "━━━━━━━━━━", value: "━━━━━━━━━━━━━━━━━━", inline: false },
                { name: "⭐ **Points Kamu**", value: `${user?.points?.toLocaleString() || 0} points`, inline: true },
                { name: "🏆 **Season Points**", value: `${user?.seasonPoints?.toLocaleString() || 0} points`, inline: true },
                { name: "📈 **Activity Points**", value: `${user?.activityPoints?.toLocaleString() || 0} points`, inline: true }
            )
            .setFooter({ text: "Gunakan !convert <credits> untuk convert ke points" })
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    }
};