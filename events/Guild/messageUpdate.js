const { Events, MessageFlags } = require("discord.js");

module.exports = {
    name: Events.MessageUpdate,
    async execute(oldMessage, newMessage) {
        if (newMessage.author?.bot || !newMessage.guild) return;

        if (newMessage.partial) {
            try {
                await newMessage.fetch();
            } catch {
                return;
            }
        }

        if (!newMessage.client.config.bot.regex.test(newMessage.content)) return;

        const suppress = newMessage.client.pendingSuppress;

        const timeout = suppress.get(newMessage.id);

        if (timeout) {
            clearTimeout(timeout);
            suppress.delete(newMessage.id);
        }

        if (newMessage.flags.has(MessageFlags.SuppressEmbeds)) return;
        if (!newMessage.embeds.length) return;

        try {
            await newMessage.suppressEmbeds();
        } catch {}
    },
};
