const { Events, EmbedBuilder } = require("discord.js");

module.exports = {
    name: Events.MessageUpdate,
    async execute(oldMessage, newMessage) {
        if (oldMessage.guild.id === "1101864405492306040") {
            if (newMessage.author.bot) return;

            const embed = new EmbedBuilder()
                .setTitle("Message Updated")
                .setColor(newMessage.client.config.embed.default)
                .setThumbnail(
                    oldMessage.author.displayAvatarURL({
                        extension: "png",
                        size: 512,
                    })
                )
                .setDescription(
                    `**Before:** ${oldMessage.content}\n**After:** ${newMessage.content}`
                )
                .setFooter({
                    text: `Message by ${oldMessage.author.username}`,
                })
                .setTimestamp();

            const attachment = newMessage.attachments.first();
            if (attachment && attachment.contentType.startsWith("image/")) {
                embed.setImage(attachment.url);
            }

            oldMessage.guild.channels.cache.get(newMessage.client.config.channel.messageUpdate).send({
                embeds: [embed],
            });
        }
    },
};
