const {
    SlashCommandBuilder,
    InteractionContextType,
    PermissionFlagsBits,
    MessageFlags,
    EmbedBuilder,
} = require("discord.js");
const { updateLiveReport } = require("../../utils/getExchange");
const chalk = require("chalk");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("force")
        .setDescription("Force bot to do something")
        .addSubcommand((sub) =>
            sub
                .setName("update")
                .setDescription("Choose to update something")
                .addStringOption((opt) =>
                    opt
                        .setName("type")
                        .setDescription("The type you want to force update")
                        .addChoices({ name: "Exchange Rate", value: "exchange_rate" })
                        .setRequired(true),
                ),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setContexts(InteractionContextType.Guild),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === "update") {
            const updateType = interaction.options.getString("type");

            switch (updateType) {
                case "exchange_rate": {
                    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                    try {
                        await updateLiveReport(interaction.client);

                        return interaction.editReply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor("Green")
                                    .setDescription("Exchange rate has been force-updated."),
                            ],
                        });
                    } catch (error) {
                        console.error(
                            chalk.red("[ERROR]"),
                            chalk.white("Error during force update Exchange Rate:", error),
                        );

                        return interaction.editReply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor("Red")
                                    .setDescription(
                                        "Something went wrong while updating the exchange rate.",
                                    ),
                            ],
                        });
                    }
                }
                default:
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("Red")
                                .setDescription("Unknown type to update. Please double-check."),
                        ],
                    });
            }
        }
    },
};
