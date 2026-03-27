const {
    SlashCommandBuilder,
    InteractionContextType,
    EmbedBuilder,
    MessageFlags,
} = require("discord.js");
const { playNext, joinAndPlayFrom, isBotInVoice } = require("../../utils/musicPlayer");
const chalk = require("chalk");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("lofi")
        .setDescription("Control the lofi music player")
        .addSubcommand((sub) =>
            sub.setName("skip").setDescription("Skip to the next song in the playlist"),
        )
        .addSubcommand((sub) =>
            sub
                .setName("play")
                .setDescription("Join voice and start playing from a specific song")
                .addStringOption((option) =>
                    option
                        .setName("song")
                        .setDescription("Song to start playing from")
                        .setRequired(true)
                        .setAutocomplete(true),
                ),
        )
        .setContexts(InteractionContextType.Guild),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            if (subcommand === "skip") {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                await playNext(interaction.client, interaction.user.toString());

                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("Green")
                            .setDescription("The music has been skipped to the next song!"),
                    ],
                });
            }

            if (subcommand === "play") {
                const songInput = interaction.options.getString("song");

                const isInVoice = await isBotInVoice(interaction.client);
                if (isInVoice) {
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(
                                    "Bot is already in the voice channel.\nUse `/lofi skip` to change song instead.",
                                ),
                        ],
                        flags: MessageFlags.Ephemeral,
                    });
                }

                await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                await joinAndPlayFrom(songInput, interaction.client, interaction.user.toString());

                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("Green")
                            .setDescription("Successfully play the requested song!"),
                    ],
                });
            }
        } catch (error) {
            console.error(
                chalk.red("[ERROR]"),
                chalk.white(`Failed to execute lofi ${subcommand}:`),
                error,
            );

            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setDescription("Failed to execute command. Please contact the developer."),
                ],
                flags: MessageFlags.Ephemeral,
            });
        }
    },
};
