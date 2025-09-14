const {
    SlashCommandBuilder,
    InteractionContextType,
    EmbedBuilder,
    MessageFlags,
} = require("discord.js");
const path = require("path");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("reload")
        .setDescription("Reload a command without restarting the bot")
        .addStringOption((option) =>
            option
                .setName("command")
                .setDescription("The command to reload")
                .setRequired(true)
        )
        .setContexts(InteractionContextType.Guild),
    async execute(interaction) {
        if (
            interaction.user.id !== interaction.client.config.developer.tokioshy
        ) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Gagal")
                        .setColor(interaction.client.config.embed.fail)
                        .setDescription(
                            "This command is only available for developer."
                        ),
                ],
                flags: MessageFlags.Ephemeral,
            });
        }

        const commandName = interaction.options
            .getString("command")
            .toLowerCase();
        const command = interaction.client.commands.get(commandName);

        if (!command) {
            return interaction.reply({
                content: `❌ Command \`${commandName}\` not found.`,
                flags: [MessageFlags.Ephemeral],
            });
        }

        const commandPath = path.join(__dirname, `${commandName}.js`);

        try {
            delete require.cache[require.resolve(commandPath)];

            const newCommand = require(commandPath);
            interaction.client.commands.set(newCommand.data.name, newCommand);

            await interaction.reply({
                content: `✅ Command \`${newCommand.data.name}\` was reloaded!`,
                flags: [MessageFlags.Ephemeral],
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: `❌ Failed to reload command \`${commandName}\`.\n\`\`\`${error.message}\`\`\``,
                flags: [MessageFlags.Ephemeral],
            });
        }
    },
};
