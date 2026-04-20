const { Cooldown } = require('../database/mongo');

function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} hari ${hours % 24} jam`;
    if (hours > 0) return `${hours} jam ${minutes % 60} menit`;
    if (minutes > 0) return `${minutes} menit ${seconds % 60} detik`;
    return `${seconds} detik`;
}

async function checkCooldown(userId, command, cooldownTime) {
    try {
        const cooldown = await Cooldown.findOne({ userId, command });
        
        if (!cooldown) {
            return { allowed: true, timeLeft: null };
        }
        
        const timeLeft = cooldownTime - (Date.now() - new Date(cooldown.lastUsed).getTime());
        
        if (timeLeft <= 0) {
            await Cooldown.deleteOne({ userId, command });
            return { allowed: true, timeLeft: null };
        }
        
        return { allowed: false, timeLeft: formatTime(timeLeft) };
    } catch (error) {
        console.error('Error checking cooldown:', error);
        return { allowed: true, timeLeft: null };
    }
}

async function setCooldown(userId, command) {
    try {
        await Cooldown.findOneAndUpdate(
            { userId, command },
            { lastUsed: new Date() },
            { upsert: true, new: true }
        );
        return true;
    } catch (error) {
        console.error('Error setting cooldown:', error);
        return false;
    }
}

async function resetCooldown(userId, command = null) {
    try {
        if (command) {
            await Cooldown.deleteOne({ userId, command });
        } else {
            await Cooldown.deleteMany({ userId });
        }
        return true;
    } catch (error) {
        console.error('Error resetting cooldown:', error);
        return false;
    }
}

module.exports = {
    checkCooldown,
    setCooldown,
    resetCooldown,
    formatTime
};