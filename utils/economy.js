const { User } = require('../database/mongo');

class EconomyManager {
    static async getBalance(userId) {
        try {
            const user = await User.findOne({ userId });
            return user?.credits || 0;
        } catch (error) {
            console.error('Error getting balance:', error);
            return 0;
        }
    }
    
    static async getPoints(userId) {
        try {
            const user = await User.findOne({ userId });
            return user?.points || 0;
        } catch (error) {
            console.error('Error getting points:', error);
            return 0;
        }
    }
    
    static async addCredits(userId, amount, source = "unknown") {
        if (amount <= 0) return false;
        
        try {
            const result = await User.findOneAndUpdate(
                { userId },
                { 
                    $inc: { credits: amount },
                    $setOnInsert: { userId, createdAt: new Date() },
                    $set: { updatedAt: new Date() }
                },
                { upsert: true, new: true }
            );
            console.log(`✅ Added ${amount} credits to ${userId}. New balance: ${result?.credits || 0}`);
            return true;
        } catch (error) {
            console.error('Error adding credits:', error);
            return false;
        }
    }
    
    static async removeCredits(userId, amount, source = "unknown") {
        if (amount <= 0) return false;
        
        try {
            const user = await User.findOne({ userId });
            if (!user || user.credits < amount) {
                console.log(`❌ Insufficient credits for ${userId}. Balance: ${user?.credits || 0}, Required: ${amount}`);
                return false;
            }
            
            const result = await User.findOneAndUpdate(
                { userId },
                { 
                    $inc: { credits: -amount },
                    $set: { updatedAt: new Date() }
                },
                { new: true }
            );
            console.log(`✅ Removed ${amount} credits from ${userId}. New balance: ${result?.credits || 0}`);
            return true;
        } catch (error) {
            console.error('Error removing credits:', error);
            return false;
        }
    }
    
    static async addPoints(userId, amount, source = "unknown") {
        if (amount <= 0) return false;
        
        try {
            await User.findOneAndUpdate(
                { userId },
                { 
                    $inc: { 
                        points: amount,
                        seasonPoints: amount,
                        activityPoints: amount
                    },
                    $setOnInsert: { userId, createdAt: new Date() },
                    $set: { updatedAt: new Date() }
                },
                { upsert: true }
            );
            return true;
        } catch (error) {
            console.error('Error adding points:', error);
            return false;
        }
    }
    
    static async removePoints(userId, amount, source = "unknown") {
        if (amount <= 0) return false;
        
        try {
            const points = await this.getPoints(userId);
            if (points < amount) return false;
            
            await User.findOneAndUpdate(
                { userId },
                { 
                    $inc: { points: -amount },
                    $set: { updatedAt: new Date() }
                }
            );
            return true;
        } catch (error) {
            console.error('Error removing points:', error);
            return false;
        }
    }
    
    static async getUser(userId) {
        try {
            let user = await User.findOne({ userId });
            if (!user) {
                user = await User.create({ userId });
            }
            return user;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    }
}

module.exports = EconomyManager;