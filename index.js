const { Client, GatewayIntentBits, REST, Routes, Collection, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv/config');

// Import utilities
const economy = require('./utils/economy');
const cooldown = require('./utils/cooldown');
const channelValidator = require('./utils/channelValidator');
const GameHandler = require('./handlers/gameHandler');
const Database = require('./database/mongo');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// Collections
client.commands = new Collection();
client.cooldowns = new Collection();
client.games = new Collection();

// Load commands
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        try {
            const command = require(`./commands/${file}`);
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
                commands.push(command.data.toJSON());
                console.log(`✅ Loaded command: ${command.data.name}`);
            } else if ('name' in command && 'execute' in command) {
                // For non-slash commands
                client.commands.set(command.name, command);
                console.log(`✅ Loaded prefix command: ${command.name}`);
            }
        } catch (error) {
            console.error(`❌ Error loading command ${file}:`, error);
        }
    }
} else {
    console.log('📁 Folder commands tidak ditemukan, buat folder commands untuk menambahkan slash commands');
    fs.mkdirSync(commandsPath, { recursive: true });
}

// Load game modules
const gamesPath = path.join(__dirname, 'games');
if (fs.existsSync(gamesPath)) {
    const gameFiles = fs.readdirSync(gamesPath).filter(file => file.endsWith('.js'));
    
    for (const file of gameFiles) {
        try {
            const game = require(`./games/${file}`);
            if (game.name) {
                client.games.set(game.name, game);
                console.log(`🎮 Loaded game: ${game.name}`);
                
                // Initialize game if it has init function
                if (game.init && typeof game.init === 'function') {
                    game.init(client);
                }
            } else {
                // For games that export functions instead of object
                const gameName = path.basename(file, '.js');
                client.games.set(gameName, game);
                console.log(`🎮 Loaded game module: ${gameName}`);
            }
        } catch (error) {
            console.error(`❌ Error loading game ${file}:`, error);
        }
    }
} else {
    console.log('📁 Folder games tidak ditemukan, buat folder games untuk menambahkan game modules');
    fs.mkdirSync(gamesPath, { recursive: true });
}

// Utility function to handle game interactions
const gameHandler = {
    async handleButton(interaction, client) {
        // First, try the new GameHandler
        try {
            await GameHandler.handleGameInteraction(interaction);
            return true;
        } catch (error) {
            // If GameHandler doesn't handle it, try individual games
            for (const [name, game] of client.games) {
                if (game.handleButton && typeof game.handleButton === 'function') {
                    try {
                        const handled = await game.handleButton(interaction, client);
                        if (handled) return true;
                    } catch (err) {
                        console.error(`Error in game ${name} handleButton:`, err);
                    }
                }
            }
        }
        return false;
    },
    
    async handleSelectMenu(interaction, client) {
        for (const [name, game] of client.games) {
            if (game.handleSelectMenu && typeof game.handleSelectMenu === 'function') {
                try {
                    const handled = await game.handleSelectMenu(interaction, client);
                    if (handled) return true;
                } catch (err) {
                    console.error(`Error in game ${name} handleSelectMenu:`, err);
                }
            }
        }
        return false;
    },
    
    async handleMessage(interaction, client) {
        for (const [name, game] of client.games) {
            if (game.handleMessage && typeof game.handleMessage === 'function') {
                try {
                    const handled = await game.handleMessage(interaction, client);
                    if (handled) return true;
                } catch (err) {
                    console.error(`Error in game ${name} handleMessage:`, err);
                }
            }
        }
        return false;
    }
};

// Ready event
client.once('ready', async () => {
    console.log(`✅ Bot online as ${client.user.tag}`);
    console.log(`📊 Bot sedang berjalan di ${client.guilds.cache.size} server`);
    
    // Register slash commands
    if (commands.length > 0) {
        const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
        
        try {
            await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: commands }
            );
            console.log(`✅ Registered ${commands.length} slash commands`);
        } catch (error) {
            console.error('❌ Gagal register slash commands:', error);
        }
    }
    
    // Trigger ready event for all games
    for (const [name, game] of client.games) {
        if (game.onReady && typeof game.onReady === 'function') {
            try {
                await game.onReady(client);
            } catch (err) {
                console.error(`Error in game ${name} onReady:`, err);
            }
        }
    }
    
    // Set bot status
    client.user.setPresence({
        activities: [{ name: '!game | !casino', type: 3 }],
        status: 'online'
    });
});

// Interaction handler
client.on('interactionCreate', async interaction => {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        
        if (!command) {
            return interaction.reply({ 
                content: '❌ Command tidak ditemukan!', 
                ephemeral: true 
            });
        }
        
        try {
            await command.execute(interaction, client);
        } catch (error) {
            console.error(`Error executing command ${interaction.commandName}:`, error);
            const errorMsg = '❌ Terjadi kesalahan saat menjalankan command!';
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: errorMsg, ephemeral: true });
            } else {
                await interaction.reply({ content: errorMsg, ephemeral: true });
            }
        }
    }
    
    // Handle buttons
    if (interaction.isButton()) {
        try {
            const handled = await gameHandler.handleButton(interaction, client);
            if (!handled) {
                console.log(`⚠️ Unhandled button: ${interaction.customId}`);
                // Only reply if not already replied
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ 
                        content: '❌ Tombol ini tidak valid atau sudah kadaluarsa!', 
                        ephemeral: true 
                    });
                }
            }
        } catch (error) {
            console.error('Error handling button:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: '❌ Terjadi kesalahan saat memproses tombol!', 
                    ephemeral: true 
                });
            }
        }
    }
    
    // Handle select menus
    if (interaction.isStringSelectMenu()) {
        try {
            const handled = await gameHandler.handleSelectMenu(interaction, client);
            if (!handled) {
                console.log(`⚠️ Unhandled select menu: ${interaction.customId}`);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ 
                        content: '❌ Menu ini tidak valid atau sudah kadaluarsa!', 
                        ephemeral: true 
                    });
                }
            }
        } catch (error) {
            console.error('Error handling select menu:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: '❌ Terjadi kesalahan saat memproses menu!', 
                    ephemeral: true 
                });
            }
        }
    }
});

// Message handler for prefix commands
client.on('messageCreate', async message => {
    if (message.author.bot) return;
    
    // Check for prefix commands (using ! prefix)
    if (!message.content.startsWith('!')) return;
    
    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    // Handle prefix commands
    const command = client.commands.get(commandName);
    if (command && command.executePrefix) {
        try {
            await command.executePrefix(message, args, client);
        } catch (error) {
            console.error(`Error executing prefix command ${commandName}:`, error);
            await message.reply('❌ Terjadi kesalahan saat menjalankan command!');
        }
    }
    
    // Let games handle messages if needed
    const handled = await gameHandler.handleMessage(message, client);
    if (!handled) {
        // Optional: handle non-game messages here
    }
});

// Error handling
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    await Database.disconnect();
    await mongoose.disconnect();
    client.destroy();
    process.exit(0);
});

// ================= LOGIN =================
async function startBot() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB connected via Mongoose');
        
        // Connect custom database handler
        await Database.connect(process.env.MONGO_URI, 'discord_bot');
        
        // Login bot
        await client.login(process.env.TOKEN);
    } catch (error) {
        console.error('❌ Failed to start bot:', error);
        process.exit(1);
    }
}

startBot();