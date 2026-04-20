// Ganti fungsi showRewardMenu dengan yang interaktif
// Tambahkan di bagian atas gameHandler.js untuk export modal handler
async function handleModalSubmit(interaction, client) {
    if (interaction.customId === 'transfer_modal') {
        return handleTransferModal(interaction, client);
    }
    return false;
}

// Hapus fungsi showTransferInfo dan ganti dengan yang ini
async function showTransferInfo(interaction) {
    const embed = new EmbedBuilder()
        .setTitle("💸 **TRANSFER CREDITS**")
        .setDescription("Transfer credits ke user lain!")
        .setColor(0x00ff88)
        .addFields(
            { name: "📝 **Cara Penggunaan**", value: "`!transfer @user <jumlah>`", inline: false },
            { name: "📌 **Contoh**", value: "`!transfer @Kame 1000`", inline: false },
            { name: "⚠️ **Aturan**", value: "• Minimal transfer 100 credits\n• Tidak bisa transfer ke diri sendiri", inline: false }
        )
        .setFooter({ text: "Gunakan command di chat untuk transfer!" })
        .setTimestamp();
    
    return interaction.reply({ embeds: [embed], flags: 64 });
}

// Tambahkan handler untuk reward buttons
async function handleRewardButton(interaction, client) {
    const userId = interaction.user.id;
    const rewardType = interaction.customId.replace("reward_", "");
    
    let cooldownTime, rewardMin, rewardMax, rewardName;
    
    switch (rewardType) {
        case "daily":
            cooldownTime = 86400000; // 24 jam
            rewardMin = 50;
            rewardMax = 100;
            rewardName = "Daily";
            break;
        case "hourly":
            cooldownTime = 3600000; // 1 jam
            rewardMin = 10;
            rewardMax = 50;
            rewardName = "Hourly";
            break;
        case "weekly":
            cooldownTime = 604800000; // 7 hari
            rewardMin = 200;
            rewardMax = 500;
            rewardName = "Weekly";
            break;
        case "monthly":
            cooldownTime = 2592000000; // 30 hari
            rewardMin = 1000;
            rewardMax = 2000;
            rewardName = "Monthly";
            break;
        case "yearly":
            cooldownTime = 31536000000; // 365 hari
            rewardMin = 3000;
            rewardMax = 5000;
            rewardName = "Yearly";
            break;
        default:
            return interaction.reply({ content: "❌ Reward tidak valid!", flags: 64 });
    }
    
    // Cek cooldown
    const { Cooldown } = require("../database/mongo");
    const cooldown = await Cooldown.findOne({ userId, command: rewardType });
    
    if (cooldown) {
        const timeLeft = cooldownTime - (Date.now() - new Date(cooldown.lastUsed).getTime());
        if (timeLeft > 0) {
            const hours = Math.floor(timeLeft / 3600000);
            const minutes = Math.floor((timeLeft % 3600000) / 60000);
            const seconds = Math.floor((timeLeft % 60000) / 1000);
            let timeText = "";
            if (hours > 0) timeText += `${hours} jam `;
            if (minutes > 0) timeText += `${minutes} menit `;
            if (seconds > 0) timeText += `${seconds} detik`;
            
            return interaction.reply({ 
                content: `⏰ Cooldown! Kamu bisa klaim **${rewardName}** lagi ${timeText} lagi.`,
                flags: 64 
            });
        }
    }
    
    // Hitung reward
    const reward = Math.floor(Math.random() * (rewardMax - rewardMin + 1)) + rewardMin;
    
    // Update database
    const { User } = require("../database/mongo");
    await User.findOneAndUpdate(
        { userId },
        { $inc: { credits: reward } },
        { upsert: true }
    );
    
    // Set cooldown
    await Cooldown.findOneAndUpdate(
        { userId, command: rewardType },
        { lastUsed: new Date() },
        { upsert: true }
    );
    
    const embed = new EmbedBuilder()
        .setTitle(`✅ **${rewardName} REWARD CLAIMED!**`)
        .setDescription(`Kamu mendapat **${reward.toLocaleString()} credits**!`)
        .setColor(0x00ff00)
        .addFields(
            { name: "💰 Total Reward", value: `${reward.toLocaleString()} credits`, inline: true },
            { name: "📅 Reward Type", value: rewardName, inline: true }
        )
        .setFooter({ text: "Kembali lagi besok untuk reward berikutnya!" })
        .setTimestamp();
    
    // Button untuk kembali ke menu reward
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("back_to_reward_menu").setLabel("🎁 Kembali ke Reward Menu").setStyle(ButtonStyle.Secondary)
    );
    
    return interaction.reply({ embeds: [embed], components: [row], flags: 64 });
}

// Update handleGameButton untuk reward buttons
// Tambahkan di bagian dalam fungsi handleGameButton:
if (customId === "reward_daily" || customId === "reward_hourly" || 
    customId === "reward_weekly" || customId === "reward_monthly" || 
    customId === "reward_yearly") {
    return handleRewardButton(interaction, client);
}

if (customId === "back_to_reward_menu") {
    return showRewardMenu(interaction);
}
