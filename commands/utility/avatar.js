const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    InteractionContextType,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("avatar")
        .setDescription("Menampilkan avatar pengguna")
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("Pilih pengguna untuk menampilkan avatar")
                .setRequired(false)
        )
        .setContexts(InteractionContextType.Guild),
    async execute(interaction) {
        if (
            interaction.channel.id !== interaction.client.config.channel.utility
        ) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Channel Tidak Diizinkan")
                        .setColor(interaction.client.config.embed.fail)
                        .setDescription(
                            `Maaf, perintah ini hanya dapat digunakan di channel yang ditentukan <#${interaction.client.config.channel.utility}>.`
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

        const embed = new EmbedBuilder()
            .setAuthor({
                name: user.tag,
                iconURL: user.displayAvatarURL({ forceStatic: true }),
            })
            .setColor(interaction.client.config.embed.default)
            .setImage(user.displayAvatarURL({ forceStatic: true, size: 512 }));

        await interaction.reply({ embeds: [embed] });
    },
};
