const { User } = require('../database/mongo');

class EconomyManager {
    static async getBalance(userId) {
        try {
            const user = await User.findOne({ userId });
            return user?.balance || 0;
        } catch (error) {
            console.error('Error getting balance:', error);
            return 0;
        }
    }
    
    static async addCredits(userId, amount) {
        if (amount <= 0) return false;
        
        try {
            await User.findOneAndUpdate(
                { userId },
                { 
                    $inc: { balance: amount },
                    $set: { updatedAt: new Date() }
                },
                { upsert: true, new: true }
            );
            return true;
        } catch (error) {
            console.error('Error adding credits:', error);
            return false;
        }
    }
    
    static async removeCredits(userId, amount) {
        if (amount <= 0) return false;
        
        try {
            const balance = await this.getBalance(userId);
            if (balance < amount) return false;
            
            await User.findOneAndUpdate(
                { userId },
                { 
                    $inc: { balance: -amount },
                    $set: { updatedAt: new Date() }
                }
            );
            return true;
        } catch (error) {
            console.error('Error removing credits:', error);
            return false;
        }
    }
    
    static async transferCredits(fromUserId, toUserId, amount) {
        if (amount <= 0) return false;
        if (fromUserId === toUserId) return false;
        
        const session = await User.startSession();
        
        try {
            let result = false;
            await session.withTransaction(async () => {
                const fromBalance = await this.getBalance(fromUserId);
                if (fromBalance < amount) {
                    return false;
                }
                
                await User.findOneAndUpdate(
                    { userId: fromUserId },
                    { $inc: { balance: -amount }, $set: { updatedAt: new Date() } },
                    { session }
                );
                
                await User.findOneAndUpdate(
                    { userId: toUserId },
                    { 
                        $inc: { balance: amount },
                        $set: { updatedAt: new Date() },
                        $setOnInsert: { userId: toUserId, createdAt: new Date() }
                    },
                    { upsert: true, session }
                );
                
                result = true;
                return true;
            });
            
            await session.endSession();
            return result;
        } catch (error) {
            console.error('Transfer error:', error);
            await session.endSession();
            return false;
        }
    }
    
    static async setBalance(userId, amount) {
        if (amount < 0) return false;
        
        try {
            await User.findOneAndUpdate(
                { userId },
                { 
                    $set: { balance: amount, updatedAt: new Date() },
                    $setOnInsert: { userId, createdAt: new Date() }
                },
                { upsert: true }
            );
            return true;
        } catch (error) {
            console.error('Error setting balance:', error);
            return false;
        }
    }
    
    static async getTopBalance(limit = 10) {
        try {
            const users = await User.find()
                .sort({ balance: -1 })
                .limit(limit)
                .lean();
            return users;
        } catch (error) {
            console.error('Error getting top balance:', error);
            return [];
        }
    }
}

module.exports = EconomyManager;