const { Events, EmbedBuilder } = require("discord.js");
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

        client.channels.cache.get(client.config.channel.logs).send({
            embeds: [
                new EmbedBuilder()
                    .setColor(client.config.embed.success)
                    .setDescription(
                        `**${client.user.username}** has successfully connected and is ready to serve!`
                    )
                    .setAuthor({
                        name: `Connected as ${client.user.tag}`,
                        iconURL: client.user.displayAvatarURL({
                            extension: "png",
                            size: 512,
                        }),
                    })
                    .addFields(
                        { name: "Status", value: "Operational", inline: true },
                        {
                            name: "Ready Since",
                            value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
                            inline: true,
                        }
                    )
                    .setFooter({ text: "System Startup" })
                    .setTimestamp(),
            ],
        });

        client.guilds.cache.forEach(async (guild) => {
            const invites = await guild.invites.fetch();
            client.inviteCache.set(
                guild.id,
                new Map(invites.map((invite) => [invite.code, invite.uses]))
            );
        });
    },
};
