const { EmbedBuilder } = require("discord.js");
const { User } = require("../database/mongo");

module.exports = {
    name: 'profile',
    description: 'Lihat profil user',
    aliases: ['profil', 'p'],
    
    async executePrefix(message, args, client) {
        let targetUser = message.author;
        
        if (message.mentions.users.first()) {
            targetUser = message.mentions.users.first();
        }
        
        const user = await User.findOne({ userId: targetUser.id });
        if (!user) {
            return message.reply("❌ User tidak ditemukan dalam database!");
        }
        
        const rods = {
            "Basic Rod": { luck: 1, emoji: "🎣" }, "Iron Rod": { luck: 1.2, emoji: "⚙️" },
            "Silver Rod": { luck: 1.4, emoji: "🥈" }, "Golden Rod": { luck: 1.7, emoji: "👑" },
            "Dragon Rod": { luck: 2, emoji: "🐉" }, "Mythic Rod": { luck: 2.5, emoji: "🏆" },
            "God Rod": { luck: 3, emoji: "⚡" }, "Legendary Rod": { luck: 3.5, emoji: "🌟" },
            "Celestial Rod": { luck: 4.0, emoji: "🌙" }, "Divine Rod": { luck: 4.5, emoji: "✨" },
            "Ethereal Rod": { luck: 5.0, emoji: "🔮" }, "Abyssal Rod": { luck: 5.5, emoji: "🌊" },
            "Primordial Rod": { luck: 6.0, emoji: "🌀" }
        };
        
        const baits = {
            "Basic Bait": { luck: 1, emoji: "🪱" }, "Herbal Bait": { luck: 1.2, emoji: "🌿" },
            "Magic Bait": { luck: 1.5, emoji: "✨" }, "Divine Bait": { luck: 1.8, emoji: "💫" },
            "God Bait": { luck: 2.2, emoji: "⚡" }, "Mythic Bait": { luck: 2.5, emoji: "🏆" },
            "Legendary Bait": { luck: 3.0, emoji: "🌟" }, "Celestial Bait": { luck: 3.5, emoji: "🌙" },
            "Divine Bait+": { luck: 4.0, emoji: "✨" }, "Ethereal Bait": { luck: 4.5, emoji: "🔮" },
            "Primordial Bait": { luck: 5.0, emoji: "🌀" }
        };
        
        const totalFish = user.totalFishCaught || 0;
        const totalJenis = user.fishInventory?.size || 0;
        
        const rodLuck = rods[user.equippedRod]?.luck || 1;
        const baitLuck = baits[user.equippedBait]?.luck || 1;
        const totalLuck = rodLuck * baitLuck;
        
        let potionStatus = "Tidak aktif";
        if (user.activePotion) {
            const remainMin = Math.ceil((user.activePotion.expiresAt - Date.now()) / 60000);
            potionStatus = `${user.activePotion.name}\n⏰ ${remainMin} menit`;
        }
        
        const embed = new EmbedBuilder()
            .setTitle(`🎣 ${targetUser.username}'s Profile`)
            .setColor(0x00ae86)
            .setThumbnail(targetUser.displayAvatarURL())
            .addFields(
                { name: "💰 **Credits**", value: `${user.credits.toLocaleString()} credits`, inline: true },
                { name: "⭐ **Points**", value: `${user.points.toLocaleString()} points`, inline: true },
                { name: "📈 **Activity Points**", value: `${user.activityPoints.toLocaleString()} pts`, inline: true },
                { name: "🏆 **Total Fishing Credits**", value: `${user.totalFishingCredits.toLocaleString()} credits`, inline: true },
                { name: "🐟 **Total Ikan**", value: `${totalFish} ekor`, inline: true },
                { name: "📋 **Jenis Ikan**", value: `${totalJenis} jenis`, inline: true },
                { name: "🎣 **Rod**", value: `${user.equippedRod}\n\`${rodLuck.toFixed(2)}x luck\``, inline: true },
                { name: "🪱 **Bait**", value: `${user.equippedBait}\n\`${baitLuck.toFixed(2)}x luck\``, inline: true },
                { name: "🧪 **Potion**", value: potionStatus, inline: true }
            )
            .setFooter({ text: "Gunakan !profile @user untuk lihat profil orang lain" })
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    }
};