const {
    SlashCommandBuilder,
    EmbedBuilder,
    LabelBuilder,
    ModalBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    UserSelectMenuBuilder,
    FileUploadBuilder,
    PermissionFlagsBits,
    MessageFlags,
    InteractionContextType,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("testimoni")
        .setDescription("Create a new testimonial")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setContexts(InteractionContextType.Guild),
    async execute(interaction) {
        if (interaction.user.id !== interaction.client.config.developer.tokioshy) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setTitle("Gagal")
                        .setDescription("You are not authorized to run this command!"),
                ],
                flags: MessageFlags.Ephemeral,
            });
        }

        interaction.showModal(
            new ModalBuilder()
                .setTitle("Testimoni Form")
                .setCustomId("testimoni")
                .addLabelComponents(
                    new LabelBuilder()
                        .setLabel("Mention the customer who bought it")
                        .setUserSelectMenuComponent(
                            new UserSelectMenuBuilder()
                                .setCustomId("customer")
                                .setPlaceholder("Select Customer"),
                        ),
                )
                .addLabelComponents(
                    new LabelBuilder()
                        .setLabel("Mention the product that was bought")
                        .setStringSelectMenuComponent(
                            new StringSelectMenuBuilder()
                                .setCustomId("product")
                                .setPlaceholder("Select Package")
                                .addOptions(
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel("Discord Bot - Basic 1")
                                        .setValue("Basic 1"),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel("Discord Bot - Basic 2")
                                        .setValue("Basic 2"),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel("Discord Bot - Basic 3")
                                        .setValue("Basic 3"),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel("Discord Bot - Intermediate 1")
                                        .setValue("Intermediate 1"),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel("Discord Bot - Intermediate 2")
                                        .setValue("Intermediate 2"),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel("Discord Bot - Intermediate 3")
                                        .setValue("Intermediate 3"),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel("Discord Bot - Advanced 1")
                                        .setValue("Advanced 1"),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel("Discord Bot - Advanced 2")
                                        .setValue("Advanced 2"),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel("Discord Bot - Advanced 3")
                                        .setValue("Advanced 3"),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel("Discord Server - Basic Package")
                                        .setValue("Basic"),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel("Discord Server - Reguler Package")
                                        .setValue("Reguler"),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel("Discord Server - Lite Package")
                                        .setValue("Lite"),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel("Discord Server - Enterprise Package")
                                        .setValue("Enterprise"),
                                ),
                        ),
                )
                .addLabelComponents(
                    new LabelBuilder()
                        .setLabel("Screenshot of the final product")
                        .setFileUploadComponent(new FileUploadBuilder().setCustomId("screenshot")),
                ),
        );
    },
};
