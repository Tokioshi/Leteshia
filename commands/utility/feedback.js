const {
    SlashCommandBuilder,
    EmbedBuilder,
    LabelBuilder,
    ModalBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    TextInputBuilder,
    TextInputStyle,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("feedback")
        .setDescription("Berikan umpan balik setelah membeli produk")
        .setContexts(0),
    async execute(interaction) {
        if (
            !interaction.member.roles.cache.has(
                interaction.client.config.role.buyer
            )
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

        interaction.showModal(
            new ModalBuilder()
                .setTitle("Feedback Form")
                .setCustomId("feedback")
                .addLabelComponents(
                    new LabelBuilder()
                        .setLabel("Pesan Feedback")
                        .setTextInputComponent(
                            new TextInputBuilder()
                                .setCustomId("feedback_message")
                                .setStyle(TextInputStyle.Paragraph)
                        )
                )
                .addLabelComponents(
                    new LabelBuilder()
                        .setLabel("Bintang (1 -  5)")
                        .setStringSelectMenuComponent(
                            new StringSelectMenuBuilder()
                                .setCustomId("feedback_star")
                                .setPlaceholder("Pilih antara 1 dan 5")
                                .addOptions(
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel("⭐ ⭐ ⭐ ⭐ ⭐")
                                        .setValue("5"),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel("⭐ ⭐ ⭐ ⭐")
                                        .setValue("4"),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel("⭐ ⭐ ⭐")
                                        .setValue("37"),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel("⭐ ⭐")
                                        .setValue("2"),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel("⭐")
                                        .setValue("1")
                                )
                        )
                )
        );
    },
};
