const { EmbedBuilder } = require("discord.js");

async function handleCommand(interaction) {
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(
                        `Perintah tidak dikenal \`${interaction.commandName}\`. Mungkin perintah tersebut telah dihapus`
                    ),
            ],
            flags: 64,
        });
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(
            `Error executing command ${interaction.commandName}:`,
            error
        );
        await handleCommandError(interaction);
    }
}

async function handleCommandError(interaction) {
    const errorEmbed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(
            `Terjadi masalah saat menjalankan \`${interaction.commandName}\`.`
        );

    if (!interaction.replied) {
        await interaction.reply({ embeds: [errorEmbed], flags: 64 });
    } else if (interaction.deferred) {
        await interaction.followUp({ embeds: [errorEmbed], flags: 64 });
    }
}

module.exports = {
    handleCommand,
};
