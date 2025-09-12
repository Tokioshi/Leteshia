const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    AttachmentBuilder,
    InteractionContextType,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ship")
        .setDescription("Buatlah kombinasi yang indah dari avatar 2 orang!")
        .addUserOption((option) =>
            option
                .setName("user-1")
                .setDescription("Pilih orang pertama!")
                .setRequired(true)
        )
        .addUserOption((option) =>
            option
                .setName("user-2")
                .setDescription("Pilih orang kedua!")
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

        const user1 = interaction.options.getUser("user-1");
        const user2 = interaction.options.getUser("user-2");

        await interaction.deferReply();

        try {
            const imageUrl =
                "https://api.popcat.xyz/v2/ship?user1=" +
                user1.displayAvatarURL({ extension: "png" }) +
                "&user2=" +
                user2.displayAvatarURL({ extension: "png" });

            await interaction.editReply({
                files: [new AttachmentBuilder(imageUrl, { name: "ship.png" })],
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
