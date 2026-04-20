const { showActivityInfo } = require('../utils/gameHandler');

module.exports = {
    name: 'activity',
    description: 'Lihat aktivitas dan points',
    aliases: ['act', 'aktivitas'],
    
    async executePrefix(message, args, client) {
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
        
        return showActivityInfo(fakeInteraction, client);
    }
};