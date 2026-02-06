const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
    InteractionContextType,
    MessageFlags,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("reload")
        .setDescription("Reload command without restarting bot")
        .addStringOption((option) =>
            option.setName("command").setDescription("Command to reload").setRequired(true),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setContexts(InteractionContextType.Guild),
    async execute(interaction) {
        if (interaction.user.id !== interaction.client.config.developer.tokioshy) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Failed")
                        .setColor("Red")
                        .setDescription("You are not authorized to execute this command!"),
                ],
                flags: MessageFlags.Ephemeral,
            });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const commandName = interaction.options.getString("command").toLowerCase();
        const command = interaction.client.commands.get(commandName);

        if (!command) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Failed")
                        .setColor("Yellow")
                        .setDescription(
                            `Command \`${commandName}\` was not found in the client collection`,
                        ),
                ],
            });
        }

        const commandPath = command.path;

        try {
            delete require.cache[require.resolve(commandPath)];

            const newCommand = require(commandPath);
            newCommand.path = commandPath;
            interaction.client.commands.set(newCommand.data.name, newCommand);

            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Command Reloaded")
                        .setColor("Green")
                        .setDescription(
                            `Command \`${newCommand.data.name}\` has been successfully reloaded!`,
                        ),
                ],
            });
        } catch (error) {
            console.error(error);

            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("🚨 Reload Error")
                        .setColor("Red")
                        .setDescription(`Failed to reload command \`${commandName}\`.`)
                        .addFields({
                            name: "Error Message",
                            value: `\`\`\`${error.message}\`\`\``,
                        }),
                ],
            });
        }
    },
};
