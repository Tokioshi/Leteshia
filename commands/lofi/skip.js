const { SlashCommandBuilder } = require("discord.js");
const { playNext } = require("../../utils/musicPlayer");

module.exports = {
    data: new SlashCommandBuilder().setName("skip").setDescription("Skip the music"),
    async execute(interaction) {
        playNext(interaction.client);
        await interaction.reply("Skipped the music");
    },
};
