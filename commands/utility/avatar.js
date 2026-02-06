const { SlashCommandBuilder, EmbedBuilder, InteractionContextType } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("avatar")
        .setDescription("Show user avatar")
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("Select user to show their avatar")
                .setRequired(false),
        )
        .setContexts(InteractionContextType.Guild),
    async execute(interaction) {
        const user = interaction.options.getUser("user") || interaction.user;

        const embed = new EmbedBuilder()
            .setTitle(`${user.bot ? user.tag : user.displayName} avatar`)
            .setColor("Orange")
            .setImage(user.displayAvatarURL({ size: 4096 }));

        await interaction.reply({ embeds: [embed] });
    },
};
