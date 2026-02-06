const {
    SlashCommandBuilder,
    EmbedBuilder,
    LabelBuilder,
    ModalBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    TextInputBuilder,
    TextInputStyle,
    InteractionContextType,
    MessageFlags,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("feedback")
        .setDescription("Provide feedback after purchasing a product")
        .setContexts(InteractionContextType.Guild),
    async execute(interaction) {
        if (!interaction.member.roles.cache.has(interaction.client.config.role.buyer)) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setTitle("Failed")
                        .setDescription("You are not authorized to execute this command!"),
                ],
                flags: MessageFlags.Ephemeral,
            });
        }

        interaction.showModal(
            new ModalBuilder()
                .setTitle("Feedback Form")
                .setCustomId("feedback")
                .addLabelComponents(
                    new LabelBuilder()
                        .setLabel("Feedback Message")
                        .setTextInputComponent(
                            new TextInputBuilder()
                                .setCustomId("feedback_message")
                                .setStyle(TextInputStyle.Paragraph),
                        ),
                )
                .addLabelComponents(
                    new LabelBuilder()
                        .setLabel("Star (1 -  5)")
                        .setStringSelectMenuComponent(
                            new StringSelectMenuBuilder()
                                .setCustomId("feedback_star")
                                .setPlaceholder("Choose between 1 and 5")
                                .addOptions(
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel("⭐ ⭐ ⭐ ⭐ ⭐")
                                        .setValue("⭐ ⭐ ⭐ ⭐ ⭐"),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel("⭐ ⭐ ⭐ ⭐")
                                        .setValue("⭐ ⭐ ⭐ ⭐"),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel("⭐ ⭐ ⭐")
                                        .setValue("⭐ ⭐ ⭐"),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel("⭐ ⭐")
                                        .setValue("⭐ ⭐"),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel("⭐")
                                        .setValue("⭐"),
                                ),
                        ),
                ),
        );
    },
};
