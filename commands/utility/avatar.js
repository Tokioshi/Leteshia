const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("avatar")
        .setDescription("Menampilkan avatar pengguna")
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("Pilih pengguna untuk menampilkan avatarnya")
                .setRequired(false)
        )
        .setContexts(0),
    async execute(interaction) {
        const user = interaction.options.getUser("user") || interaction.user;

        const embed = new EmbedBuilder()
            .setTitle(`${user.bot ? user.tag : user.displayName} avatar`)
            .setColor("Orange")
            .setImage(user.displayAvatarURL({ size: 4096 }));

        await interaction.reply({ embeds: [embed] });
    },
};
