const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const economy = require('../utils/economy');

class BombGame {
    constructor(userId, username, amount) {
        this.userId = userId;
        this.username = username;
        this.amount = amount;
        this.gridSize = 5; // 5x5 grid
        this.totalCells = 25;
        this.bombCount = 8; // 8 bombs in 5x5 grid
        this.revealed = Array(this.totalCells).fill(false);
        this.bombs = [];
        this.multiplier = 1.0;
        this.gameActive = true;
        this.currentWinAmount = 0;
        this.revealedCount = 0;
    }
    
    initGame() {
        // Place bombs randomly
        const bombIndices = new Set();
        while (bombIndices.size < this.bombCount) {
            bombIndices.add(Math.floor(Math.random() * this.totalCells));
        }
        this.bombs = Array.from(bombIndices);
    }
    
    async revealCell(index, interaction) {
        if (!this.gameActive) {
            return { gameOver: true, message: 'Game sudah berakhir!' };
        }
        
        if (this.revealed[index]) {
            return { gameOver: false, message: 'Kotak sudah terbuka!' };
        }
        
        if (this.bombs.includes(index)) {
            // Hit bomb - game over
            this.gameActive = false;
            await economy.removeCredits(this.userId, this.amount);
            
            const gridDisplay = this.createGridDisplay(true);
            const embed = this.createGameOverEmbed(gridDisplay);
            
            return { gameOver: true, embed, lossAmount: this.amount };
        } else {
            // Safe cell
            this.revealed[index] = true;
            this.revealedCount++;
            this.multiplier = 1 + (this.revealedCount * 0.1); // +0.1x per tile
            this.currentWinAmount = Math.floor(this.amount * this.multiplier);
            
            const gridDisplay = this.createGridDisplay(false);
            const embed = this.createGameEmbed(gridDisplay);
            
            return { 
                gameOver: false, 
                embed, 
                multiplier: this.multiplier, 
                currentWin: this.currentWinAmount,
                revealedCount: this.revealedCount
            };
        }
    }
    
    async cashout(interaction) {
        if (!this.gameActive) {
            return { success: false, message: 'Game sudah berakhir!' };
        }
        
        if (this.currentWinAmount <= 0) {
            return { success: false, message: 'Belum ada kemenangan untuk di-cashout!' };
        }
        
        this.gameActive = false;
        
        // Get old balance untuk perhitungan
        const oldBalance = await economy.getBalance(this.userId);
        
        // Process transaction
        await economy.removeCredits(this.userId, this.amount);
        await economy.addCredits(this.userId, this.currentWinAmount);
        
        // Get new balance
        const newBalance = await economy.getBalance(this.userId);
        
        const gridDisplay = this.createGridDisplay(true);
        const embed = this.createCashoutEmbed(gridDisplay, oldBalance, newBalance);
        
        return { success: true, embed, winAmount: this.currentWinAmount };
    }
    
    createGridDisplay(revealAll = false) {
        let grid = '';
        for (let i = 0; i < this.gridSize; i++) {
            let row = '';
            for (let j = 0; j < this.gridSize; j++) {
                const index = i * this.gridSize + j;
                
                if (revealAll) {
                    // Show all bombs and gems
                    if (this.bombs.includes(index)) {
                        row += '💣 ';
                    } else if (this.revealed[index]) {
                        row += '💎 ';
                    } else {
                        row += '⬜ ';
                    }
                } else {
                    // Only show revealed tiles
                    if (this.revealed[index]) {
                        row += '💎 ';
                    } else {
                        row += '⬛ ';
                    }
                }
            }
            grid += row + '\n';
        }
        return grid;
    }
    
    createGameEmbed(gridDisplay) {
        const profit = this.currentWinAmount - this.amount;
        const profitSymbol = profit >= 0 ? '+' : '';
        
        const embed = new EmbedBuilder()
            .setColor('#ffd700')
            .setTitle('💣 MINES GAME 💣')
            .setDescription(`\`\`\`\n${gridDisplay}\n\`\`\``)
            .addFields(
                { name: '🎯 Tiles Revealed', value: `${this.revealedCount}`, inline: true },
                { name: '📊 Multiplier', value: `x${this.multiplier.toFixed(2)}`, inline: true },
                { name: '💰 Current Win', value: `${this.currentWinAmount.toLocaleString()} 🪙`, inline: true },
                { name: '📈 Profit', value: `${profitSymbol}${profit.toLocaleString()} 🪙`, inline: true },
                { name: '💣 Bombs Left', value: `${this.bombCount - this.bombs.filter(b => !this.revealed.includes(b)).length}`, inline: true },
                { name: '🎲 Safe Tiles', value: `${this.totalCells - this.bombCount - this.revealedCount}`, inline: true }
            )
            .setFooter({ text: `Dimainkan oleh ${this.username} | Klik 💰 CASHOUT untuk mengambil kemenangan` });
        
        return embed;
    }
    
    createGameOverEmbed(gridDisplay) {
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('💣 GAME OVER! 💀')
            .setDescription(`\`\`\`\n${gridDisplay}\n\`\`\``)
            .addFields(
                { name: '💥 You Hit a Bomb!', value: `Kena bom dan kehilangan semua taruhan!`, inline: false },
                { name: '💰 Taruhan', value: `${this.amount.toLocaleString()} 🪙`, inline: true },
                { name: '💸 Loss', value: `${this.amount.toLocaleString()} 🪙`, inline: true },
                { name: '🎯 Tiles Revealed', value: `${this.revealedCount}`, inline: true }
            )
            .setFooter({ text: `Dimainkan oleh ${this.username} | Coba lagi lain kali!` });
        
        return embed;
    }
    
    createCashoutEmbed(gridDisplay, oldBalance, newBalance) {
        const profit = this.currentWinAmount - this.amount;
        const profitSymbol = profit >= 0 ? '+' : '';
        
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ CASHED OUT! 🎉')
            .setDescription(`\`\`\`\n${gridDisplay}\n\`\`\``)
            .addFields(
                { name: '🎯 Tiles Revealed', value: `${this.revealedCount}`, inline: true },
                { name: '📊 Multiplier', value: `x${this.multiplier.toFixed(2)}`, inline: true },
                { name: '💰 Gross Win', value: `+${this.currentWinAmount.toLocaleString()} 🪙`, inline: true },
                { name: '📈 Profit', value: `${profitSymbol}${profit.toLocaleString()} 🪙`, inline: true },
                { name: '💼 Old Balance', value: `${oldBalance.toLocaleString()} 🪙`, inline: true },
                { name: '🆕 New Balance', value: `${newBalance.toLocaleString()} 🪙`, inline: true }
            )
            .setFooter({ text: `Dimainkan oleh ${this.username} | Selamat! 🎊` });
        
        return embed;
    }
    
    createGridButtons() {
        const rows = [];
        for (let i = 0; i < this.gridSize; i++) {
            const row = new ActionRowBuilder();
            for (let j = 0; j < this.gridSize; j++) {
                const index = i * this.gridSize + j;
                let emoji = '⬛';
                let disabled = false;
                
                if (this.revealed[index]) {
                    emoji = '💎';
                    disabled = true;
                }
                
                let style = ButtonStyle.Secondary;
                if (this.revealed[index]) {
                    style = ButtonStyle.Success;
                }
                
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`bomb_${index}`)
                        .setLabel(emoji)
                        .setStyle(style)
                        .setDisabled(disabled)
                );
            }
            rows.push(row);
        }
        
        const cashoutRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('bomb_cashout')
                    .setLabel('💰 CASHOUT')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(!this.gameActive || this.revealedCount === 0),
                new ButtonBuilder()
                    .setCustomId('bomb_info')
                    .setLabel(`🎯 ${this.revealedCount}/25`)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
            );
        
        rows.push(cashoutRow);
        return rows;
    }
}

// ================= FUNGSI UNTUK MESSAGE COMMAND =================
async function executeBomb(message, amount) {
    try {
        // Validasi amount
        if (isNaN(amount) || amount < 10) {
            return message.reply("❌ Minimal taruhan adalah **10 credits**!");
        }
        
        if (amount > 1000) {
            return message.reply("❌ Maksimal taruhan untuk game bomb adalah **1000 credits**!");
        }
        
        // Cek saldo
        const balance = await economy.getBalance(message.author.id);
        if (balance < amount) {
            return message.reply(`❌ Saldo tidak cukup! Kamu memiliki ${balance.toLocaleString()} credits.`);
        }
        
        // Buat game instance
        const bombGame = new BombGame(message.author.id, message.author.username, amount);
        bombGame.initGame();
        
        // Simpan ke client
        if (!message.client.bombGames) message.client.bombGames = new Map();
        message.client.bombGames.set(message.author.id, bombGame);
        
        // Tampilkan grid awal
        const gridDisplay = bombGame.createGridDisplay(false);
        const embed = bombGame.createGameEmbed(gridDisplay);
        const buttons = bombGame.createGridButtons();
        
        return message.reply({ embeds: [embed], components: buttons });
    } catch (error) {
        console.error('Error in executeBomb:', error);
        return message.reply('❌ Terjadi kesalahan saat memulai game!');
    }
}

// ================= FUNGSI UNTUK HANDLE BUTTON INTERACTION =================
async function handleBombInteraction(interaction, client) {
    try {
        // Pastikan bombGames ada
        if (!client.bombGames) client.bombGames = new Map();
        
        const bombGame = client.bombGames.get(interaction.user.id);
        
        if (!bombGame) {
            return interaction.reply({ 
                content: "❌ Game tidak ditemukan! Mulai game baru dengan `!bomb <jumlah>`", 
                ephemeral: true 
            });
        }
        
        const customId = interaction.customId;
        
        // Handle cashout
        if (customId === 'bomb_cashout') {
            await interaction.deferUpdate();
            const result = await bombGame.cashout(interaction);
            
            if (result.success) {
                await interaction.editReply({ embeds: [result.embed], components: [] });
                client.bombGames.delete(interaction.user.id);
            } else {
                await interaction.followUp({ content: result.message, ephemeral: true });
            }
            return;
        }
        
        // Handle cell clicks (bomb_0 sampai bomb_24)
        if (customId.startsWith('bomb_')) {
            const cellIndex = parseInt(customId.split('_')[1]);
            
            if (isNaN(cellIndex)) {
                return interaction.reply({ content: '❌ Invalid cell!', ephemeral: true });
            }
            
            await interaction.deferUpdate();
            const result = await bombGame.revealCell(cellIndex, interaction);
            
            if (result.gameOver) {
                await interaction.editReply({ embeds: [result.embed], components: [] });
                client.bombGames.delete(interaction.user.id);
            } else {
                const newButtons = bombGame.createGridButtons();
                await interaction.editReply({ embeds: [result.embed], components: newButtons });
            }
            return;
        }
        
        // Unknown button
        return interaction.reply({ content: '❌ Tombol tidak dikenal!', ephemeral: true });
        
    } catch (error) {
        console.error('Error in handleBombInteraction:', error);
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ Terjadi kesalahan dalam game!', ephemeral: true });
            } else {
                await interaction.editReply({ content: '❌ Terjadi kesalahan dalam game!' });
            }
        } catch (e) {
            console.error('Failed to send error response:', e);
        }
        client.bombGames?.delete(interaction.user.id);
    }
}

async function executeBomb(message, amount) {
    try {
        const economy = require('../utils/economy');
        
        // Validasi amount
        if (isNaN(amount) || amount < 10) {
            return message.reply("❌ Minimal taruhan adalah **10 credits**!");
        }
        
        if (amount > 1000) {
            return message.reply("❌ Maksimal taruhan untuk game bomb adalah **1000 credits**!");
        }
        
        // Cek saldo
        const balance = await economy.getBalance(message.author.id);
        if (balance < amount) {
            return message.reply(`❌ Saldo tidak cukup! Kamu memiliki ${balance.toLocaleString()} credits.`);
        }
        
        // Buat game instance
        const bombGame = new BombGame(message.author.id, message.author.username, amount);
        bombGame.initGame();
        
        // Simpan ke client
        if (!message.client.bombGames) message.client.bombGames = new Map();
        message.client.bombGames.set(message.author.id, bombGame);
        
        // Tampilkan grid awal
        const gridDisplay = bombGame.createGridDisplay(false);
        const embed = bombGame.createGameEmbed(gridDisplay);
        const buttons = bombGame.createGridButtons();
        
        return message.reply({ embeds: [embed], components: buttons });
    } catch (error) {
        console.error('Error in executeBomb:', error);
        return message.reply('❌ Terjadi kesalahan saat memulai game!');
    }
}

// ================= FUNGSI UNTUK HANDLE BUTTON INTERACTION =================
async function handleBombInteraction(interaction, client) {
    try {
        // Pastikan bombGames ada
        if (!client.bombGames) client.bombGames = new Map();
        
        const bombGame = client.bombGames.get(interaction.user.id);
        
        if (!bombGame) {
            return interaction.reply({ 
                content: "❌ Game tidak ditemukan! Mulai game baru dengan `!bomb <jumlah>`", 
                ephemeral: true 
            });
        }
        
        const customId = interaction.customId;
        
        // Handle cashout
        if (customId === 'bomb_cashout') {
            await interaction.deferUpdate();
            const result = await bombGame.cashout(interaction);
            
            if (result.success) {
                await interaction.editReply({ embeds: [result.embed], components: [] });
                client.bombGames.delete(interaction.user.id);
            } else {
                await interaction.followUp({ content: result.message, ephemeral: true });
            }
            return;
        }
        
        // Handle cell clicks (bomb_0 sampai bomb_24)
        if (customId.startsWith('bomb_')) {
            const cellIndex = parseInt(customId.split('_')[1]);
            
            if (isNaN(cellIndex)) {
                return interaction.reply({ content: '❌ Invalid cell!', ephemeral: true });
            }
            
            await interaction.deferUpdate();
            const result = await bombGame.revealCell(cellIndex, interaction);
            
            if (result.gameOver) {
                await interaction.editReply({ embeds: [result.embed], components: [] });
                client.bombGames.delete(interaction.user.id);
            } else {
                const newButtons = bombGame.createGridButtons();
                await interaction.editReply({ embeds: [result.embed], components: newButtons });
            }
            return;
        }
        
        // Unknown button
        return interaction.reply({ content: '❌ Tombol tidak dikenal!', ephemeral: true });
        
    } catch (error) {
        console.error('Error in handleBombInteraction:', error);
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ Terjadi kesalahan dalam game!', ephemeral: true });
            } else {
                await interaction.editReply({ content: '❌ Terjadi kesalahan dalam game!' });
            }
        } catch (e) {
            console.error('Failed to send error response:', e);
        }
        client.bombGames?.delete(interaction.user.id);
    }
}

// Update module.exports di akhir file

module.exports = { 
    BombGame, 
    executeBomb, 
    handleBombInteraction 
};