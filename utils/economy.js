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
    
    static async addCredits(userId, amount) {
        if (amount <= 0) return false;
        
        try {
            // Cari user, jika tidak ada buat baru
            let user = await User.findOne({ userId });
            if (!user) {
                user = new User({ userId, credits: 0, points: 0 });
                await user.save();
            }
            
            // Update credits
            user.credits += amount;
            await user.save();
            
            console.log(`✅ Added ${amount} credits to ${userId}. New balance: ${user.credits}`);
            return true;
        } catch (error) {
            console.error('Error adding credits:', error);
            return false;
        }
    }
    
    static async removeCredits(userId, amount) {
        if (amount <= 0) return false;
        
        try {
            const user = await User.findOne({ userId });
            if (!user) {
                console.log(`❌ User ${userId} not found`);
                return false;
            }
            
            if (user.credits < amount) {
                console.log(`❌ Insufficient credits for ${userId}. Balance: ${user.credits}, Required: ${amount}`);
                return false;
            }
            
            user.credits -= amount;
            await user.save();
            
            console.log(`✅ Removed ${amount} credits from ${userId}. New balance: ${user.credits}`);
            return true;
        } catch (error) {
            console.error('Error removing credits:', error);
            return false;
        }
    }
    
    static async addPoints(userId, amount) {
        if (amount <= 0) return false;
        
        try {
            let user = await User.findOne({ userId });
            if (!user) {
                user = new User({ userId, credits: 0, points: 0 });
                await user.save();
            }
            
            user.points += amount;
            user.seasonPoints += amount;
            user.activityPoints += amount;
            await user.save();
            
            return true;
        } catch (error) {
            console.error('Error adding points:', error);
            return false;
        }
    }
    
    static async removePoints(userId, amount) {
        if (amount <= 0) return false;
        
        try {
            const user = await User.findOne({ userId });
            if (!user || user.points < amount) return false;
            
            user.points -= amount;
            await user.save();
            return true;
        } catch (error) {
            console.error('Error removing points:', error);
            return false;
        }
    }
}

module.exports = EconomyManager;