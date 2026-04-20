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
            await User.findOneAndUpdate(
                { userId },
                { 
                    $inc: { credits: amount },
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
    
    static async removeCredits(userId, amount, source = "unknown") {
        if (amount <= 0) return false;
        
        try {
            const balance = await this.getBalance(userId);
            if (balance < amount) return false;
            
            await User.findOneAndUpdate(
                { userId },
                { 
                    $inc: { credits: -amount },
                    $set: { updatedAt: new Date() }
                }
            );
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
                    $set: { updatedAt: new Date() }
                },
                { upsert: true, new: true }
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
    
    // Convert credits to points (100 credits = 1 point)
    static async convertCreditsToPoints(userId, creditsAmount) {
        if (creditsAmount <= 0) return { success: false, message: "Jumlah harus lebih dari 0!" };
        
        const pointsAmount = Math.floor(creditsAmount / 100);
        if (pointsAmount < 1) {
            return { success: false, message: "Minimal convert 100 credits untuk mendapatkan 1 point!" };
        }
        
        const actualCreditsNeeded = pointsAmount * 100;
        
        try {
            const user = await User.findOne({ userId });
            if (!user || user.credits < actualCreditsNeeded) {
                return { success: false, message: `Credit tidak cukup! Butuh ${actualCreditsNeeded} credits untuk ${pointsAmount} points.` };
            }
            
            await User.findOneAndUpdate(
                { userId },
                {
                    $inc: {
                        credits: -actualCreditsNeeded,
                        points: pointsAmount,
                        seasonPoints: pointsAmount,
                        activityPoints: pointsAmount
                    }
                }
            );
            
            return { 
                success: true, 
                message: `✅ Berhasil convert ${actualCreditsNeeded} credits → ${pointsAmount} points!`,
                points: pointsAmount,
                creditsUsed: actualCreditsNeeded
            };
        } catch (error) {
            console.error('Error converting credits to points:', error);
            return { success: false, message: "Terjadi kesalahan saat convert!" };
        }
    }
    
    // Convert points to credits (1 point = 100 credits)
    static async convertPointsToCredits(userId, pointsAmount) {
        if (pointsAmount <= 0) return { success: false, message: "Jumlah harus lebih dari 0!" };
        
        const creditsAmount = pointsAmount * 100;
        
        try {
            const user = await User.findOne({ userId });
            if (!user || user.points < pointsAmount) {
                return { success: false, message: `Point tidak cukup! Punya ${user?.points || 0} points.` };
            }
            
            await User.findOneAndUpdate(
                { userId },
                {
                    $inc: {
                        credits: creditsAmount,
                        points: -pointsAmount
                    }
                }
            );
            
            return { 
                success: true, 
                message: `✅ Berhasil convert ${pointsAmount} points → ${creditsAmount} credits!`,
                credits: creditsAmount,
                pointsUsed: pointsAmount
            };
        } catch (error) {
            console.error('Error converting points to credits:', error);
            return { success: false, message: "Terjadi kesalahan saat convert!" };
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
                    { $inc: { credits: -amount }, $set: { updatedAt: new Date() } },
                    { session }
                );
                
                await User.findOneAndUpdate(
                    { userId: toUserId },
                    { 
                        $inc: { credits: amount },
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
                    $set: { credits: amount, updatedAt: new Date() },
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
                .sort({ credits: -1 })
                .limit(limit)
                .lean();
            return users;
        } catch (error) {
            console.error('Error getting top balance:', error);
            return [];
        }
    }
    
    static async getTopPoints(limit = 10) {
        try {
            const users = await User.find()
                .sort({ points: -1 })
                .limit(limit)
                .lean();
            return users;
        } catch (error) {
            console.error('Error getting top points:', error);
            return [];
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