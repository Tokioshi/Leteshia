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

async function handleLofiPause(interaction) {
    togglePause();

    const currentSong = await getCurrentSong();
    if (currentSong) {
        await updateNowPlayingLog(interaction.client, currentSong, "Button").catch(() => {});
    }

    await interaction.reply({
        embeds: [
            new EmbedBuilder()
                .setColor("Green")
                .setDescription("Music player has been toggled (pause/resume)."),
        ],
        flags: MessageFlags.Ephemeral,
    });
}

async function handleLofiPrevious(interaction) {
    const userMention = interaction.user.toString();

    await playPrevious(interaction.client, userMention);

    await interaction.reply({
        embeds: [
            new EmbedBuilder().setColor("Green").setDescription("Returned to the previous song!"),
        ],
        flags: MessageFlags.Ephemeral,
    });
}

async function handleLofiNext(interaction) {
    const userMention = interaction.user.toString();

    await playNext(interaction.client, userMention);

    await interaction.reply({
        embeds: [new EmbedBuilder().setColor("Green").setDescription("Skipped to the next song!")],
        flags: MessageFlags.Ephemeral,
    });
}

async function handleLofiQueue(interaction) {
    const playlistData = getPlaylist();
    if (playlistData.length === 0) {
        return interaction.reply({
            embeds: [new EmbedBuilder().setColor("Red").setDescription("Playlist is empty.")],
            flags: MessageFlags.Ephemeral,
        });
    }

    const current = await getCurrentSong();
    const songsPerPage = 15;
    const totalPages = Math.ceil(playlistData.length / songsPerPage);
    let currentPage = 0;

    const buildEmbed = (page) => {
        const start = page * songsPerPage;
        const end = start + songsPerPage;
        const pageSongs = playlistData.slice(start, end);

        const description = pageSongs
            .map((song, i) => {
                const globalIndex = start + i;
                const marker = current && song.name === current.name ? "▶ **" : "";
                const endMarker = current && song.name === current.name ? "**" : "";
                return `${globalIndex + 1}. ${marker}${song.name}${endMarker} (${song.duration})`;
            })
            .join("\n");

        return new EmbedBuilder()
            .setColor(12928528)
            .setTitle("📜 Lofi Playlist")
            .setDescription(description)
            .setFooter({ text: `${playlistData.length} songs • Looping` });
    };

    const buildRow = (page) => {
        return new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("lofi_queue_first")
                .setEmoji("⏮️")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page === 0),
            new ButtonBuilder()
                .setCustomId("lofi_queue_prev")
                .setEmoji("◀️")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page === 0),
            new ButtonBuilder()
                .setCustomId("lofi_queue_info")
                .setLabel(`${page + 1}/${totalPages}`)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId("lofi_queue_next")
                .setEmoji("▶️")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page === totalPages - 1),
            new ButtonBuilder()
                .setCustomId("lofi_queue_last")
                .setEmoji("⏭️")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page === totalPages - 1),
        );
    };

    await interaction.reply({
        embeds: [buildEmbed(currentPage)],
        components: [buildRow(currentPage)],
        flags: MessageFlags.Ephemeral,
    });

    const message = await interaction.fetchReply();

    const collector = message.createMessageComponentCollector({
        filter: (i) => i.user.id === interaction.user.id,
        time: 300000,
    });

    collector.on("collect", async (i) => {
        if (i.customId === "lofi_queue_first") {
            currentPage = 0;
        } else if (i.customId === "lofi_queue_prev" && currentPage > 0) {
            currentPage--;
        } else if (i.customId === "lofi_queue_next" && currentPage < totalPages - 1) {
            currentPage++;
        } else if (i.customId === "lofi_queue_last") {
            currentPage = totalPages - 1;
        }

        await i.update({
            embeds: [buildEmbed(currentPage)],
            components: [buildRow(currentPage)],
        });
    });

    collector.on("end", () => {
        const disabledRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("lofi_queue_first")
                .setEmoji("⏮️")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId("lofi_queue_prev")
                .setEmoji("◀️")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId("lofi_queue_info")
                .setLabel(`${currentPage + 1}/${totalPages}`)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId("lofi_queue_next")
                .setEmoji("▶️")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId("lofi_queue_last")
                .setEmoji("⏭️")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true),
        );
        message.edit({ components: [disabledRow] }).catch(() => {});
    });
}

module.exports = {
    handleLofiPause,
    handleLofiPrevious,
    handleLofiNext,
    handleLofiQueue,
};
