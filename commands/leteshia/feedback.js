const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    ModalBuilder,
    ActionRowBuilder,
    TextInputBuilder,
    TextInputStyle,
    InteractionContextType,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("feedback")
        .setDescription("Memberikan feedback setelah membeli produk")
        .setContexts(InteractionContextType.Guild),
    async execute(interaction) {
        if (
            !interaction.member.roles.cache.has(
                interaction.client.config.role.buyer
            )
        ) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Gagal")
                        .setColor(interaction.client.config.embed.fail)
                        .setDescription(
                            `Kamu perlu memiliki role <@&${interaction.client.config.role.buyer}> untuk menggunakan perintah ini!`
                        ),
                ],
                flags: MessageFlags.Ephemeral,
            });
        }

        interaction.showModal(
            new ModalBuilder()
                .setCustomId("feedback")
                .setTitle("Form Feedback")
                .addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId("pesan")
                            .setLabel("Pesan Feedback")
                            .setMaxLength(2048)
                            .setPlaceholder("Terpercaya...")
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(true)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId("bintang")
                            .setLabel("Bintang (1 - 5)")
                            .setMinLength(1)
                            .setMaxLength(5)
                            .setPlaceholder("Contoh: 5")
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    )
                )
        );
    },
};
