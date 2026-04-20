const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    EmbedBuilder
} = require("discord.js");

const gameModule = {
    name: "fishing",
    version: "1.0.0",
    
    // Database models akan di-set saat init
    User: null,
    
    // Config
    FISHING_CHANNELS: [
        "1492058905499402271",
        "1492077755322470530",
        "1492077857042862161",
        "1492077877301084351",
        "1492077899870765166"
    ],
    
    ANNOUNCE_CHANNEL: "1492368085410254978",
    ACTIVITY_LEADERBOARD_CHANNEL: "1493595313376592013",
    ADMIN_IDS: ["756609192277835858"],
    OWNER_ID: "756609192277835858",
    
    // State
    globalLuckBoost: 1,
    channelBoost: {},
    activeBoss: null,
    bossSpawnTime: null,
    leaderboardMessageId: null,
    activityLeaderboardMessageId: null,
    cachedActivityLeaderboard: null,
    
    // Cooldowns
    cooldowns: new Map(),
    processingLocks: new Map(),
    
    // Boss list
    bossList: [
        { name: "👑 Kraken Purba", rarity: "Secret", value: 55000, emoji: "🐙" },
        { name: "👑 Naga Laut", rarity: "Secret", value: 58000, emoji: "🐉" },
        { name: "👑 Leviathan Abyss", rarity: "Secret", value: 60000, emoji: "🌊" },
        { name: "👑 Poseidon Wrath", rarity: "Secret", value: 55000, emoji: "⚡" }
    ],
    
    // Rewards
    REWARDS: {
        "Tunai Rp5.000": { cost: 8000, type: "cash", value: "Rp5.000", emoji: "💰" },
        "Tunai Rp10.000": { cost: 16000, type: "cash", value: "Rp10.000", emoji: "💰" },
        "Tunai Rp20.000": { cost: 32000, type: "cash", value: "Rp20.000", emoji: "💰" },
        "Tunai Rp50.000": { cost: 76000, type: "cash", value: "Rp50.000", emoji: "💰" },
        "Tunai Rp100.000": { cost: 150000, type: "cash", value: "Rp100.000", emoji: "💰" }
    },
    
    // Potions
    potions: {
        "Potion Luck 10%": { luck: 1.1, duration: 30, price: 500, emoji: "🧪" },
        "Potion Luck 25%": { luck: 1.25, duration: 30, price: 1000, emoji: "🧪" },
        "Potion Luck 50%": { luck: 1.5, duration: 30, price: 2000, emoji: "🧪" },
        "Elixir Luck 100%": { luck: 2.0, duration: 60, price: 5000, emoji: "✨" },
        "Potion Cooldown 15%": { cooldownReduce: 0.15, duration: 30, price: 10000, emoji: "⏰" },
        "Potion Cooldown 25%": { cooldownReduce: 0.25, duration: 30, price: 20000, emoji: "⌛" }
    },
    
    // Rods
    rods: {
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
    },
    
    // Baits
    baits: {
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
    },
    
    // Rarity chances
    rarityChances: {
        Common: 1 / 75,
        Uncommon: 1 / 500,
        Rare: 1 / 2000,
        Epic: 1 / 15000,
        Legendary: 1 / 100000
    },
    
    // Fishing zones
    fishingZones: {
        "1492058905499402271": [
            { name: "Lele Lumpur", rarity: "Common", value: 5 }, { name: "Gabus", rarity: "Common", value: 6 },
            { name: "Mujaer", rarity: "Common", value: 4 }, { name: "Nila Merah", rarity: "Common", value: 5 },
            { name: "Tawes", rarity: "Common", value: 4 }, { name: "Wader", rarity: "Common", value: 3 },
            { name: "Betutu", rarity: "Uncommon", value: 15 }, { name: "Belut Sawah", rarity: "Uncommon", value: 12 },
            { name: "Bawal Air Tawar", rarity: "Uncommon", value: 18 }, { name: "Patin", rarity: "Uncommon", value: 14 },
            { name: "Gurame", rarity: "Rare", value: 50 }, { name: "Arwana", rarity: "Rare", value: 70 },
            { name: "Salmon Desa", rarity: "Rare", value: 60 }, { name: "Piranha", rarity: "Epic", value: 150 },
            { name: "Arapaima", rarity: "Epic", value: 200 }, { name: "Megalodon", rarity: "Legendary", value: 600 },
            { name: "Kraken", rarity: "Legendary", value: 800 }, { name: "Naga Sungai", rarity: "Mythic", value: 2000 },
            { name: "Spirit Ikan Mas", rarity: "Mythic", value: 2500 }, { name: "Dewa Lele", rarity: "Secret", value: 10000 }
        ],
        "1492077755322470530": [
            { name: "Ikan Komet", rarity: "Common", value: 6 }, { name: "Platy", rarity: "Common", value: 5 },
            { name: "Molly", rarity: "Common", value: 5 }, { name: "Swordtail", rarity: "Common", value: 7 },
            { name: "Corydoras", rarity: "Common", value: 6 }, { name: "Botia", rarity: "Uncommon", value: 15 },
            { name: "Lohan", rarity: "Uncommon", value: 20 }, { name: "Oscar", rarity: "Uncommon", value: 18 },
            { name: "Flowerhorn", rarity: "Rare", value: 80 }, { name: "Red Arowana", rarity: "Rare", value: 100 },
            { name: "Silver Arowana", rarity: "Rare", value: 90 }, { name: "Jardini", rarity: "Epic", value: 180 },
            { name: "Black Ghost", rarity: "Epic", value: 220 }, { name: "Elephant Nose", rarity: "Epic", value: 200 },
            { name: "Discus", rarity: "Legendary", value: 700 }, { name: "Altum Angelfish", rarity: "Legendary", value: 750 },
            { name: "King Kong Parrot", rarity: "Mythic", value: 2200 }, { name: "Super Red", rarity: "Mythic", value: 2800 },
            { name: "Asian Arowana", rarity: "Secret", value: 12000 }, { name: "Mahseer", rarity: "Legendary", value: 900 }
        ],
        "1492077857042862161": [
            { name: "Baronang", rarity: "Common", value: 8 }, { name: "Kerapu", rarity: "Common", value: 10 },
            { name: "Kakap Merah", rarity: "Common", value: 9 }, { name: "Cumi", rarity: "Common", value: 7 },
            { name: "Gurita", rarity: "Uncommon", value: 20 }, { name: "Lobster", rarity: "Uncommon", value: 30 },
            { name: "Rajungan", rarity: "Uncommon", value: 25 }, { name: "Tuna", rarity: "Rare", value: 80 },
            { name: "Cakalang", rarity: "Rare", value: 75 }, { name: "Marlin", rarity: "Epic", value: 200 },
            { name: "Hiu Putih", rarity: "Epic", value: 250 }, { name: "Paus Biru", rarity: "Legendary", value: 800 },
            { name: "Orca", rarity: "Legendary", value: 900 }, { name: "Squid Raksasa", rarity: "Legendary", value: 1000 },
            { name: "Naga Laut", rarity: "Mythic", value: 3000 }, { name: "Leviathan", rarity: "Mythic", value: 3500 },
            { name: "Kraken Laut Dalam", rarity: "Secret", value: 15000 }, { name: "Poseidon", rarity: "Legendary", value: 1200 },
            { name: "Cthulhu", rarity: "Secret", value: 20000 }, { name: "Neptunus", rarity: "Legendary", value: 1100 }
        ],
        "1492077877301084351": [
            { name: "Ikan Es", rarity: "Common", value: 10 }, { name: "Salmon Arktik", rarity: "Common", value: 12 },
            { name: "Trout Es", rarity: "Uncommon", value: 25 }, { name: "Char", rarity: "Uncommon", value: 28 },
            { name: "Grayling", rarity: "Rare", value: 90 }, { name: "Whitefish", rarity: "Rare", value: 85 },
            { name: "Pike Es", rarity: "Epic", value: 220 }, { name: "Musky", rarity: "Epic", value: 250 },
            { name: "Sturgeon Es", rarity: "Legendary", value: 950 }, { name: "Beluga", rarity: "Legendary", value: 1000 },
            { name: "Narwhal", rarity: "Legendary", value: 1100 }, { name: "Walrus", rarity: "Mythic", value: 3200 },
            { name: "Leopard Seal", rarity: "Mythic", value: 3400 }, { name: "Orca Es", rarity: "Secret", value: 18000 },
            { name: "Paus Pembunuh", rarity: "Legendary", value: 1200 }, { name: "Yeti Fish", rarity: "Secret", value: 22000 },
            { name: "Frost Dragon", rarity: "Legendary", value: 1500 }, { name: "Aurora Fish", rarity: "Legendary", value: 1300 },
            { name: "Glacier King", rarity: "Legendary", value: 1400 }, { name: "Snow Kraken", rarity: "Legendary", value: 1600 }
        ],
        "1492077899870765166": [
            { name: "Void Minnow", rarity: "Common", value: 15 }, { name: "Dark Carp", rarity: "Common", value: 18 },
            { name: "Abyss Guppy", rarity: "Uncommon", value: 35 }, { name: "Shadow Eel", rarity: "Uncommon", value: 40 },
            { name: "Night Angler", rarity: "Rare", value: 120 }, { name: "Darkness Ray", rarity: "Rare", value: 130 },
            { name: "Void Pike", rarity: "Epic", value: 280 }, { name: "Abyssal Cod", rarity: "Epic", value: 300 },
            { name: "Nether Salmon", rarity: "Legendary", value: 2400 }, { name: "Obsidian Tuna", rarity: "Legendary", value: 2600 },
            { name: "Void Kraken", rarity: "Mythic", value: 8000 }, { name: "Abyss Leviathan", rarity: "Mythic", value: 9000 },
            { name: "Darkness Dragon", rarity: "Secret", value: 60000 }, { name: "Cthulhu Void", rarity: "Secret", value: 100000 },
            { name: "Void God", rarity: "Legendary", value: 4000 }, { name: "Eater of Worlds", rarity: "Legendary", value: 5000 },
            { name: "Cosmic Fish", rarity: "Legendary", value: 3600 }, { name: "Singularity", rarity: "Legendary", value: 4400 },
            { name: "Black Hole", rarity: "Legendary", value: 6000 }, { name: "Void Leviathan", rarity: "Legendary", value: 5600 }
        ]
    },
    
    // Helper functions
    acquireLock(userId, action, timeout = 5000) {
        const key = `${userId}:${action}`;
        if (this.processingLocks.has(key)) return false;
        this.processingLocks.set(key, Date.now());
        setTimeout(() => {
            if (this.processingLocks.get(key)) this.processingLocks.delete(key);
        }, timeout);
        return key;
    },
    
    releaseLock(key) {
        if (key && this.processingLocks.has(key)) this.processingLocks.delete(key);
    },
    
    hasCooldown(userId, action, cooldownMs = 2000) {
        const key = `${userId}:${action}`;
        const lastUsed = this.cooldowns.get(key);
        if (lastUsed && Date.now() - lastUsed < cooldownMs) return true;
        this.cooldowns.set(key, Date.now());
        return false;
    },
    
    getMutation() {
        const r = Math.random();
        if (r < 0.005) return "🧚 Fairy";
        if (r < 0.01) return "👻 Ghost";
        if (r < 0.015) return "🪨 Stone";
        if (r < 0.02) return "🏜️ Sand";
        if (r < 0.025) return "☢️ Radioaktif";
        if (r < 0.03) return "❄️ Ice";
        if (r < 0.035) return "⭐ Gold";
        if (r < 0.045) return "✨ Shiny";
        if (r < 0.055) return "🔥 Inferno";
        if (r < 0.065) return "💀 Dark";
        return "";
    },
    
    getMutationBonus(mutation) {
        const bonuses = {
            "🧚 Fairy": 500, "👻 Ghost": 300, "🪨 Stone": 100,
            "🏜️ Sand": 80, "☢️ Radioaktif": 400, "❄️ Ice": 150,
            "⭐ Gold": 200, "✨ Shiny": 250, "🔥 Inferno": 350, "💀 Dark": 180
        };
        return bonuses[mutation] || 0;
    },
    
    rollRarity(luck, channelId) {
        const r = Math.random();
        const isVoid = channelId === "1492077899870765166";
        let modifier = isVoid ? 0.5 : 1;
        
        if (r < this.rarityChances.Legendary * luck * modifier) return "Legendary";
        if (r < this.rarityChances.Epic * luck * modifier) return "Epic";
        if (r < this.rarityChances.Rare * luck * modifier) return "Rare";
        if (r < this.rarityChances.Uncommon * luck * modifier) return "Uncommon";
        return "Common";
    },
    
    getFish(channelId, luck) {
        if (this.activeBoss && this.activeBoss.channel === channelId && Math.random() < 0.01) {
            const b = { ...this.activeBoss };
            this.activeBoss = null;
            this.bossSpawnTime = null;
            return b;
        }
        
        const zone = this.fishingZones[channelId];
        const rarity = this.rollRarity(luck, channelId);
        let pool = zone.filter(f => f.rarity === rarity);
        if (pool.length === 0) pool = zone;
        return pool[Math.floor(Math.random() * pool.length)];
    },
    
    getZoneName(channelId) {
        const zoneNames = {
            [this.FISHING_CHANNELS[0]]: "🏞️ ZONA DESA",
            [this.FISHING_CHANNELS[1]]: "🌊 ZONA SUNGAI",
            [this.FISHING_CHANNELS[2]]: "🐠 ZONA LAUT",
            [this.FISHING_CHANNELS[3]]: "❄️ ZONA ES",
            [this.FISHING_CHANNELS[4]]: "🌑 ZONA VOID"
        };
        return zoneNames[channelId] || "ZONA UNKNOWN";
    },
    
    spawnBoss(client) {
        const channel = this.FISHING_CHANNELS[Math.floor(Math.random() * this.FISHING_CHANNELS.length)];
        const randomBoss = this.bossList[Math.floor(Math.random() * this.bossList.length)];
        
        this.activeBoss = {
            name: randomBoss.name,
            rarity: randomBoss.rarity,
            value: randomBoss.value,
            emoji: randomBoss.emoji,
            channel: channel,
            spawnTime: Date.now()
        };
        
        this.bossSpawnTime = Date.now();
        
        client.channels.fetch(channel).then(ch => {
            ch.send(`🎣 **BOSS SPOTTED!** 🎣\n${this.activeBoss.emoji} **${this.activeBoss.name}** (${this.activeBoss.rarity}) muncul di channel ini!\n💰 Hadiah: **${this.activeBoss.value.toLocaleString()} credits**\n✨ Peluang menangkap: **1%** (Sangat Langka!)`);
        }).catch(() => {});
    },
    
    async generateLeaderboardEmbed(client) {
        const topUsers = await this.User.find({ userId: { $ne: this.OWNER_ID } })
            .sort({ totalFishingCredits: -1 })
            .limit(50);
        
        const leaderboardData = [];
        for (const u of topUsers) {
            let name = "Unknown";
            try {
                const d = await client.users.fetch(u.userId);
                name = d.username;
            } catch {}
            leaderboardData.push({ 
                username: name, 
                fishingCredits: u.totalFishingCredits || 0,
                fishCaught: u.totalFishCaught || 0
            });
        }
    
        const podium = [];
        const medals = ["🥇", "🥈", "🥉"];
        for (let i = 0; i < Math.min(3, leaderboardData.length); i++) {
            const p = leaderboardData[i];
            podium.push(`${medals[i]} **${p.username}**\n   \`💰 ${p.fishingCredits.toLocaleString()} credits\` • \`🎣 ${p.fishCaught} ikan\``);
        }
    
        let top10List = "";
        for (let i = 0; i < Math.min(10, leaderboardData.length); i++) {
            const u = leaderboardData[i];
            const medal = i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i+1}.`;
            const rankIcon = i === 0 ? "🌟" : i === 1 ? "⭐" : i === 2 ? "✨" : "▫️";
            top10List += `${rankIcon} **${medal}** \`${u.username}\` • \`💰 ${u.fishingCredits.toLocaleString()} credits\` • 🎣 ${u.fishCaught}\n`;
        }
    
        const embed = new EmbedBuilder()
            .setTitle("🏆 **FISHING LEADERBOARD** 🏆")
            .setDescription(`**Top Anglers - Total Credits dari Mancing**\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🎯 **PODIUM** 🎯\n${podium.join("\n\n")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📊 **TOP 10 PLAYERS**\n${top10List}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
            .setColor(0xfacc15)
            .setThumbnail("https://cdn.discordapp.com/emojis/1025605498691330108.png")
            .setFooter({ text: `🏆 Auto-update setiap 24 jam` })
            .setTimestamp();
    
        return embed;
    },
    
    async updateLeaderboard(client) {
        try {
            const embed = await this.generateLeaderboardEmbed(client);
            const channel = await client.channels.fetch(this.ANNOUNCE_CHANNEL);
            if (!channel) return;
    
            if (this.leaderboardMessageId) {
                try {
                    const msg = await channel.messages.fetch(this.leaderboardMessageId);
                    await msg.edit({ embeds: [embed] });
                } catch {
                    const msg = await channel.send({ embeds: [embed] });
                    this.leaderboardMessageId = msg.id;
                }
            } else {
                const msg = await channel.send({ embeds: [embed] });
                this.leaderboardMessageId = msg.id;
            }
        } catch (error) {
            console.error("Gagal update fishing leaderboard:", error);
        }
    },
    
    async generateInventoryDropdown(userId) {
        const user = await this.getUser(userId);
        const inventoryItems = Array.from(user.items?.entries() || []);
        
        if (inventoryItems.length === 0) return null;
        
        const options = [];
        
        for (const [itemName, quantity] of inventoryItems) {
            let description = "";
            let emoji = "📦";
            
            if (this.rods[itemName]) {
                description = `Rod • Luck: ${this.rods[itemName].luck}x • Qty: ${quantity}`;
                emoji = this.rods[itemName].emoji;
            } else if (this.baits[itemName]) {
                description = `Bait • Luck: ${this.baits[itemName].luck}x • Qty: ${quantity}`;
                emoji = this.baits[itemName].emoji;
            } else if (this.potions[itemName]) {
                if (this.potions[itemName].luck) {
                    description = `Potion • Luck: ${this.potions[itemName].luck}x • ${this.potions[itemName].duration} menit • Qty: ${quantity}`;
                } else {
                    description = `Potion • Cooldown: -${this.potions[itemName].cooldownReduce * 100}% • ${this.potions[itemName].duration} menit • Qty: ${quantity}`;
                }
                emoji = this.potions[itemName].emoji;
            }
            
            options.push({
                label: itemName.length > 50 ? itemName.substring(0, 47) + "..." : itemName,
                description: description,
                value: itemName,
                emoji: emoji
            });
        }
        
        return options.slice(0, 25);
    },
    
    async useItem(userId, itemName) {
        const user = await this.getUser(userId);
        const quantity = user.items?.get(itemName) || 0;
        
        if (quantity === 0) {
            return { success: false, message: "❌ Kamu tidak memiliki item ini!" };
        }
        
        if (this.rods[itemName]) {
            if (user.equippedRod === itemName) {
                return { success: false, message: `❌ **${itemName}** sudah ter-equip sebagai rod!` };
            }
            await this.User.updateOne({ userId: userId }, { $set: { equippedRod: itemName } });
            return { success: true, message: `✅ Meng-equip **${itemName}** sebagai rod!`, type: "rod" };
        }
        
        if (this.baits[itemName]) {
            if (user.equippedBait === itemName) {
                return { success: false, message: `❌ **${itemName}** sudah ter-equip sebagai bait!` };
            }
            await this.User.updateOne({ userId: userId }, { $set: { equippedBait: itemName } });
            return { success: true, message: `✅ Meng-equip **${itemName}** sebagai bait!`, type: "bait" };
        }
        
        if (this.potions[itemName]) {
            const potion = this.potions[itemName];
            
            if (potion.luck && user.activePotion) {
                return { success: false, message: "❌ Masih ada luck potion aktif! Tunggu sampai habis." };
            }
            if (potion.cooldownReduce && user.activeCooldownPotion) {
                return { success: false, message: "❌ Masih ada cooldown potion aktif! Tunggu sampai habis." };
            }
            
            const removed = await this.removeItemFromInventory(userId, itemName, 1);
            if (!removed) {
                return { success: false, message: "❌ Gagal menggunakan potion!" };
            }
            
            if (potion.luck) {
                await this.User.updateOne(
                    { userId: userId },
                    { $set: { activePotion: { name: itemName, luck: potion.luck, duration: potion.duration, remain: potion.duration, expiresAt: Date.now() + (potion.duration * 60 * 1000) } } }
                );
            } else if (potion.cooldownReduce) {
                await this.User.updateOne(
                    { userId: userId },
                    { $set: { activeCooldownPotion: { name: itemName, cooldownReduce: potion.cooldownReduce, duration: potion.duration, remain: potion.duration, expiresAt: Date.now() + (potion.duration * 60 * 1000) } } }
                );
            }
            
            setTimeout(async () => {
                const currentUser = await this.getUser(userId);
                if (potion.luck && currentUser.activePotion?.name === itemName) {
                    await this.User.updateOne({ userId: userId }, { $set: { activePotion: null } });
                }
                if (potion.cooldownReduce && currentUser.activeCooldownPotion?.name === itemName) {
                    await this.User.updateOne({ userId: userId }, { $set: { activeCooldownPotion: null } });
                }
            }, potion.duration * 60 * 1000);
            
            const bonus = potion.luck ? `+${((potion.luck - 1) * 100)}% luck` : `-${potion.cooldownReduce * 100}% cooldown`;
            return { success: true, message: `✅ **${itemName}** digunakan! ${bonus} selama ${potion.duration} menit.`, type: "potion" };
        }
        
        return { success: false, message: "❌ Item tidak dapat digunakan!" };
    },
    
    // Database methods
    async getUser(id) {
        let u = await this.User.findOne({ userId: id });
        if (!u) {
            u = await this.User.create({ userId: id });
            await this.addItemToInventory(id, "Basic Rod", 1);
            await this.addItemToInventory(id, "Basic Bait", 1);
        }
        return u;
    },
    
    async addFishToInventory(userId, fishName, quantity = 1) {
        const result = await this.User.updateOne(
            { userId: userId },
            { $inc: { [`fishInventory.${fishName}`]: quantity, totalFishCaught: quantity } }
        );
        return result;
    },
    
    async removeFishFromInventory(userId, fishName, quantity = 1) {
        const user = await this.getUser(userId);
        const currentQty = user.fishInventory?.get(fishName) || 0;
        
        if (currentQty < quantity) return false;
        
        if (currentQty === quantity) {
            await this.User.updateOne(
                { userId: userId },
                { $unset: { [`fishInventory.${fishName}`]: "" } }
            );
        } else {
            await this.User.updateOne(
                { userId: userId },
                { $inc: { [`fishInventory.${fishName}`]: -quantity } }
            );
        }
        return true;
    },
    
    async addItemToInventory(userId, itemName, quantity = 1) {
        await this.User.updateOne(
            { userId: userId },
            { $inc: { [`items.${itemName}`]: quantity } }
        );
    },
    
    async removeItemFromInventory(userId, itemName, quantity = 1) {
        const user = await this.getUser(userId);
        const currentQty = user.items?.get(itemName) || 0;
        
        if (currentQty < quantity) return false;
        
        if (currentQty === quantity) {
            await this.User.updateOne(
                { userId: userId },
                { $unset: { [`items.${itemName}`]: "" } }
            );
        } else {
            await this.User.updateOne(
                { userId: userId },
                { $inc: { [`items.${itemName}`]: -quantity } }
            );
        }
        return true;
    },
    
    // Initialize game
    async init(client) {
        const mongoose = require('mongoose');
        
        const userSchema = new mongoose.Schema({
            userId: { type: String, unique: true },
            credits: { type: Number, default: 0, min: 0 },
            points: { type: Number, default: 0, min: 0 },
            fishInventory: { type: Map, of: Number, default: new Map() },
            items: { type: Map, of: Number, default: new Map() },
            equippedRod: { type: String, default: "Basic Rod" },
            equippedBait: { type: String, default: "Basic Bait" },
            favoriteFish: { type: [String], default: [] },
            activePotion: { type: Object, default: null },
            activeCooldownPotion: { type: Object, default: null },
            lastFishTime: { type: Number, default: 0 },
            lastChatTimes: { type: Map, of: Number, default: new Map() },
            lastGalleryTimes: { type: Map, of: Number, default: new Map() },
            lastReactionTime: { type: Number, default: 0 },
            lastVoiceTime: { type: Number, default: 0 },
            totalVoiceMinutes: { type: Number, default: 0 },
            seasonPoints: { type: Number, default: 0 },
            seasonFishCaught: { type: Number, default: 0 },
            activityPoints: { type: Number, default: 0 },
            totalFishingCredits: { type: Number, default: 0 },
            totalFishCaught: { type: Number, default: 0 },
            redeemedRewards: { type: [String], default: [] }
        }, { timestamps: true });
        
        this.User = mongoose.model("User", userSchema);
        
        console.log("🎣 Fishing game initialized!");
    },
    
    async onReady(client) {
        console.log("🎣 Fishing game ready!");
        
        // Start boss spawner
        setInterval(() => this.spawnBoss(client), 3 * 60 * 60 * 1000);
        
        // Update leaderboard every 24 hours
        setTimeout(() => this.updateLeaderboard(client), 5000);
        setInterval(() => this.updateLeaderboard(client), 86400000);
        
        // Update potion expiration every minute
        setInterval(async () => {
            const now = Date.now();
            await this.User.updateMany(
                { "activePotion.expiresAt": { $lt: now } },
                { $set: { activePotion: null } }
            );
            await this.User.updateMany(
                { "activeCooldownPotion.expiresAt": { $lt: now } },
                { $set: { activeCooldownPotion: null } }
            );
        }, 60000);
        
        this.spawnBoss(client);
    },
    
    // Message handler untuk command !fishing
    async handleMessage(message, client) {
        if (message.content === "!fishing") {
            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("menu_fish").setLabel("🎣 Fishing").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("menu_profile").setLabel("👤 Profile").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("menu_index").setLabel("📖 Index").setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId("menu_transfer").setLabel("💸 Transfer").setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId("menu_shop").setLabel("🛒 Shop").setStyle(ButtonStyle.Success)
            );
    
            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("menu_inventory").setLabel("🎒 Inventory").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("menu_sell").setLabel("💰 Sell Fish").setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId("menu_redeem").setLabel("🎁 Hadiah").setStyle(ButtonStyle.Primary)
            );
    
            const row3 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("menu_activity").setLabel("📊 Aktivitas").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("menu_leaderboard").setLabel("🏆 Fishing LB").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("menu_activity_leaderboard").setLabel("📊 Activity LB").setStyle(ButtonStyle.Success)
            );
    
            const components = [row1, row2, row3];
            if (this.ADMIN_IDS.includes(message.author.id)) {
                const adminRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId("admin_panel").setLabel("👑 Admin Panel").setStyle(ButtonStyle.Secondary)
                );
                components.push(adminRow);
            }
            
            await message.reply({
                content: "🎮 **FISHING BOT**",
                components: components
            });
            return true;
        }
        
        // Handle transfer command
        if (message.content.startsWith("!transfer")) {
            const target = message.mentions.users.first();
            const amount = parseInt(message.content.split(" ")[2]);
            if (!target || isNaN(amount) || amount < 100) {
                await message.reply("❌ !transfer @user jumlah (minimal 100)");
                return true;
            }
            
            const lockKey = this.acquireLock(message.author.id, "transfer", 5000);
            if (!lockKey) {
                await message.reply("⏳ Proses transfer sedang berjalan, tunggu sebentar!");
                return true;
            }
            
            try {
                const sender = await this.getUser(message.author.id);
                const receiver = await this.getUser(target.id);
                
                if (sender.credits < amount) {
                    await message.reply("❌ Credit tidak cukup");
                    return true;
                }
                
                await this.User.updateOne({ userId: message.author.id }, { $inc: { credits: -amount } });
                await this.User.updateOne({ userId: target.id }, { $inc: { credits: amount } });
                
                await message.reply(`✅ Transfer ${amount} credits ke ${target.username}`);
            } finally {
                this.releaseLock(lockKey);
            }
            return true;
        }
        
        // Handle convert command
        if (message.content.startsWith("!convert")) {
            const amount = parseInt(message.content.split(" ")[1]);
            if (isNaN(amount) || amount <= 0) {
                await message.reply("❌ !convert jumlah (1 point = 100 credits)");
                return true;
            }
            
            const lockKey = this.acquireLock(message.author.id, "convert", 5000);
            if (!lockKey) {
                await message.reply("⏳ Proses convert sedang berjalan, tunggu sebentar!");
                return true;
            }
            
            try {
                const user = await this.getUser(message.author.id);
                const creditsNeeded = amount * 100;
                if (user.credits < creditsNeeded) {
                    await message.reply(`❌ Butuh ${creditsNeeded} credits`);
                    return true;
                }
                
                await this.User.updateOne(
                    { userId: message.author.id, credits: { $gte: creditsNeeded } },
                    { $inc: { credits: -creditsNeeded, points: amount, seasonPoints: amount, activityPoints: amount } }
                );
                
                const updatedUser = await this.getUser(message.author.id);
                await message.reply(`✅ Convert ${amount} points! Sisa credits: ${updatedUser.credits}`);
            } finally {
                this.releaseLock(lockKey);
            }
            return true;
        }
        
        // Handle points command
        if (message.content === "!points") {
            const user = await this.getUser(message.author.id);
            await message.reply(`⭐ Points: ${user.points} | 🏆 Season: ${user.seasonPoints} | 📈 Activity: ${user.activityPoints} | 💰 Total Fishing: ${user.totalFishingCredits.toLocaleString()}`);
            return true;
        }
        
        // Admin commands
        if (this.ADMIN_IDS.includes(message.author.id)) {
            if (message.content.startsWith("!addcredit")) {
                const target = message.mentions.users.first();
                const amount = parseInt(message.content.split(" ")[2]);
                if (target && !isNaN(amount)) {
                    await this.User.updateOne({ userId: target.id }, { $inc: { credits: amount } });
                    await message.reply(`✅ +${amount} credits ke ${target.username}`);
                    return true;
                }
            }
            
            if (message.content.startsWith("!removecredit")) {
                const target = message.mentions.users.first();
                const amount = parseInt(message.content.split(" ")[2]);
                if (target && !isNaN(amount)) {
                    await this.User.updateOne({ userId: target.id, credits: { $gte: amount } }, { $inc: { credits: -amount } });
                    await message.reply(`❌ -${amount} credits dari ${target.username}`);
                    return true;
                }
            }
            
            if (message.content.startsWith("!addpoints")) {
                const target = message.mentions.users.first();
                const amount = parseInt(message.content.split(" ")[2]);
                if (target && !isNaN(amount)) {
                    await this.User.updateOne({ userId: target.id }, { $inc: { points: amount, seasonPoints: amount, activityPoints: amount } });
                    await message.reply(`✅ +${amount} points ke ${target.username}`);
                    return true;
                }
            }
            
            if (message.content.startsWith("!checkprofile")) {
                const target = message.mentions.users.first();
                if (target) {
                    const u = await this.getUser(target.id);
                    await message.reply(`👤 ${target.username}\n⭐ Points: ${u.points}\n💰 Credits: ${u.credits}\n🏆 Season: ${u.seasonPoints}\n📈 Activity: ${u.activityPoints}\n💰 Total Fishing: ${u.totalFishingCredits.toLocaleString()}\n🐟 Total Ikan: ${u.totalFishCaught || 0}\n🎣 Season Fish: ${u.seasonFishCaught}`);
                    return true;
                }
            }
            
            if (message.content.startsWith("!globalluck")) {
                const val = parseFloat(message.content.split(" ")[1]);
                if (!isNaN(val)) {
                    this.globalLuckBoost = val;
                    await message.reply(`🌍 Global luck: x${this.globalLuckBoost}`);
                    return true;
                }
            }
            
            if (message.content.startsWith("!setluck")) {
                const args = message.content.split(" ");
                if (args[1] && args[2]) {
                    this.channelBoost[args[1]] = parseFloat(args[2]);
                    await message.reply(`✅ Channel luck set ke x${this.channelBoost[args[1]]}`);
                    return true;
                }
            }
        }
        
        return false;
    },
    
    // Button handler
    async handleButton(interaction, client) {
        if (this.hasCooldown(interaction.user.id, interaction.customId, 2000)) {
            await interaction.reply({ content: "⏳ Tombol sedang diproses, jangan spam!", flags: 64 }).catch(() => {});
            return true;
        }
        
        try {
            const user = await this.getUser(interaction.user.id);
            
            // Fishing button
            if (interaction.customId === "menu_fish") {
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId("fish").setLabel("🎣 Mancing").setStyle(ButtonStyle.Primary)
                );
                await interaction.reply({ content: "Klik tombol di bawah!", components: [row], flags: 64 });
                return true;
            }
            
            if (interaction.customId === "fish") {
                if (!this.FISHING_CHANNELS.includes(interaction.channel.id)) {
                    await interaction.reply({ content: "❌ Bukan channel mancing!", flags: 64 });
                    return true;
                }
                
                const lockKey = this.acquireLock(interaction.user.id, "fish", 15000);
                if (!lockKey) {
                    await interaction.reply({ content: "⏳ Sedang memancing, tunggu sebentar!", flags: 64 });
                    return true;
                }
                
                try {
                    const freshUser = await this.getUser(interaction.user.id);
                    
                    let cooldownTime = 10000;
                    if (freshUser.activeCooldownPotion) {
                        cooldownTime = 10000 * (1 - freshUser.activeCooldownPotion.cooldownReduce);
                    }
                    
                    const now = Date.now();
                    if (freshUser.lastFishTime && now - freshUser.lastFishTime < cooldownTime) {
                        const remaining = Math.ceil((cooldownTime - (now - freshUser.lastFishTime)) / 1000);
                        this.releaseLock(lockKey);
                        await interaction.reply({ content: `⏳ Cooldown ${remaining} detik lagi!`, flags: 64 });
                        return true;
                    }
                    
                    await this.User.updateOne({ userId: interaction.user.id }, { $set: { lastFishTime: now } });
                    
                    const channelLuck = this.channelBoost[interaction.channel.id] || 1;
                    const rodLuck = this.rods[freshUser.equippedRod]?.luck || 1;
                    const baitLuck = this.baits[freshUser.equippedBait]?.luck || 1;
                    const potionLuck = freshUser.activePotion ? freshUser.activePotion.luck : 1;
                    const luck = rodLuck * baitLuck * this.globalLuckBoost * channelLuck * potionLuck;
                    
                    const fish = this.getFish(interaction.channel.id, luck);
                    const mutation = this.getMutation();
                    const mutationBonus = this.getMutationBonus(mutation);
                    const finalName = mutation ? `${mutation} ${fish.name}` : fish.name;
                    const totalValue = fish.value + mutationBonus;
                    
                    await this.addFishToInventory(interaction.user.id, finalName, 1);
                    await this.User.updateOne(
                        { userId: interaction.user.id },
                        { $inc: { credits: totalValue, totalFishingCredits: totalValue, seasonFishCaught: 1 } }
                    );
                    
                    let replyMsg = `🎣 ${finalName} (${fish.rarity}) +${totalValue}💰`;
                    if (mutation) replyMsg += `\n✨ Mutasi ${mutation} +${mutationBonus}💰`;
                    
                    await interaction.reply({ content: replyMsg, flags: 64 });
                } finally {
                    this.releaseLock(lockKey);
                }
                return true;
            }
            
            // Profile button
            if (interaction.customId === "menu_profile") {
                await interaction.deferReply({ flags: 64 });
                
                let totalFish = user.totalFishCaught || 0;
                const totalJenis = user.fishInventory?.size || 0;
                
                const profileEmbed = {
                    embeds: [{
                        title: `🎣 ${interaction.user.username}'s Fishing Profile`,
                        color: 0x00ae86,
                        thumbnail: { url: interaction.user.displayAvatarURL() },
                        fields: [
                            { name: "💰 **Credits**", value: `${user.credits.toLocaleString()} credits`, inline: true },
                            { name: "⭐ **Points**", value: `${user.points.toLocaleString()} points`, inline: true },
                            { name: "📈 **Activity Points**", value: `${user.activityPoints.toLocaleString()} pts`, inline: true },
                            { name: "🏆 **Total Fishing Credits**", value: `${user.totalFishingCredits.toLocaleString()} credits`, inline: true },
                            { name: "🐟 **Total Ikan**", value: `${totalFish} ekor`, inline: true },
                            { name: "📋 **Jenis Ikan**", value: `${totalJenis} jenis`, inline: true }
                        ],
                        timestamp: new Date()
                    }]
                };
                
                await interaction.editReply(profileEmbed);
                return true;
            }
            
            // Transfer button
            if (interaction.customId === "menu_transfer") {
                await interaction.reply({
                    content: "💸 **TRANSFER CREDITS**\n\nGunakan command:\n`!transfer @user jumlah`\n\nContoh: `!transfer @Kame 1000`\n\n⚠️ Minimal transfer 100 credits",
                    flags: 64
                });
                return true;
            }
            
            // Activity button
            if (interaction.customId === "menu_activity") {
                await interaction.reply({
                    embeds: [{
                        title: "📊 Activity Points System",
                        description: `Dapatkan points dari aktivitas!\n\n💬 Chat: +1 points/pesan\n📸 Gallery: +5 post, +2 komentar\n🎯 Reaction: +3 points\n🎙️ Voice: +1 points/2 menit (min 2 orang)\n\n⭐ Points: ${user.points}\n🏆 Season: ${user.seasonPoints}\n📈 Activity Points: ${user.activityPoints}`,
                        color: 0x00ff88
                    }], flags: 64
                });
                return true;
            }
            
            // Leaderboard buttons
            if (interaction.customId === "menu_leaderboard") {
                await interaction.deferReply({ flags: 64 });
                const embed = await this.generateLeaderboardEmbed(client);
                await interaction.editReply({ embeds: [embed] });
                return true;
            }
            
            if (interaction.customId === "menu_activity_leaderboard") {
                await interaction.reply({ content: "📊 Activity Leaderboard coming soon!", flags: 64 });
                return true;
            }
            
            // Back to menu
            if (interaction.customId === "back_to_menu") {
                const row1 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId("menu_fish").setLabel("🎣 Fishing").setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId("menu_profile").setLabel("👤 Profile").setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId("menu_index").setLabel("📖 Index").setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId("menu_transfer").setLabel("💸 Transfer").setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId("menu_shop").setLabel("🛒 Shop").setStyle(ButtonStyle.Success)
                );
                
                const row2 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId("menu_inventory").setLabel("🎒 Inventory").setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId("menu_sell").setLabel("💰 Sell Fish").setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId("menu_redeem").setLabel("🎁 Hadiah").setStyle(ButtonStyle.Primary)
                );
                
                const row3 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId("menu_activity").setLabel("📊 Aktivitas").setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId("menu_leaderboard").setLabel("🏆 Fishing LB").setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId("menu_activity_leaderboard").setLabel("📊 Activity LB").setStyle(ButtonStyle.Success)
                );
                
                const components = [row1, row2, row3];
                if (this.ADMIN_IDS.includes(interaction.user.id)) {
                    const adminRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId("admin_panel").setLabel("👑 Admin Panel").setStyle(ButtonStyle.Secondary)
                    );
                    components.push(adminRow);
                }
                
                await interaction.update({
                    content: "🎮 **FISHING BOT**",
                    components: components
                });
                return true;
            }
            
            // Shop, Inventory, Sell, Redeem, Index handlers (simplified for brevity)
            // You can add the full implementations here
            
        } catch (error) {
            console.error("Error in fishing button handler:", error);
        }
        
        return false;
    },
    
    // Select menu handler
    async handleSelectMenu(interaction, client) {
        // Handle index map select
        if (interaction.customId === "index_map") {
            const channelId = interaction.values[0];
            const zone = this.fishingZones[channelId];
            if (!zone) {
                await interaction.reply({ content: "❌ Zona tidak ditemukan!", flags: 64 });
                return true;
            }
            
            let text = `📖 **DAFTAR IKAN - ${this.getZoneName(channelId)}**\n\n`;
            text += `┌─────────────────────────────┐\n`;
            
            const rarityOrder = ["Secret", "Mythic", "Legendary", "Epic", "Rare", "Uncommon", "Common"];
            const sortedZone = [...zone].sort((a, b) => {
                return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
            });
            
            for (const fish of sortedZone) {
                const rarityEmoji = {
                    "Secret": "🔮", "Mythic": "🏆", "Legendary": "🌟",
                    "Epic": "💜", "Rare": "💙", "Uncommon": "💚", "Common": "🤍"
                };
                text += `${rarityEmoji[fish.rarity] || "🐟"} **${fish.name}** (${fish.rarity}) - ${fish.value}💰\n`;
            }
            
            text += `└─────────────────────────────┘\n\n✨ Total: ${zone.length} jenis ikan`;
            
            const backBtn = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("menu_index").setLabel("🔙 Kembali ke Pilih Zona").setStyle(ButtonStyle.Secondary)
            );
            
            await interaction.update({ content: text, components: [backBtn] });
            return true;
        }
        
        return false;
    }
};

module.exports = gameModule;