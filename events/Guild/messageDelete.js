const { Events } = require("discord.js");

const MAX_SNIPES = 10;

module.exports = {
    name: Events.MessageDelete,
    async execute(message) {
        if (message.partial) {
            try {
                message = await message.fetch();
            } catch {
                return;
            }
        }
        if (message.author?.bot) return;

        const entry = {
            content: message.content || null,
            authorName: message.author.username,
            authorAvatar: message.author.displayAvatarURL(),
            image: message.attachments.first()?.proxyURL ?? null,
            timestamp: message.createdAt,
        };

        const channelSnipes = message.client.snipes.get(message.channel.id) ?? [];
        channelSnipes.unshift(entry);
        if (channelSnipes.length > MAX_SNIPES) channelSnipes.pop();
        message.client.snipes.set(message.channel.id, channelSnipes);
    },
};
