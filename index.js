const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
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

// Load commands from commands folder
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    try {
        const command = require(`./commands/${file}`);
        if (command.name && command.executePrefix) {
            client.commands.set(command.name, command);
            console.log(`✅ Loaded command: ${command.name}`);
        }
    } catch (error) {
        console.error(`❌ Error loading command ${file}:`, error.message);
    }
}

console.log(`📊 Total commands loaded: ${client.commands.size}`);

// Ready event
client.once('ready', async () => {
    console.log(`✅ Bot online as ${client.user.tag}`);
    console.log(`📊 Bot sedang berjalan di ${client.guilds.cache.size} server`);
    
    // Set bot status
    client.user.setPresence({
        activities: [{ name: '!game | !casino', type: 3 }],
        status: 'online'
    });
});

// Message handler for prefix commands
client.on('messageCreate', async message => {
    if (message.author.bot) return;
    
    // Check for prefix commands (using ! prefix)
    if (!message.content.startsWith('!')) return;
    
    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    const command = client.commands.get(commandName);
    if (command && command.executePrefix) {
        try {
            await command.executePrefix(message, args, client);
        } catch (error) {
            console.error(`Error executing command ${commandName}:`, error);
            await message.reply('❌ Terjadi kesalahan saat menjalankan command!').catch(console.error);
        }
    }
});

// Button interaction handler
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    
    const customId = interaction.customId;
    const userId = interaction.user.id;
    
    // Verify button belongs to the user who clicked
    const buttonUserId = customId.split('_').pop();
    if (buttonUserId !== userId) {
        return interaction.reply({ 
            content: '❌ Tombol ini bukan untukmu! Gunakan !game atau !casino untuk memulai game sendiri.', 
            ephemeral: true 
        });
    }
    
    // Handle game buttons
    if (customId.startsWith('game_')) {
        const gameType = customId.split('_')[1];
        
        if (gameType === 'fishing') {
            const fishingCmd = client.commands.get('fishing');
            if (fishingCmd) {
                const fakeMessage = {
                    author: interaction.user,
                    channelId: interaction.channelId,
                    reply: async (content) => {
                        await interaction.reply(content);
                    },
                    channel: interaction.channel
                };
                await fishingCmd.executePrefix(fakeMessage, [], client);
            } else {
                await interaction.reply('❌ Game fishing belum tersedia!');
            }
        } else if (gameType === 'hunt') {
            const huntCmd = client.commands.get('hunt');
            if (huntCmd) {
                const fakeMessage = {
                    author: interaction.user,
                    channelId: interaction.channelId,
                    reply: async (content) => {
                        await interaction.reply(content);
                    },
                    channel: interaction.channel
                };
                await huntCmd.executePrefix(fakeMessage, [], client);
            }
        } else if (gameType === 'dungeon') {
            const dungeonCmd = client.commands.get('dungeon');
            if (dungeonCmd) {
                const fakeMessage = {
                    author: interaction.user,
                    channelId: interaction.channelId,
                    reply: async (content) => {
                        await interaction.reply(content);
                    },
                    channel: interaction.channel
                };
                await dungeonCmd.executePrefix(fakeMessage, [], client);
            }
        } else if (gameType === 'casino') {
            const casinoCmd = client.commands.get('casino');
            if (casinoCmd) {
                const fakeMessage = {
                    author: interaction.user,
                    channelId: interaction.channelId,
                    reply: async (content) => {
                        await interaction.reply(content);
                    },
                    channel: interaction.channel
                };
                await casinoCmd.executePrefix(fakeMessage, [], client);
            }
        }
    } else if (customId.startsWith('casino_')) {
        // Handle casino buttons by showing info about commands
        const gameType = customId.split('_')[1];
        const commands = {
            cf: '!cf <kepala/ekor> <amount>',
            fishing: '!fishing',
            rps: '!rps <rock/paper/scissors> <amount>',
            slots: '!slots <amount>',
            roulette: '!roulette <amount> <red/black/green/odd/even/number>',
            bomb: '!bomb <amount>',
            dice: '!dadu <high/low> <amount>'
        };
        
        const commandExample = commands[gameType] || '!game';
        await interaction.reply({
            content: `🎮 Untuk bermain ${gameType}, gunakan command:\n\`${commandExample}\``,
            ephemeral: true
        });
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

// Login
async function startBot() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB connected successfully');
        await client.login(process.env.TOKEN);
    } catch (error) {
        console.error('❌ Failed to start bot:', error);
        process.exit(1);
    }
}

startBot();