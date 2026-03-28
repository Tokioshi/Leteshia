const {
    SlashCommandBuilder,
    InteractionContextType,
    EmbedBuilder,
    MessageFlags,
} = require("discord.js");
const { playNext, joinAndPlayFrom, isBotInVoice } = require("../../utils/musicPlayer");
const chalk = require("chalk");

function ephemeralEmbed(color, description) {
    return {
        embeds: [new EmbedBuilder().setColor(color).setDescription(description)],
        flags: MessageFlags.Ephemeral,
    };
}

async function handleSkip(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await playNext(interaction.client, interaction.user.toString());
    await interaction.editReply(ephemeralEmbed("Green", "⏭️ Skipped to the next song!"));
}

async function handlePlay(interaction) {
    const isInVoice = await isBotInVoice(interaction.client);

    if (isInVoice) {
        return interaction.reply(
            ephemeralEmbed(
                "Red",
                "Bot is already in the voice channel.\nUse `/lofi skip` to change song instead.",
            ),
        );
    }

    const songInput = interaction.options.getString("song");

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await joinAndPlayFrom(songInput, interaction.client, interaction.user.toString());
    await interaction.editReply(
        ephemeralEmbed("Green", "▶️ Successfully playing the requested song!"),
    );
}

const SUBCOMMAND_HANDLERS = {
    skip: handleSkip,
    play: handlePlay,
};

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
        const handler = SUBCOMMAND_HANDLERS[subcommand];

        if (!handler) return;

        let deferred = false;
        const originalDeferReply = interaction.deferReply.bind(interaction);
        interaction.deferReply = async (...args) => {
            deferred = true;
            return originalDeferReply(...args);
        };

        try {
            await handler(interaction);
        } catch (error) {
            console.error(
                chalk.red("[ERROR]"),
                chalk.white(`Failed to execute lofi ${subcommand}:`),
                error,
            );

            const errorPayload = ephemeralEmbed(
                "Red",
                "Failed to execute command. Please contact the developer.",
            );

            if (deferred) {
                await interaction.editReply(errorPayload).catch(() => {});
            } else {
                await interaction.reply(errorPayload).catch(() => {});
            }
        }
    },
};
