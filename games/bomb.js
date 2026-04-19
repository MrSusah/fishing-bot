const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const economy = require('../utils/economy');

class BombGame {
    constructor(userId, username, amount) {
        this.userId = userId;
        this.username = username;
        this.amount = amount;
        this.gridSize = 5; // Ubah ke 5x5 agar lebih mudah dilihat
        this.totalCells = 25;
        this.bombCount = 8; // 8 bom di grid 5x5
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
                
                // Use different button styles based on position
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
                    .setCustomId('bomb_grid')
                    .setLabel('🎲 REVEAL GRID')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true) // Just for display
            );
        
        rows.push(cashoutRow);
        return rows;
    }
}

module.exports = BombGame;