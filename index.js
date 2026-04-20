const { Client, GatewayIntentBits, REST, Routes, Collection, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv/config');

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

// Create commands folder if it doesn't exist
if (!fs.existsSync(commandsPath)) {
    fs.mkdirSync(commandsPath, { recursive: true });
    console.log('📁 Created commands folder');
}

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    try {
        const command = require(`./commands/${file}`);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            commands.push(command.data.toJSON());
            console.log(`✅ Loaded slash command: ${command.data.name}`);
        } else if ('name' in command && 'execute' in command) {
            client.commands.set(command.name, command);
            console.log(`✅ Loaded prefix command: ${command.name}`);
        }
    } catch (error) {
        console.error(`❌ Error loading command ${file}:`, error.message);
    }
}

// Load game modules
const gamesPath = path.join(__dirname, 'games');

// Create games folder if it doesn't exist
if (!fs.existsSync(gamesPath)) {
    fs.mkdirSync(gamesPath, { recursive: true });
    console.log('📁 Created games folder');
}

const gameFiles = fs.readdirSync(gamesPath).filter(file => file.endsWith('.js'));

for (const file of gameFiles) {
    try {
        const game = require(`./games/${file}`);
        if (game.name) {
            client.games.set(game.name, game);
            console.log(`🎮 Loaded game: ${game.name}`);
        } else if (typeof game === 'object') {
            const gameName = path.basename(file, '.js');
            client.games.set(gameName, game);
            console.log(`🎮 Loaded game module: ${gameName}`);
        }
    } catch (error) {
        console.error(`❌ Error loading game ${file}:`, error.message);
    }
}

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
            }).catch(console.error);
        }
        
        try {
            await command.execute(interaction, client);
        } catch (error) {
            console.error(`Error executing command ${interaction.commandName}:`, error);
            const errorMsg = '❌ Terjadi kesalahan saat menjalankan command!';
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: errorMsg, ephemeral: true }).catch(console.error);
            } else {
                await interaction.reply({ content: errorMsg, ephemeral: true }).catch(console.error);
            }
        }
    }
    
    // Handle buttons for games
    if (interaction.isButton()) {
        // Try to find game that handles this button
        let handled = false;
        for (const [name, game] of client.games) {
            if (game.handleButton && typeof game.handleButton === 'function') {
                try {
                    const result = await game.handleButton(interaction, client);
                    if (result) {
                        handled = true;
                        break;
                    }
                } catch (err) {
                    console.error(`Error in game ${name} handleButton:`, err);
                }
            }
        }
        
        if (!handled && !interaction.replied && !interaction.deferred) {
            await interaction.reply({ 
                content: '❌ Tombol ini tidak valid atau sudah kadaluarsa!', 
                ephemeral: true 
            }).catch(console.error);
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
            await message.reply('❌ Terjadi kesalahan saat menjalankan command!').catch(console.error);
        }
    } else if (command && command.execute) {
        // If command only has execute for slash, notify to use slash
        await message.reply(`❌ Gunakan /${commandName} untuk command ini!`).catch(console.error);
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
    await mongoose.disconnect();
    client.destroy();
    process.exit(0);
});

// ================= LOGIN =================
mongoose.connect(process.env.MONGO_URI);
client.login(process.env.TOKEN);