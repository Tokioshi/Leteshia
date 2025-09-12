const { Events } = require("discord.js");

module.exports = {
    name: Events.InviteCreate,
    async execute(invite) {
        const guildCache = inviteCache.get(invite.guild.id);
        if (guildCache) {
            guildCache.set(invite.code, invite.uses);
        }
    },
};
