const { EmbedBuilder, AttachmentBuilder, MessageFlags } = require("discord.js");
const axios = require("axios");

async function handleCommand(interaction) {
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(
                        `Unknow command \`${interaction.commandName}\`. The command may have been deleted`,
                    ),
            ],
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Error executing command ${interaction.commandName}:`, error);
        await handleCommandError(interaction);
    }
}

async function handleCommandError(interaction) {
    const errorEmbed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(`Error executing \`${interaction.commandName}\`.`);

    if (!interaction.replied) {
        await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
    } else if (interaction.deferred) {
        await interaction.followUp({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
    }
}

async function handleModal(interaction) {
    if (interaction.customId == "testimoni") {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const userCollection = interaction.fields.getSelectedUsers("customer");
        const product = interaction.fields.getStringSelectValues("product");
        const ssCollection = interaction.fields.getUploadedFiles("screenshot");

        const user = userCollection.first();
        const ss = ssCollection.first();

        const response = await axios.get(ss.url, {
            responseType: "arraybuffer",
        });
        const file = new AttachmentBuilder(response.data, {
            name: ss.name || "screenshot.png",
        });

        await interaction.guild.channels.cache
            .get(interaction.client.config.channel.testimoni)
            .send({
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({ name: "Product Purchase Testimonials" })
                        .setColor("Orange")
                        .setThumbnail(
                            user.displayAvatarURL({
                                extension: "png",
                                size: 512,
                            }),
                        )
                        .setFields(
                            {
                                name: "Customer",
                                value: `${user}`,
                                inline: true,
                            },
                            {
                                name: "Product",
                                value: `${product}`,
                                inline: true,
                            },
                        )
                        .setImage(`attachment://${ss.name || "screenshot.png"}`)
                        .setFooter({ text: "Testimoni Time" })
                        .setTimestamp(),
                ],
                files: [file],
            });

        await interaction.guild.members.cache
            .get(user.id)
            .roles.add(interaction.client.config.role.buyer);

        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor("Green")
                    .setDescription(
                        `Testimonial has been successfully sent to <#${interaction.client.config.channel.testimoni}>!`,
                    ),
            ],
            flags: MessageFlags.Ephemeral,
        });
    }

    if (interaction.customId == "feedback") {
        const message = interaction.fields.getTextInputValue("feedback_message");
        const star = interaction.fields.getStringSelectValues("feedback_star");

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        await interaction.guild.channels.cache
            .get(interaction.client.config.channel.feedback)
            .send({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Orange")
                        .setAuthor({
                            name: `Feedback From ${interaction.user.displayName}`,
                            iconURL: interaction.user.displayAvatarURL({
                                size: 512,
                            }),
                        })
                        .addFields(
                            {
                                name: "Message",
                                value: message,
                                inline: false,
                            },
                            {
                                name: "Star",
                                value: `${star}`,
                                inline: true,
                            },
                        )
                        .setFooter({ text: "Thank you for your feedback!" })
                        .setTimestamp(),
                ],
            })
            .then(() => {
                interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("Green")
                            .setDescription(
                                `Feedback has been successfully sent! Thank you for your feedback!`,
                            ),
                    ],
                });
            });
    }

    if (interaction.customId === "message") {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const text = interaction.fields.getTextInputValue("text");
        const attachCollection = interaction.fields.getUploadedFiles("attachment");
        const messageId = interaction.fields.getTextInputValue("message_id");

        if (!text?.trim() && !attachCollection?.size && !messageId?.trim()) {
            return interaction.editReply(
                "https://tenor.com/view/tertawa-tapi-terluka-tertawa-tapi-terluka-gif-4910619389471646348",
            );
        }

        const files = [];

        if (attachCollection?.size > 0) {
            for (const attach of attachCollection.values()) {
                try {
                    const response = await axios.get(attach.url, {
                        responseType: "arraybuffer",
                    });
                    const file = new AttachmentBuilder(response.data, {
                        name: attach.name || "attachment.png",
                    });
                    files.push(file);
                } catch (err) {
                    console.error(`Failed to fetch attachment ${attach.name}:`, err);
                }
            }
        }
        try {
            const messageOptions = {
                content: text?.trim() || null,
                files: files.length > 0 ? files : undefined,
            };

            if (!messageOptions.content) delete messageOptions.content;
            if (!messageOptions.files) delete messageOptions.files;

            if (!messageId?.trim()) {
                await interaction.channel.send(messageOptions);
            } else {
                const targetMessage = await interaction.channel.messages.fetch(messageId.trim());
                await targetMessage.reply(messageOptions);
            }

            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Green")
                        .setDescription("You've just sent a message as bot!"),
                ],
            });
        } catch (err) {
            console.error(err);
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setDescription(
                            "Failed to send announcement.\n" +
                                "Please check the message ID (if used) and attachments, then try again.",
                        ),
                ],
            });
        }
    }
}

module.exports = {
    handleCommand,
    handleModal,
};
