const { showProfile } = require('../utils/gameHandler');

module.exports = {
    name: 'profile',
    description: 'Lihat profil user',
    aliases: ['profil', 'p'],
    
    async executePrefix(message, args, client) {
        let targetUserId = null;
        if (message.mentions.users.first()) {
            targetUserId = message.mentions.users.first().id;
        }
        
        const fakeInteraction = {
            user: message.author,
            member: message.member,
            channel: message.channel,
            guild: message.guild,
            reply: async (options) => {
                if (options.flags === 64) {
                    return message.reply(options);
                }
                return message.reply(options);
            },
            editReply: async (options) => message.editReply(options),
            deferReply: async () => {},
            deferred: false,
            replied: false,
            customId: null
        };
        
        return showProfile(fakeInteraction, client, targetUserId);
    }
};