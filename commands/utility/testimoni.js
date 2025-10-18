const {
    SlashCommandBuilder,
    EmbedBuilder,
    AttachmentBuilder,
    PermissionFlagsBits,
} = require("discord.js");
const axios = require("axios");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("testimoni")
        .setDescription("Membuat testimoni baru")
        .addUserOption((option) =>
            option
                .setName("customer")
                .setDescription("Sebutkan pelanggan yang membeli")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("product")
                .setDescription("Sebutkan produk yang dibeli")
                .setRequired(true)
        )
        .addAttachmentOption((option) =>
            option
                .setName("screenshot")
                .setDescription("Screenshot dari produk akhir")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setContexts(0),
    async execute(interaction) {
        if (
            interaction.user.id !== interaction.client.config.developer.tokioshy
        ) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setTitle("Gagal")
                        .setDescription(
                            "Anda tidak berwenang untuk menjalankan perintah ini!"
                        ),
                ],
                flags: 64,
            });
        }

        await interaction.deferReply({ flags: 64 });

        const user = interaction.options.getUser("customer");
        const product = interaction.options.getString("product");
        const ss = interaction.options.getAttachment("screenshot");

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
    },
};
