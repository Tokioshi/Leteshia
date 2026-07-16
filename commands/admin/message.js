const {
    SlashCommandBuilder,
    LabelBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    FileUploadBuilder,
    InteractionContextType,
    PermissionFlagsBits,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("message")
        .setDescription("Send a message as bot")
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        interaction.showModal(
            new ModalBuilder()
                .setTitle("Message Form")
                .setCustomId("message")
                .addLabelComponents(
                    new LabelBuilder()
                        .setLabel("Text Content")
                        .setTextInputComponent(
                            new TextInputBuilder()
                                .setCustomId("text")
                                .setStyle(TextInputStyle.Paragraph)
                                .setMinLength(1)
                                .setMaxLength(4000)
                                .setRequired(false),
                        ),
                )
                .addLabelComponents(
                    new LabelBuilder()
                        .setLabel("Attachment")
                        .setFileUploadComponent(
                            new FileUploadBuilder()
                                .setCustomId("attachment")
                                .setRequired(false)
                                .setMaxValues(10),
                        ),
                ),
        );
    },
};
