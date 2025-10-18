const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("reload")
        .setDescription("Muat ulang perintah tanpa me-restart bot")
        .addStringOption((option) =>
            option
                .setName("command")
                .setDescription("Perintah yang ingin dimuat ulang")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setContexts(0),
    async execute(interaction) {
        if (
            interaction.user.id !== interaction.client.config.developer.tokioshy
        ) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Failed")
                        .setColor("Red")
                        .setDescription(
                            "You are not authorized to execute this command!"
                        ),
                ],
                flags: 64,
            });
        }

        const commandName = interaction.options
            .getString("command")
            .toLowerCase();
        const command = interaction.client.commands.get(commandName);

        if (!command) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Failed")
                        .setColor("Yellow")
                        .setDescription(
                            `Command \`${commandName}\` was not found in the client collection`
                        ),
                ],
                flags: 64,
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
                            `Command \`${newCommand.data.name}\` has been successfully reloaded!`
                        ),
                ],
                flags: 64,
            });
        } catch (error) {
            console.error(error);

            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("🚨 Reload Error")
                        .setColor("Red")
                        .setDescription(
                            `Failed to reload command \`${commandName}\`.`
                        )
                        .addFields({
                            name: "Error Message",
                            value: `\`\`\`${error.message}\`\`\``,
                        }),
                ],
                flags: 64,
            });
        }
    },
};
