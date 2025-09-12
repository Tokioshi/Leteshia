const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    AttachmentBuilder,
    InteractionContextType,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("opinion")
        .setDescription("Membuat meme pendapat yang tidak dapat diterima!")
        .addStringOption((option) =>
            option
                .setName("teks")
                .setDescription("Teks yang akan ditampilkan di gambar")
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

        const text = interaction.options.getString("teks");

        await interaction.deferReply();

        try {
            const imageUrl =
                "https://api.popcat.xyz/v2/opinion?image=https://i.kym-cdn.com/photos/images/newsfeed/001/394/351/33a.jpg&text=" +
                encodeURIComponent(text);

            await interaction.editReply({
                files: [
                    new AttachmentBuilder(imageUrl, { name: "opinion.png" }),
                ],
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
