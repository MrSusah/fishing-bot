const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv/config');

// Import activity handler
const activityHandler = require('./handlers/activityHandler');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMembers
    ]
});

// Collections
client.commands = new Collection();
client.cooldowns = new Collection();
client.games = new Collection();
client.prefixCommands = new Collection();

const PREFIX = '!';

// Load prefix commands
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        if (command.name && command.executePrefix) {
            client.prefixCommands.set(command.name, command);
            console.log(`✅ Loaded command: ${command.name}`);
        }
    }
}

// Load game modules
const gamesPath = path.join(__dirname, 'games');
if (fs.existsSync(gamesPath)) {
    const gameFiles = fs.readdirSync(gamesPath).filter(file => file.endsWith('.js'));
    for (const file of gameFiles) {
        const game = require(`./games/${file}`);
        if (game.name) {
            client.games.set(game.name, game);
            console.log(`🎮 Loaded game: ${game.name}`);
            if (game.init && typeof game.init === 'function') {
                game.init(client);
            }
        }
    }
}

// Leaderboard Scheduler
const leaderboardScheduler = require('./handlers/leaderboardScheduler');

// Ready event
client.once('ready', async () => {
    console.log(`✅ Bot online as ${client.user.tag}`);
    console.log(`📊 Bot sedang berjalan di ${client.guilds.cache.size} server`);
    console.log(`🎮 Prefix command: ${PREFIX}`);
    
    activityHandler.startVoicePointsChecker(client);
    
    for (const [name, game] of client.games) {
        if (game.onReady && typeof game.onReady === 'function') {
            await game.onReady(client);
        }
    }
    
    // Start leaderboard scheduler
    leaderboardScheduler.startLeaderboardScheduler(client);
});

// Button Handler
client.on('interactionCreate', async interaction => {
    if (interaction.isModalSubmit()) {
        for (const [name, game] of client.games) {
            if (game.handleModalSubmit && typeof game.handleModalSubmit === 'function') {
                const handled = await game.handleModalSubmit(interaction, client);
                if (handled) return;
            }
        }
        return;
    }
    
    if (interaction.isButton()) {
        const customId = interaction.customId;
        
        // Menu Utama - Fishing
        if (customId === "menu_fishing") {
            const fishingModule = client.games.get('fishing');
            if (fishingModule && fishingModule.showFishingMenu) {
                await fishingModule.showFishingMenu(interaction);
            } else {
                await interaction.reply({ content: "❌ Modul fishing tidak tersedia!", flags: 64 });
            }
            return;
        }
        
        // Menu Utama - Hunt
        if (customId === "menu_hunt") {
            await interaction.reply({ 
                content: "🏹 **HUNT**\n\nGunakan command `!hunt` untuk berburu hewan!\n\n💰 Reward: 50-200 credits\n🎯 Win Chance: 60%\n⏰ Cooldown: 1 jam\n\n📍 Channel khusus: <#1495049686363410535>",
                flags: 64 
            });
            return;
        }
        
        // Menu Utama - Dungeon
        if (customId === "menu_dungeon") {
            await interaction.reply({ 
                content: "🏰 **DUNGEON**\n\nGunakan command `!dungeon` untuk menjelajahi dungeon!\n\n💰 Reward: 200-1000 credits\n🎯 Win Chance: 40%\n⏰ Cooldown: 2 jam\n\n📍 Channel khusus: <#1495049686363410535>",
                flags: 64 
            });
            return;
        }
        
        // Menu Utama - Casino
        if (customId === "menu_casino") {
            const casinoCmd = client.prefixCommands.get('casino');
            if (casinoCmd) {
                const fakeMessage = {
                    channelId: interaction.channel.id,
                    author: interaction.user,
                    channel: interaction.channel,
                    reply: async (options) => {
                        await interaction.reply({ ...options, flags: 64 });
                    }
                };
                await casinoCmd.executePrefix(fakeMessage, [], client);
            }
            return;
        }
        
        // Menu Utama - Profile
        if (customId === "menu_profile") {
            const profileCmd = client.prefixCommands.get('profile');
            if (profileCmd) {
                const fakeMessage = {
                    author: interaction.user,
                    channel: interaction.channel,
                    reply: async (options) => {
                        await interaction.reply({ ...options, flags: 64 });
                    }
                };
                await profileCmd.executePrefix(fakeMessage, [], client);
            }
            return;
        }
        
        // Menu Utama - Reward
        if (customId === "menu_reward") {
            const rewardCmd = client.prefixCommands.get('reward');
            if (rewardCmd) {
                const fakeMessage = {
                    author: interaction.user,
                    channel: interaction.channel,
                    reply: async (options) => {
                        await interaction.reply({ ...options, flags: 64 });
                    }
                };
                await rewardCmd.executePrefix(fakeMessage, [], client);
            }
            return;
        }
        
        // Menu Utama - Activity
        if (customId === "menu_activity") {
            const activityCmd = client.prefixCommands.get('activity');
            if (activityCmd) {
                const fakeMessage = {
                    author: interaction.user,
                    channel: interaction.channel,
                    reply: async (options) => {
                        await interaction.reply({ ...options, flags: 64 });
                    }
                };
                await activityCmd.executePrefix(fakeMessage, [], client);
            }
            return;
        }
        
        // Menu Utama - Fishing Leaderboard
        if (customId === "menu_fishing_lb") {
            const fishingGame = client.games.get('fishing');
            if (fishingGame && fishingGame.generateLeaderboardEmbed) {
                await interaction.deferReply({ flags: 64 });
                const embed = await fishingGame.generateLeaderboardEmbed(client);
                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.reply({ content: "❌ Leaderboard tidak tersedia!", flags: 64 });
            }
            return;
        }
        
        // Menu Utama - Points Leaderboard
        if (customId === "menu_points_lb") {
            const { User } = require('./database/mongo');
            const { EmbedBuilder } = require('discord.js');
            await interaction.deferReply({ flags: 64 });
            
            const topUsers = await User.find().sort({ points: -1 }).limit(10);
            let leaderboardText = "";
            
            for (let i = 0; i < topUsers.length; i++) {
                const userPoint = topUsers[i];
                let name = "Unknown";
                try {
                    const d = await client.users.fetch(userPoint.userId);
                    name = d.username;
                } catch {}
                
                const medal = i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i+1}.`;
                leaderboardText += `${medal} **${name}** - ${userPoint.points.toLocaleString()} points\n`;
            }
            
            const embed = new EmbedBuilder()
                .setTitle("⭐ POINTS LEADERBOARD")
                .setDescription(leaderboardText || "Belum ada data")
                .setColor(0xffd700)
                .setFooter({ text: "💡 100 credits = 1 point" })
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
            return;
        }
        
        // Back to Main Menu
        if (customId === "back_to_main_menu") {
            const gameCmd = client.prefixCommands.get('game');
            if (gameCmd) {
                const fakeMessage = {
                    channelId: interaction.channel.id,
                    author: interaction.user,
                    channel: interaction.channel,
                    reply: async (options) => {
                        await interaction.update(options);
                    }
                };
                await gameCmd.executePrefix(fakeMessage, [], client);
            }
            return;
        }
        
        // Back to Casino
        if (customId === "back_to_casino") {
            const casinoCmd = client.prefixCommands.get('casino');
            if (casinoCmd) {
                const fakeMessage = {
                    channelId: interaction.channel.id,
                    author: interaction.user,
                    channel: interaction.channel,
                    reply: async (options) => {
                        await interaction.update(options);
                    }
                };
                await casinoCmd.executePrefix(fakeMessage, [], client);
            }
            return;
        }
        
        // Reward Buttons
        if (customId === "reward_daily" || customId === "reward_hourly" || 
            customId === "reward_weekly" || customId === "reward_monthly" || 
            customId === "reward_yearly") {
            const rewardCmd = client.prefixCommands.get('reward');
            if (rewardCmd) {
                let arg = "";
                if (customId === "reward_daily") arg = "daily";
                if (customId === "reward_hourly") arg = "hourly";
                if (customId === "reward_weekly") arg = "weekly";
                if (customId === "reward_monthly") arg = "monthly";
                if (customId === "reward_yearly") arg = "yearly";
                
                const fakeMessage = {
                    author: interaction.user,
                    channel: interaction.channel,
                    reply: async (options) => {
                        await interaction.reply({ ...options, flags: 64 });
                    }
                };
                await rewardCmd.executePrefix(fakeMessage, [arg], client);
            }
            return;
        }
        
        // Casino Game Buttons
        if (customId === "casino_cf") {
            await interaction.reply({ content: "🪙 **COIN FLIP**\n\nGunakan command:\n`!cf kepala 100` atau `!cf ekor 100`\n\n🎯 Win Chance: 30%\n💰 Payout: x2", flags: 64 });
            return;
        }
        if (customId === "casino_rps") {
            await interaction.reply({ content: "✊ **ROCK PAPER SCISSORS**\n\nGunakan command:\n`!rps rock 100`\n`!rps paper 100`\n`!rps scissors 100`\n\n💰 Payout: x2", flags: 64 });
            return;
        }
        if (customId === "casino_slots") {
            await interaction.reply({ content: "🎰 **SLOT MACHINE**\n\nGunakan command:\n`!slots 100`\n\n🎰 Jackpot: x15\n🎰 Pair: x1.5", flags: 64 });
            return;
        }
        if (customId === "casino_roulette") {
            await interaction.reply({ content: "🎡 **ROULETTE**\n\nGunakan command:\n`!roulette 100 red`\n`!roulette 100 black`\n`!roulette 100 7`\n\n💰 Red/Black: x2\n💰 Nomor tepat: x36", flags: 64 });
            return;
        }
        if (customId === "casino_dice") {
            await interaction.reply({ content: "🎲 **DICE HIGH/LOW**\n\nGunakan command:\n`!dadu high 100`\n`!dadu low 100`\n\n🎯 High: 4-6\n🎯 Low: 1-3\n💰 Payout: x2", flags: 64 });
            return;
        }
        
        // Fishing menu buttons
        if (customId === "menu_fish" || customId === "menu_index" || customId === "menu_convert" ||
            customId === "menu_shop" || customId === "menu_inventory" || customId === "menu_sell" ||
            customId === "menu_redeem" || customId === "menu_transfer" || customId === "menu_activity" ||
            customId === "menu_leaderboard" || customId === "menu_points_leaderboard" || customId === "fish" ||
            customId === "back_to_menu") {
            const fishingModule = client.games.get('fishing');
            if (fishingModule && fishingModule.handleButton) {
                await fishingModule.handleButton(interaction, client);
            }
            return;
        }
        
        // Game buttons (hunt/dungeon)
        if (customId === "play_hunt") {
            const huntModule = client.games.get('hunt');
            if (huntModule && huntModule.executeGame) {
                await huntModule.executeGame(interaction);
            } else {
                await interaction.reply({ content: "❌ Game hunt tidak tersedia! Gunakan command `!hunt`", flags: 64 });
            }
            return;
        }
        
        if (customId === "play_dungeon") {
            const dungeonModule = client.games.get('dungeon');
            if (dungeonModule && dungeonModule.executeGame) {
                await dungeonModule.executeGame(interaction);
            } else {
                await interaction.reply({ content: "❌ Game dungeon tidak tersedia! Gunakan command `!dungeon`", flags: 64 });
            }
            return;
        }
        
        // Fallback
        console.log(`⚠️ Unhandled button: ${customId}`);
        await interaction.reply({ content: `❌ Tombol ${customId} belum terhubung!`, flags: 64 });
        return;
    }
    
    // Handle select menus
    if (interaction.isStringSelectMenu()) {
        for (const [name, game] of client.games) {
            if (game.handleSelectMenu && typeof game.handleSelectMenu === 'function') {
                const handled = await game.handleSelectMenu(interaction, client);
                if (handled) return;
            }
        }
        console.log(`⚠️ Unhandled select menu: ${interaction.customId}`);
        return;
    }
    
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (command) {
            try {
                await command.execute(interaction, client);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: '❌ Terjadi kesalahan!', ephemeral: true });
            }
        }
    }
});

// Message handler for prefix commands
client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;
    
    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    const command = client.prefixCommands.get(commandName);
    if (!command) return;
    
    try {
        await command.executePrefix(message, args, client);
    } catch (error) {
        console.error(`Error executing command ${commandName}:`, error);
        await message.reply('❌ Terjadi kesalahan saat menjalankan command!');
    }
});

// Reaction handler
client.on('messageReactionAdd', async (reaction, user) => {
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            return;
        }
    }
    await activityHandler.handleReactionActivity(reaction, user);
});

// Voice state handler
client.on('voiceStateUpdate', async (oldState, newState) => {
    await activityHandler.handleVoiceJoin(oldState, newState);
});

// Presence handler
client.on('presenceUpdate', async (oldPresence, newPresence) => {
    await activityHandler.handlePresenceUpdate(oldPresence, newPresence);
});

// Error handling
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
});

// Login
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

client.login(process.env.TOKEN);