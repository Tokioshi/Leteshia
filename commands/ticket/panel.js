const {
    SlashCommandBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    InteractionContextType,
    MessageFlags,
    PermissionFlagsBits,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("panel")
        .setDescription("Send ticket panel to current channel")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setContexts(InteractionContextType.Guild),
    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const embed = new EmbedBuilder()
            .setColor("#ce0200")
            .setTitle("Ticket Service Harmony")
            .setDescription(
                "To create a ticket (buying/asking), please click the button below. Choose the category 'Buy' or 'Ask'. Please do not create duplicate tickets or without a clear purpose!",
            )
            .setImage("https://i.pinimg.com/1200x/5c/ff/be/5cffbe0205462492b0d7fae908db8929.jpg");

        const buy = new ButtonBuilder()
            .setCustomId("buy")
            .setLabel("Buy")
            .setEmoji("🏷️")
            .setStyle(ButtonStyle.Primary);

        const ask = new ButtonBuilder()
            .setCustomId("ask")
            .setLabel("Ask")
            .setEmoji("✋")
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(buy, ask);

        interaction.channel
            .send({
                embeds: [embed],
                components: [row],
            })
            .then(() => {
                interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("Green")
                            .setDescription("Successfully sent the ticket panel!"),
                    ],
                });
            });
    },
};
