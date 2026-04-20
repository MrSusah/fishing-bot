const { Client, GatewayIntentBits, REST, Routes, Collection } = require('discord.js');
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
        GatewayIntentBits.GuildPresences,  // Tambahan untuk presence tracking
        GatewayIntentBits.GuildMembers      // Tambahan untuk member tracking
    ]
});

// Collections
client.commands = new Collection();
client.cooldowns = new Collection();
client.games = new Collection();
client.prefixCommands = new Collection();

// Prefix untuk command
const PREFIX = '!';

// Load prefix commands dari folder commands
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        if (command.name && command.execute) {
            client.prefixCommands.set(command.name, command);
            console.log(`✅ Loaded prefix command: ${command.name}`);
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
} else {
    console.log('📁 Folder games tidak ditemukan, buat folder games untuk menambahkan game modules');
    fs.mkdirSync(gamesPath, { recursive: true });
}

// Utility function to handle game interactions
// Import game handler from utils
const gameHandlerUtil = require('./utils/gameHandler');

// Set game modules
const gameModules = {};
for (const [name, game] of client.games) {
    gameModules[name] = game;
}
gameHandlerUtil.setGameModules(gameModules);

// Utility function to handle game interactions
const gameHandler = {
    async handleButton(interaction, client) {
        // Cek di game modules dulu
        for (const [name, game] of client.games) {
            if (game.handleButton && typeof game.handleButton === 'function') {
                const handled = await game.handleButton(interaction, client);
                if (handled) return true;
            }
        }
        
        // Cek di main game handler
        const handled = await gameHandlerUtil.handleGameButton(interaction, client);
        if (handled) return true;
        
        return false;
    },
    
    async handleSelectMenu(interaction, client) {
        for (const [name, game] of client.games) {
            if (game.handleSelectMenu && typeof game.handleSelectMenu === 'function') {
                const handled = await game.handleSelectMenu(interaction, client);
                if (handled) return true;
            }
        }
        return false;
    },
    
    async handleModalSubmit(interaction, client) {
        for (const [name, game] of client.games) {
            if (game.handleModalSubmit && typeof game.handleModalSubmit === 'function') {
                const handled = await game.handleModalSubmit(interaction, client);
                if (handled) return true;
            }
        }
        return false;
    },
    
    async handleMessage(message, client) {
        if (!message.content.startsWith(PREFIX)) {
            await activityHandler.handleChatActivity(message);
            await activityHandler.handleGalleryActivity(message);
            return false;
        }
        
        const args = message.content.slice(PREFIX.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        await activityHandler.handleCommandActivity(message.author.id, commandName);
        
        const prefixCommand = client.prefixCommands.get(commandName);
        if (prefixCommand) {
            try {
                await prefixCommand.execute(message, args, client);
            } catch (error) {
                console.error(error);
                await message.reply('❌ Terjadi kesalahan saat menjalankan command!');
            }
            return true;
        }
        
        for (const [name, game] of client.games) {
            if (game.handleMessage && typeof game.handleMessage === 'function') {
                const handled = await game.handleMessage(message, client);
                if (handled) return true;
            }
        }
        return false;
    }
};

// Ready event
client.once('ready', async () => {
    console.log(`✅ Bot online as ${client.user.tag}`);
    console.log(`📊 Bot sedang berjalan di ${client.guilds.cache.size} server`);
    console.log(`🎮 Prefix command: ${PREFIX}`);
    
    // Start voice points checker
    activityHandler.startVoicePointsChecker(client);
    
    // Trigger ready event for all games
    for (const [name, game] of client.games) {
        if (game.onReady && typeof game.onReady === 'function') {
            await game.onReady(client);
        }
    }
    
    // Optional: Set season reset setiap bulan
    // activityHandler.resetSeasonPoints();
});

// Interaction handler
// Cari bagian interaction handler dan update handleButton
client.on('interactionCreate', async interaction => {
    // Handle modal submit
    if (interaction.isModalSubmit()) {
        const handled = await gameHandler.handleModalSubmit(interaction, client);
        if (!handled) {
            console.log(`⚠️ Unhandled modal: ${interaction.customId}`);
        }
        return;
    }
    
    // Handle buttons
    if (interaction.isButton()) {
        // Cek apakah button dari menu utama (fishing, hunt, casino, profile, reward, activity)
        const customId = interaction.customId;
        
        // Menu utama buttons
        if (customId === "menu_fishing") {
            const fishingModule = client.games.get('fishing');
            if (fishingModule && fishingModule.showFishingMenu) {
                await fishingModule.showFishingMenu(interaction);
            } else {
                await interaction.reply({ content: "❌ Modul fishing tidak tersedia!", flags: 64 });
            }
            return;
        }
        
        if (customId === "menu_hunt") {
            const huntModule = client.games.get('hunt');
            if (huntModule && huntModule.showGameMenu) {
                await huntModule.showGameMenu(interaction);
            } else {
                await interaction.reply({ content: "❌ Modul hunt tidak tersedia!", flags: 64 });
            }
            return;
        }
        
        if (customId === "menu_casino") {
            const casinoCommand = client.prefixCommands.get('casino');
            if (casinoCommand) {
                // Buat fake message untuk executePrefix
                const fakeMessage = {
                    channelId: interaction.channel.id,
                    author: interaction.user,
                    member: interaction.member,
                    channel: interaction.channel,
                    guild: interaction.guild,
                    reply: async (options) => {
                        if (options.embeds) {
                            await interaction.reply({ embeds: options.embeds, components: options.components, flags: 64 });
                        } else {
                            await interaction.reply(options);
                        }
                    }
                };
                await casinoCommand.executePrefix(fakeMessage, [], client);
            } else {
                await interaction.reply({ content: "❌ Modul casino tidak tersedia!", flags: 64 });
            }
            return;
        }
        
        if (customId === "menu_profile") {
            const profileCommand = client.prefixCommands.get('profile');
            if (profileCommand) {
                const fakeMessage = {
                    channelId: interaction.channel.id,
                    author: interaction.user,
                    member: interaction.member,
                    channel: interaction.channel,
                    guild: interaction.guild,
                    mentions: { users: { first: () => null } },
                    reply: async (options) => {
                        if (options.embeds) {
                            await interaction.reply({ embeds: options.embeds, components: options.components, flags: 64 });
                        } else {
                            await interaction.reply(options);
                        }
                    }
                };
                await profileCommand.executePrefix(fakeMessage, [], client);
            } else {
                await interaction.reply({ content: "❌ Modul profile tidak tersedia!", flags: 64 });
            }
            return;
        }
        
        if (customId === "menu_reward") {
            const rewardCommand = client.prefixCommands.get('reward');
            if (rewardCommand) {
                const fakeMessage = {
                    channelId: interaction.channel.id,
                    author: interaction.user,
                    member: interaction.member,
                    channel: interaction.channel,
                    guild: interaction.guild,
                    reply: async (options) => {
                        if (options.embeds) {
                            await interaction.reply({ embeds: options.embeds, components: options.components, flags: 64 });
                        } else {
                            await interaction.reply(options);
                        }
                    }
                };
                await rewardCommand.executePrefix(fakeMessage, [], client);
            } else {
                await interaction.reply({ content: "❌ Modul reward tidak tersedia!", flags: 64 });
            }
            return;
        }
        
        if (customId === "menu_activity") {
            const activityCommand = client.prefixCommands.get('activity');
            if (activityCommand) {
                const fakeMessage = {
                    channelId: interaction.channel.id,
                    author: interaction.user,
                    member: interaction.member,
                    channel: interaction.channel,
                    guild: interaction.guild,
                    reply: async (options) => {
                        if (options.embeds) {
                            await interaction.reply({ embeds: options.embeds, components: options.components, flags: 64 });
                        } else {
                            await interaction.reply(options);
                        }
                    }
                };
                await activityCommand.executePrefix(fakeMessage, [], client);
            } else {
                await interaction.reply({ content: "❌ Modul activity tidak tersedia!", flags: 64 });
            }
            return;
        }
        
        if (customId === "back_to_main_menu") {
            const gameCommand = client.prefixCommands.get('game');
            if (gameCommand) {
                const fakeMessage = {
                    channelId: interaction.channel.id,
                    author: interaction.user,
                    member: interaction.member,
                    channel: interaction.channel,
                    guild: interaction.guild,
                    reply: async (options) => {
                        if (options.embeds) {
                            await interaction.update({ embeds: options.embeds, components: options.components });
                        } else {
                            await interaction.update(options);
                        }
                    }
                };
                await gameCommand.executePrefix(fakeMessage, [], client);
            } else {
                await interaction.reply({ content: "❌ Kembali ke menu utama", flags: 64 });
            }
            return;
        }
        
        // Cek di game modules untuk button lain (fishing, hunt, dll)
        const handled = await gameHandler.handleButton(interaction, client);
        if (!handled) {
            console.log(`⚠️ Unhandled button: ${interaction.customId}`);
        }
        return;
    }
    
    // Handle select menus
    if (interaction.isStringSelectMenu()) {
        const handled = await gameHandler.handleSelectMenu(interaction, client);
        if (!handled) {
            console.log(`⚠️ Unhandled select menu: ${interaction.customId}`);
        }
        return;
    }
    
    // Handle slash commands (jika ada)
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

// Message handler for prefix commands and games
client.on('messageCreate', async message => {
    if (message.author.bot) return;
    
    const handled = await gameHandler.handleMessage(message, client);
    if (!handled) {
        // Optional: handle non-game messages here
    }
});

// Reaction handler for activity points
client.on('messageReactionAdd', async (reaction, user) => {
    // Handle partial reaction
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Error fetching reaction:', error);
            return;
        }
    }
    
    await activityHandler.handleReactionActivity(reaction, user);
});

// Voice state handler for activity points
client.on('voiceStateUpdate', async (oldState, newState) => {
    await activityHandler.handleVoiceJoin(oldState, newState);
});

// Presence handler for activity points (opsional)
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

// ================= LOGIN =================
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

client.login(process.env.TOKEN);