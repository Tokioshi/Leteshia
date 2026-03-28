const {
    EmbedBuilder,
    MessageFlags,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");
const {
    playNext,
    playPrevious,
    togglePause,
    updateNowPlayingLog,
    getPlaylist,
    getCurrentSong,
} = require("./musicPlayer");

const SONGS_PER_PAGE = 15;
const COLLECTOR_TIMEOUT = 300_000;
const EMBED_COLOR = 12928528;

function ephemeralEmbed(color, description) {
    return {
        embeds: [new EmbedBuilder().setColor(color).setDescription(description)],
        flags: MessageFlags.Ephemeral,
    };
}

function buildQueueEmbed(playlistData, currentSong, page, totalPages) {
    const start = page * SONGS_PER_PAGE;
    const pageSongs = playlistData.slice(start, start + SONGS_PER_PAGE);

    const description = pageSongs
        .map((song, i) => {
            const index = start + i + 1;
            const isCurrent = currentSong?.name === song.name;
            const name = isCurrent ? `▶ **${song.name}**` : song.name;
            return `${index}. ${name} (${song.duration})`;
        })
        .join("\n");

    return new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle("📜 Lofi Playlist")
        .setDescription(description)
        .setFooter({
            text: `Page ${page + 1}/${totalPages} • ${playlistData.length} songs • Looping`,
        });
}

function buildQueueRow(page, totalPages, disabled = false) {
    const isFirst = disabled || page === 0;
    const isLast = disabled || page === totalPages - 1;

    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("lofi_queue_first")
            .setEmoji("⏮️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(isFirst),
        new ButtonBuilder()
            .setCustomId("lofi_queue_prev")
            .setEmoji("◀️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(isFirst),
        new ButtonBuilder()
            .setCustomId("lofi_queue_info")
            .setLabel(`${page + 1}/${totalPages}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId("lofi_queue_next")
            .setEmoji("▶️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(isLast),
        new ButtonBuilder()
            .setCustomId("lofi_queue_last")
            .setEmoji("⏭️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(isLast),
    );
}

async function handleLofiPause(interaction) {
    const isNowPlaying = togglePause();

    const currentSong = await getCurrentSong();
    if (currentSong) {
        await updateNowPlayingLog(interaction.client, currentSong, "Button").catch(() => {});
    }

    const status = isNowPlaying ? "▶️ Music resumed." : "⏸️ Music paused.";
    await interaction.reply(ephemeralEmbed("Green", status));
}

async function handleLofiPrevious(interaction) {
    await playPrevious(interaction.client, interaction.user.toString());
    await interaction.reply(ephemeralEmbed("Green", "⏮️ Returned to the previous song!"));
}

async function handleLofiNext(interaction) {
    await playNext(interaction.client, interaction.user.toString());
    await interaction.reply(ephemeralEmbed("Green", "⏭️ Skipped to the next song!"));
}

async function handleLofiQueue(interaction) {
    const playlistData = getPlaylist();

    if (playlistData.length === 0) {
        return interaction.reply(ephemeralEmbed("Red", "Playlist is empty."));
    }

    const currentSong = await getCurrentSong();
    const totalPages = Math.ceil(playlistData.length / SONGS_PER_PAGE);
    let currentPage = 0;

    await interaction.reply({
        embeds: [buildQueueEmbed(playlistData, currentSong, currentPage, totalPages)],
        components: [buildQueueRow(currentPage, totalPages)],
        flags: MessageFlags.Ephemeral,
    });

    const message = await interaction.fetchReply();
    const collector = message.createMessageComponentCollector({
        filter: (i) => i.user.id === interaction.user.id,
        time: COLLECTOR_TIMEOUT,
    });

    const pageActions = {
        lofi_queue_first: () => 0,
        lofi_queue_prev: () => Math.max(0, currentPage - 1),
        lofi_queue_next: () => Math.min(totalPages - 1, currentPage + 1),
        lofi_queue_last: () => totalPages - 1,
    };

    collector.on("collect", async (i) => {
        const resolve = pageActions[i.customId];
        if (resolve) currentPage = resolve();

        await i.update({
            embeds: [buildQueueEmbed(playlistData, currentSong, currentPage, totalPages)],
            components: [buildQueueRow(currentPage, totalPages)],
        });
    });

    collector.on("end", () => {
        message
            .edit({ components: [buildQueueRow(currentPage, totalPages, true)] })
            .catch(() => {});
    });
}

module.exports = {
    handleLofiPause,
    handleLofiPrevious,
    handleLofiNext,
    handleLofiQueue,
};
