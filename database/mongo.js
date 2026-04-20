const mongoose = require('mongoose');

class Database {
    constructor() {
        this.client = null;
        this.db = null;
        this.mongoose = mongoose;
    }
    
    async connect(uri, dbName) {
        try {
            // Mongoose sudah connect di index.js, ini untuk custom handler
            this.db = mongoose.connection.db;
            console.log('✅ Database handler connected');
            return this.db;
        } catch (error) {
            console.error('❌ Database handler error:', error);
            throw error;
        }
    }
    
    get collection() {
        return {
            users: () => this.db.collection('users'),
            cooldowns: () => this.db.collection('cooldowns'),
            games: () => this.db.collection('games')
        };
    }
    
    getCollection(name) {
        return this.db.collection(name);
    }
    
    async disconnect() {
        // Disconnect handled by mongoose
        console.log('Database handler disconnected');
    }
}

// Create schema for users if not exists
const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    balance: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const cooldownSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    command: { type: String, required: true },
    lastUsed: { type: Date, default: Date.now }
});

// Create models if they don't exist
let UserModel, CooldownModel;

try {
    UserModel = mongoose.model('User');
} catch {
    UserModel = mongoose.model('User', userSchema);
}

try {
    CooldownModel = mongoose.model('Cooldown');
} catch {
    CooldownModel = mongoose.model('Cooldown', cooldownSchema);
}

module.exports = new Database();
module.exports.User = UserModel;
module.exports.Cooldown = CooldownModel;