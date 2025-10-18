const { Events, EmbedBuilder } = require("discord.js");
const chalk = require("chalk");

module.exports = {
    name: Events.ClientReady,
    async execute(client) {
        console.log(
            chalk.magenta("[READY]"),
            chalk.white(`Connected as ${chalk.italic(client.user.tag)}!`)
        );

        client.channels.cache.get(client.config.channel.botLogs).send({
            embeds: [
                new EmbedBuilder()
                    .setColor("Green")
                    .setDescription(
                        `**${client.user.username}** sudah terhubung dengan sukses dan siap melayani!`
                    )
                    .setAuthor({
                        name: `Terhubung sebagai ${client.user.tag}`,
                        iconURL: client.user.displayAvatarURL({
                            extension: "png",
                            size: 512,
                        }),
                    })
                    .addFields(
                        { name: "Status", value: "Operasional", inline: true },
                        {
                            name: "Siap Sejak",
                            value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
                            inline: true,
                        }
                    )
                    .setFooter({ text: "Proses Booting Sistem" })
                    .setTimestamp(),
            ],
        });
    },
};
