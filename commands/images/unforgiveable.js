const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    AttachmentBuilder,
    InteractionContextType,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("unforgiveable")
        .setDescription(
            "Tahukah Anda bahwa beberapa dosa tidak dapat diampuni?"
        )
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
                "https://api.popcat.xyz/v2/unforgivable?text=" +
                encodeURIComponent(text);

            await interaction.editReply({
                files: [
                    new AttachmentBuilder(imageUrl, {
                        name: "unforgivable.png",
                    }),
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
