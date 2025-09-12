const { Events, EmbedBuilder } = require("discord.js");
const { capital } = require("../../function/index");

module.exports = {
    name: Events.MessageDelete,
    async execute(message) {
        if (!message.guild || message.guild.id !== "1101864405492306040")
            return;

        if (!message.author) return;

        if (message.author.bot) return;

        try {
            const embed = new EmbedBuilder()
                .setTitle("Message Deleted")
                .setColor(message.client.config.embed.fail)
                .setThumbnail(
                    message.author.displayAvatarURL({
                        extension: "png",
                        size: 512,
                    })
                )
                .setDescription(
                    message.content ? message.content : "No text content"
                )
                .setFooter({
                    text: `Author ${capital(message.author.username)}`,
                })
                .setTimestamp();

            const attachment = message.attachments.first();
            if (
                attachment &&
                attachment.contentType &&
                attachment.contentType.startsWith("image/")
            ) {
                embed.setImage(attachment.url);
            }

            const logChannel = message.guild.channels.cache.get(
                "1253955934510776350"
            );
            if (logChannel) {
                await logChannel.send({ embeds: [embed] });
            }
        } catch (error) {
            console.error("Error in messageDelete event:", error);
        }
    },
};
