const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    AttachmentBuilder,
    InteractionContextType,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("communism")
        .setDescription("Buat overlay komunis!")
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("Pilih orang lain atau diri kamu sendiri!")
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

        const user = interaction.options.getUser("user") || interaction.user;

        await interaction.deferReply();

        try {
            const imageUrl =
                "https://api.popcat.xyz/v2/communism?image=" +
                user.displayAvatarURL({ extension: "png", size: 512 });

            await interaction.editReply({
                files: [
                    new AttachmentBuilder(imageUrl, { name: "communism.png" }),
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
