const {
    SlashCommandBuilder,
    InteractionContextType,
    MessageFlags,
    PermissionFlagsBits,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("display")
        .setDescription("Manage bot display settings")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("style")
                .setDescription("Change the bot name style in this server")
                .addIntegerOption((option) =>
                    option
                        .setName("font_id")
                        .setDescription("Select the font style")
                        .setRequired(true)
                        .addChoices(
                            { name: "Tempo / Bangers", value: 1 },
                            { name: "BioRhyme", value: 2 },
                            { name: "Sakura / Cherry Bomb", value: 3 },
                            { name: "Jellybean / Chicle", value: 4 },
                            { name: "Modern / Compagnon", value: 5 },
                            { name: "MuseoModerno", value: 6 },
                            { name: "Medieval / Néo-Castel", value: 7 },
                            { name: "8Bit / Pixelify Sans", value: 8 },
                            { name: "Ribes", value: 9 },
                            { name: "Vampyre / Sinistre", value: 10 },
                            { name: "Default / gg sans", value: 11 },
                            { name: "Zilla Slab", value: 12 },
                        ),
                )
                .addIntegerOption((option) =>
                    option
                        .setName("effect_id")
                        .setDescription("Select the text effect style")
                        .setRequired(true)
                        .addChoices(
                            { name: "Solid (Single Color)", value: 1 },
                            { name: "Gradient (Two Colors)", value: 2 },
                            { name: "Neon (Glowing Outline)", value: 3 },
                            { name: "Toon (Gradient with Stroke)", value: 4 },
                            { name: "Pop (Colored Drop Shadow)", value: 5 },
                            { name: "Glow (Soft Glow)", value: 6 },
                        ),
                )
                .addStringOption((option) =>
                    option
                        .setName("color_1")
                        .setDescription("First color hex code (e.g., #FF0000)")
                        .setRequired(true),
                )
                .addStringOption((option) =>
                    option
                        .setName("color_2")
                        .setDescription("Second color hex code (e.g., #0000FF)")
                        .setRequired(true),
                ),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setContexts(InteractionContextType.Guild),
    async execute(interaction) {
        if (interaction.options.getSubcommand() === "style") {
            const fontId = interaction.options.getInteger("font_id");
            const effectId = interaction.options.getInteger("effect_id");
            const hex1 = interaction.options.getString("color_1").replace("#", "");
            const hex2 = interaction.options.getString("color_2").replace("#", "");

            const color1 = parseInt(hex1, 16);
            const color2 = parseInt(hex2, 16);

            if (isNaN(color1) || isNaN(color2)) {
                return await interaction.reply({
                    content:
                        "Invalid hex color format provided. Please use valid hex codes like #FF0000.",
                    flags: MessageFlags.Ephemeral,
                });
            }

            const body = {
                display_name_font_id: fontId,
                display_name_effect_id: effectId,
                display_name_colors: [color1, color2],
            };

            try {
                await interaction.client.rest.patch(`/guilds/${interaction.guildId}/members/@me`, {
                    body,
                });
                await interaction.reply({
                    content: "Successfully updated bot display name style for this server.",
                    flags: MessageFlags.Ephemeral,
                });
            } catch (error) {
                await interaction.reply({
                    content:
                        "Failed to apply display name style. Make sure the bot has proper permissions.",
                    flags: MessageFlags.Ephemeral,
                });
            }
        }
    },
};
