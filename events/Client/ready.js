const { Events } = require("discord.js");
const chalk = require("chalk");

module.exports = {
    name: Events.ClientReady,
    async execute(client) {
        console.log(
            chalk.magenta("[READY]"),
            chalk.white(
                `🎵 Riffy connected as ${chalk.italic(client.user.tag)}`
            )
        );

        client.guilds.cache.forEach(async (guild) => {
            const invites = await guild.invites.fetch();
            client.inviteCache.set(
                guild.id,
                new Map(invites.map((invite) => [invite.code, invite.uses]))
            );
        });
    },
};
