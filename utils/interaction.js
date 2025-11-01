const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const axios = require("axios");

async function handleCommand(interaction) {
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(
                        `Perintah tidak dikenal \`${interaction.commandName}\`. Mungkin perintah tersebut telah dihapus`
                    ),
            ],
            flags: 64,
        });
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(
            `Error executing command ${interaction.commandName}:`,
            error
        );
        await handleCommandError(interaction);
    }
}

async function handleCommandError(interaction) {
    const errorEmbed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(
            `Terjadi masalah saat menjalankan \`${interaction.commandName}\`.`
        );

    if (!interaction.replied) {
        await interaction.reply({ embeds: [errorEmbed], flags: 64 });
    } else if (interaction.deferred) {
        await interaction.followUp({ embeds: [errorEmbed], flags: 64 });
    }
}

async function handleModal(interaction) {
    if (interaction.customId == "testimoni") {
        await interaction.deferReply({ flags: 64 });

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
                        .setAuthor({ name: "Testimoni Pembelian Produk" })
                        .setColor("Orange")
                        .setThumbnail(
                            user.displayAvatarURL({
                                extension: "png",
                                size: 512,
                            })
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
                            }
                        )
                        .setImage(`attachment://${ss.name || "screenshot.png"}`)
                        .setFooter({ text: "Waktu Testimoni" })
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
                    .setTitle("Berhasil")
                    .setDescription(
                        `Testimonial telah berhasil dikirim ke saluran <#${interaction.client.config.channel.testimoni}>!`
                    ),
            ],
            flags: 64,
        });
    }

    if (interaction.customId == "feedback") {
        const message =
            interaction.fields.getTextInputValue("feedback_message");
        const star = interaction.fields.getStringSelectValues("feedback_star");

        await interaction.deferReply({ flags: 64 });

        await interaction.guild.channels.cache
            .get(interaction.client.config.channel.feedback)
            .send({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Orange")
                        .setAuthor({
                            name: `Feedback Dari ${interaction.user.displayName}`,
                            iconURL: interaction.user.displayAvatarURL({
                                size: 512,
                            }),
                        })
                        .addFields(
                            {
                                name: "Pesan",
                                value: message,
                                inline: false,
                            },
                            {
                                name: "Bintang",
                                value: `${star}`,
                                inline: true,
                            }
                        )
                        .setFooter({ text: "Terima kasih atas masukan Anda!" })
                        .setTimestamp(),
                ],
            })
            .then(() => {
                interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("Green")
                            .setTitle("Berhasil")
                            .setDescription(
                                `Feedback anda telah terkirim! Terima kasih atas masukan anda`
                            ),
                    ],
                });
            });
    }
}

module.exports = {
    handleCommand,
    handleModal,
};
