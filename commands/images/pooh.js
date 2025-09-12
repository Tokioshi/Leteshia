const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    AttachmentBuilder,
    InteractionContextType,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("pooh")
        .setDescription("Buat meme pooh seperti biasa dan dengan tuksedo!")
        .addStringOption((option) =>
            option
                .setName("teks-1")
                .setDescription("Teks pertama yang akan ditampilkan di gambar")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("teks-2")
                .setDescription("Teks kedua yang akan ditampilkan di gambar")
                .setRequired(true)
        )
        .setContexts(InteractionContextType.Guild),
    async execute(interaction) {
        if (
            interaction.channel.id !== interaction.client.config.channel.images
        ) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Channel Tidak Diizinkan")
                        .setColor(interaction.client.config.embed.fail)
                        .setDescription(
                            `Maaf, perintah ini hanya dapat digunakan di channel yang ditentukan <#${interaction.client.config.channel.images}>.`
                        )
                        .setFooter({
                            text: `Perintah Terbatas`,
                            iconURL: interaction.client.user.avatarURL(),
                        })
                        .setTimestamp(),
                ],
                flags: MessageFlags.Ephemeral,
            });
        }

        const text1 = interaction.options.getString("teks-1");
        const text2 = interaction.options.getString("teks-2");

        await interaction.deferReply();

        try {
            const imageUrl =
                "https://api.popcat.xyz/v2/pooh?text1=" +
                encodeURIComponent(text1) +
                "&text2=" +
                encodeURIComponent(text2);

            await interaction.editReply({
                files: [new AttachmentBuilder(imageUrl, { name: "pooh.png" })],
            });
        } catch (error) {
            console.error("Error fetching image:", error);

            await interaction.editReply({
                content:
                    "Terjadi kesalahan saat membuat gambar. Silakan coba lagi nanti.",
            });
        }
    },
};
