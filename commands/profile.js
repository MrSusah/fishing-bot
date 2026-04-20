const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { User } = require("../database/mongo");

// Rods data (sama dengan di fishing.js)
const rods = {
    "Basic Rod": { luck: 1, price: 0, type: "rod", emoji: "🎣" },
    "Iron Rod": { luck: 1.2, price: 200, type: "rod", emoji: "⚙️" },
    "Silver Rod": { luck: 1.4, price: 400, type: "rod", emoji: "🥈" },
    "Golden Rod": { luck: 1.7, price: 800, type: "rod", emoji: "👑" },
    "Dragon Rod": { luck: 2, price: 1500, type: "rod", emoji: "🐉" },
    "Mythic Rod": { luck: 2.5, price: 3000, type: "rod", emoji: "🏆" },
    "God Rod": { luck: 3, price: 5000, type: "rod", emoji: "⚡" },
    "Legendary Rod": { luck: 3.5, price: 10000, type: "rod", emoji: "🌟" },
    "Celestial Rod": { luck: 4.0, price: 30000, type: "rod", emoji: "🌙" },
    "Divine Rod": { luck: 4.5, price: 90000, type: "rod", emoji: "✨" },
    "Ethereal Rod": { luck: 5.0, price: 270000, type: "rod", emoji: "🔮" },
    "Abyssal Rod": { luck: 5.5, price: 810000, type: "rod", emoji: "🌊" },
    "Primordial Rod": { luck: 6.0, price: 2430000, type: "rod", emoji: "🌀" }
};

const baits = {
    "Basic Bait": { luck: 1, price: 0, type: "bait", emoji: "🪱" },
    "Herbal Bait": { luck: 1.2, price: 100, type: "bait", emoji: "🌿" },
    "Magic Bait": { luck: 1.5, price: 300, type: "bait", emoji: "✨" },
    "Divine Bait": { luck: 1.8, price: 800, type: "bait", emoji: "💫" },
    "God Bait": { luck: 2.2, price: 1500, type: "bait", emoji: "⚡" },
    "Mythic Bait": { luck: 2.5, price: 3000, type: "bait", emoji: "🏆" },
    "Legendary Bait": { luck: 3.0, price: 9000, type: "bait", emoji: "🌟" },
    "Celestial Bait": { luck: 3.5, price: 27000, type: "bait", emoji: "🌙" },
    "Divine Bait+": { luck: 4.0, price: 81000, type: "bait", emoji: "✨" },
    "Ethereal Bait": { luck: 4.5, price: 243000, type: "bait", emoji: "🔮" },
    "Primordial Bait": { luck: 5.0, price: 729000, type: "bait", emoji: "🌀" }
};

module.exports = {
    name: "profile",
    description: "Menampilkan profile lengkap user",
    
    async execute(message, args, client) {
        let targetUser = message.author;
        
        // Cek jika user mention
        if (message.mentions.users.first()) {
            targetUser = message.mentions.users.first();
        }
        
        const user = await User.findOne({ userId: targetUser.id });
        if (!user) {
            return message.reply("❌ User tidak ditemukan dalam database!");
        }
        
        let totalFish = user.totalFishCaught || 0;
        const totalJenis = user.fishInventory?.size || 0;
        
        const rodLuck = rods[user.equippedRod]?.luck || 1;
        const baitLuck = baits[user.equippedBait]?.luck || 1;
        const totalLuck = rodLuck * baitLuck;
        
        const formattedRod = rodLuck.toFixed(2);
        const formattedBait = baitLuck.toFixed(2);
        const formattedTotal = totalLuck.toFixed(2);
        
        const luckPercentage = Math.min(100, (totalLuck / 10) * 100);
        const barLength = Math.floor(luckPercentage / 10);
        const luckBar = "█".repeat(barLength) + "░".repeat(10 - barLength);
        
        let potionStatus = "Tidak aktif";
        if (user.activePotion) {
            const remainMin = Math.ceil((user.activePotion.expiresAt - Date.now()) / 60000);
            potionStatus = `${user.activePotion.name}\n⏰ ${remainMin} menit`;
        }
        if (user.activeCooldownPotion) {
            const remainMin = Math.ceil((user.activeCooldownPotion.expiresAt - Date.now()) / 60000);
            potionStatus += `\n⏰ Cooldown: ${user.activeCooldownPotion.name} (${remainMin} menit)`;
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
                { name: "🎣 **Rod**", value: `${user.equippedRod}\n\`${formattedRod}x luck\``, inline: true },
                { name: "🪱 **Bait**", value: `${user.equippedBait}\n\`${formattedBait}x luck\``, inline: true },
                { name: "🧪 **Potion**", value: potionStatus, inline: true },
                { name: "✨ **Total Luck**", value: `\`${formattedTotal}x\`\n${luckBar}`, inline: false },
                { name: "🔄 **Konversi**", value: "100 credits = 1 point\n1 point = 100 credits", inline: false }
            )
            .setFooter({ text: "Semakin tinggi luck, semakin langka ikan yang didapat!" })
            .setTimestamp();
        
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("back_to_game_menu").setLabel("🔙 Kembali ke Game Menu").setStyle(ButtonStyle.Secondary)
        );
        
        await message.reply({ embeds: [embed], components: [row] });
    }
};