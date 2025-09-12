const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    InteractionContextType,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("testimoni")
        .setDescription("Buat testimoni")
        .addUserOption((option) =>
            option
                .setName("customer")
                .setDescription("Mention customer")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("produk")
                .setDescription("Sebut produk yang dibeli")
                .setRequired(true)
        )
        .addAttachmentOption((option) =>
            option
                .setName("screenshot")
                .setDescription("Screenshot produk yang sudah selesai")
                .setRequired(true)
        )
        .setContexts(InteractionContextType.Guild),
    async execute(interaction) {
        if (
            interaction.user.id !== interaction.client.config.developer.tokioshy
        ) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Gagal")
                        .setColor(interaction.client.config.embed.fail)
                        .setDescription(
                            "Kamu tidak bisa menggunakan perintah ini!"
                        ),
                ],
                flags: MessageFlags.Ephemeral,
            });
        }

        const user = interaction.options.getUser("customer");
        const produk = interaction.options.getString("produk");
        const ss = interaction.options.getAttachment("screenshot");

        interaction.guild.channels.cache
            .get(interaction.client.config.channel.testimoni)
            .send({
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({ name: "Testimoni Pembelian Customer" })
                        .setColor(interaction.client.config.embed.default)
                        .setThumbnail(
                            user.displayAvatarURL({
                                extension: "png",
                                size: 512,
                            })
                        )
                        .setFields(
                            { name: "Pembeli", value: `${user}`, inline: true },
                            { name: "Produk", value: `${produk}`, inline: true }
                        )
                        .setImage(ss.url)
                        .setFooter({ text: "Waktu membeli" })
                        .setTimestamp(),
                ],
            });

        await interaction.guild.members.cache
            .get(user.id)
            .roles.add(interaction.client.config.role.buyer);

        interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle("Berhasil Membuat Testimoni")
                    .setColor(interaction.client.config.embed.success)
                    .setDescription(
                        `Testimoni berhasil dikirim ke channel <#${interaction.client.config.channel.testimoni}>!`
                    ),
            ],
            flags: MessageFlags.Ephemeral,
        });
    },
};
