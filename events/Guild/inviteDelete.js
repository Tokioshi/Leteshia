const { Events } = require("discord.js");

module.exports = {
    name: Events.InviteDelete,
    async execute(invite) {
        const guildCache = inviteCache.get(invite.guild.id);
        if (guildCache) {
            guildCache.delete(invite.code);
        }
    },
};
