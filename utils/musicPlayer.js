const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    NoSubscriberBehavior,
} = require("@discordjs/voice");
const {
    EmbedBuilder,
    AttachmentBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const { execFile } = require("child_process");
const chalk = require("chalk");

const MUSIC_FOLDER = path.join(__dirname, "../assets/music");
const EMBED_COLOR = "#E74C3C";
const FFPROBE_PATH = resolveFfprobePath();

const state = {
    player: null,
    connection: null,
    currentSongIndex: 0,
    playlist: [],
    nowPlayingMessage: null,
    playlistLoaded: false,
};

function resolveFfprobePath() {
    const candidates = [
        () => require("@ffprobe-installer/ffprobe").path,
        () => require("ffprobe-static").path,
        () => require("ffmpeg-static").replace(/ffmpeg(\.exe)?$/i, "ffprobe$1"),
    ];

    for (const candidate of candidates) {
        try {
            return candidate();
        } catch {}
    }

    return "ffprobe";
}

const log = {
    info: (msg) => console.log(chalk.yellow("[INFO]"), chalk.white(msg)),
    warn: (msg) => console.warn(chalk.yellow("[WARN]"), chalk.white(msg)),
    error: (msg) => console.error(chalk.red("[ERROR]"), chalk.white(msg)),
};

function getControlRow() {
    const isPaused = state.player?.state?.status === AudioPlayerStatus.Paused;

    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("lofi_pause")
            .setLabel(isPaused ? "Resume" : "Pause")
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId("lofi_previous")
            .setLabel("Previous")
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("lofi_next").setLabel("Next").setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId("lofi_lyrics")
            .setLabel("Lyrics")
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId("lofi_queue")
            .setLabel("Show Queue")
            .setStyle(ButtonStyle.Secondary),
    );
}

function buildNowPlayingEmbed(song, requestedBy) {
    const coverExt = song.meta.coverMime?.split("/")[1] || "jpg";
    const thumbnail = song.meta.cover ? `attachment://cover.${coverExt}` : null;
    const linkField = song.meta.source ? `[Click Here](${song.meta.source})` : "—";

    return new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle(song.name)
        .setAuthor({ name: "🎵 Now Playing" })
        .setThumbnail(thumbnail)
        .setFooter({ text: "🔁 Local playlist is looping" })
        .setTimestamp()
        .setFields(
            { name: "👤 Artist", value: song.meta.artist || "Unknown", inline: true },
            { name: "💿 Album", value: song.meta.album || "Unknown", inline: true },
            { name: "⌚ Duration", value: song.duration || "Unknown", inline: true },
            { name: "📅 Year", value: song.meta.year || "—", inline: true },
            { name: "🔗 Link", value: linkField, inline: true },
            { name: "✋ Requested", value: requestedBy, inline: true },
        );
}

function buildCoverAttachments(song) {
    if (!song.meta.cover) return [];

    const coverExt = song.meta.coverMime?.split("/")[1] || "jpg";
    return [new AttachmentBuilder(song.meta.cover, { name: `cover.${coverExt}` })];
}

async function getDuration(filePath) {
    return new Promise((resolve) => {
        const args = ["-v", "quiet", "-print_format", "json", "-show_format", filePath];

        execFile(FFPROBE_PATH, args, { timeout: 10000 }, (error, stdout) => {
            const label = path.basename(filePath);

            if (error) {
                log.warn(`ffprobe error on "${label}": ${error.message}`);
                return resolve("Unknown");
            }

            if (!stdout?.trim()) {
                log.warn(`ffprobe empty output for "${label}"`);
                return resolve("Unknown");
            }

            try {
                const { format } = JSON.parse(stdout);
                const secs = parseFloat(format?.duration || 0);

                if (isNaN(secs) || secs <= 0) return resolve("Unknown");

                const min = Math.floor(secs / 60);
                const sec = Math.floor(secs % 60);
                resolve(`${min}:${sec.toString().padStart(2, "0")}`);
            } catch {
                resolve("Unknown");
            }
        });
    });
}

async function getMetadata(filePath) {
    const fallback = {
        artist: "Unknown Artist",
        album: "Unknown Album",
        year: null,
        source: null,
        cover: null,
        coverMime: "image/jpeg",
    };

    try {
        const mm = await import("music-metadata");
        const meta = await mm.parseFile(filePath, { skipCovers: false });
        const { common } = meta;
        const picture = common.picture?.[0] ?? null;

        return {
            artist: common.artist || common.artists?.join(", ") || fallback.artist,
            album: common.album || fallback.album,
            year: common.year ? String(common.year) : null,
            source: common.comment?.[0]?.text || null,
            cover: picture ? Buffer.from(picture.data) : null,
            coverMime: picture?.format ?? fallback.coverMime,
        };
    } catch (err) {
        log.warn(`Failed to read metadata for "${path.basename(filePath)}": ${err.message}`);
        return fallback;
    }
}

async function loadPlaylist() {
    if (state.playlistLoaded && state.playlist.length > 0) return;

    const files = fs.readdirSync(MUSIC_FOLDER).filter((f) => f.endsWith(".mp3"));

    if (files.length === 0) {
        log.error("Music folder is empty!");
        process.exit(1);
    }

    state.playlist = await Promise.all(
        files.map(async (file) => {
            const name = file.replace(".mp3", "");
            const fullPath = path.join(MUSIC_FOLDER, file);
            const [duration, meta] = await Promise.all([
                getDuration(fullPath),
                getMetadata(fullPath),
            ]);
            return { name, duration, meta };
        }),
    );

    state.playlistLoaded = true;
}

function getPlaylist() {
    return state.playlist;
}

async function getSongByName(songName) {
    if (!state.playlistLoaded) await loadPlaylist();

    const normalized = songName.toLowerCase().trim();

    return (
        state.playlist.find((s) => s.name.toLowerCase() === normalized) ??
        state.playlist.find((s) => s.name.toLowerCase().includes(normalized)) ??
        null
    );
}

function togglePause() {
    const { player } = state;
    if (!player?.state) return false;

    if (player.state.status === AudioPlayerStatus.Paused) {
        player.unpause();
        return true;
    }

    if (player.state.status === AudioPlayerStatus.Playing) {
        player.pause();
        return false;
    }

    return false;
}

function stopMusic() {
    state.player?.stop();
    state.connection?.destroy();
    state.player = null;
    state.connection = null;
}

async function playSong(index, client, requestedBy = "Playlist") {
    const song = state.playlist[index];
    const filePath = path.join(MUSIC_FOLDER, `${song.name}.mp3`);

    state.player.play(createAudioResource(filePath, { inlineVolume: true }));
    state.currentSongIndex = index;

    await updateNowPlayingLog(client, song, requestedBy);

    const channelId = client.config.channel.voiceChannel;
    await client.rest.put(`/channels/${channelId}/voice-status`, {
        body: { status: `${song.name}` },
    });
}

async function playNext(client, requestedBy = "Playlist") {
    const nextIndex = (state.currentSongIndex + 1) % state.playlist.length;
    await playSong(nextIndex, client, requestedBy);
}

async function playPrevious(client, requestedBy = "Playlist") {
    if (!state.playlist.length) return;
    const prevIndex = (state.currentSongIndex - 1 + state.playlist.length) % state.playlist.length;
    await playSong(prevIndex, client, requestedBy);
}

async function getCurrentSong() {
    const { playlist, currentSongIndex, player } = state;
    if (!playlist.length || currentSongIndex < 0) return null;

    const song = playlist[currentSongIndex];
    if (!song) return null;

    return {
        ...song,
        filePath: path.join(MUSIC_FOLDER, `${song.name}.mp3`),
        index: currentSongIndex,
        totalSongs: playlist.length,
        isPlaying: player?.state?.status === AudioPlayerStatus.Playing,
    };
}

function resolveGuildAndChannel(client) {
    const guild = client.guilds.cache.get(client.config.guildId);
    if (!guild) {
        log.error("Wrong Guild ID!");
        return null;
    }

    const voiceChannel = guild.channels.cache.get(client.config.channel.voiceChannel);
    if (!voiceChannel || voiceChannel.type !== 2) {
        log.error("Wrong Voice Channel ID!");
        return null;
    }

    return { guild, voiceChannel };
}

function createAndSubscribePlayer(client) {
    state.player = createAudioPlayer({
        behaviors: { noSubscriber: NoSubscriberBehavior.Pause },
    });

    state.connection.subscribe(state.player);

    state.player.on(AudioPlayerStatus.Idle, () => playNext(client, "Playlist"));
    state.player.on("error", (err) => {
        log.error(`Player error: ${err.message}`);
        playNext(client);
    });
}

async function initMusicPlayer(client) {
    const resolved = resolveGuildAndChannel(client);
    if (!resolved) return;

    const { guild, voiceChannel } = resolved;

    await loadPlaylist();
    await fetchExistingNowPlayingMessage(client);

    state.connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
    });

    createAndSubscribePlayer(client);
    await playSong(0, client);
}

async function playFrom(songName, client, user) {
    const resolved = resolveGuildAndChannel(client);
    if (!resolved) throw new Error("Guild or voice channel not found");

    if (!state.player) {
        createAndSubscribePlayer(client);
    }

    const song = await getSongByName(songName);
    if (!song) throw new Error(`Song "${songName}" not found`);

    const index = state.playlist.findIndex((s) => s.name === song.name);
    await playSong(index, client, user || "Playlist");

    return song;
}

async function fetchExistingNowPlayingMessage(client) {
    if (state.nowPlayingMessage) return state.nowPlayingMessage;

    try {
        const logChannel = client.channels.cache.get(client.config.channel.logChannel);
        if (!logChannel?.isTextBased()) return null;

        state.nowPlayingMessage = await logChannel.messages.fetch(client.config.channel.updateId);
        return state.nowPlayingMessage;
    } catch {
        log.warn(
            `Could not fetch existing Now Playing message (${client.config.channel.updateId}). Will create new one if needed.`,
        );
        state.nowPlayingMessage = null;
        return null;
    }
}

async function updateNowPlayingLog(client, song, requestedBy = "Playlist") {
    const logChannel = client.channels.cache.get(client.config.channel.logChannel);
    if (!logChannel?.isTextBased()) return;

    const embed = buildNowPlayingEmbed(song, requestedBy);
    const row = getControlRow();
    const files = buildCoverAttachments(song);

    if (!state.nowPlayingMessage) {
        await fetchExistingNowPlayingMessage(client);
    }

    if (state.nowPlayingMessage) {
        try {
            await state.nowPlayingMessage.edit({ embeds: [embed], components: [row], files });
            return;
        } catch {
            log.warn("Failed to edit existing message, will create new one");
            state.nowPlayingMessage = null;
        }
    }

    state.nowPlayingMessage = await logChannel.send({ embeds: [embed], components: [row], files });
    log.info("Created new Now Playing message as fallback");
}

module.exports = {
    initMusicPlayer,
    stopMusic,
    playSong,
    playNext,
    playPrevious,
    getCurrentSong,
    getPlaylist,
    getSongByName,
    playFrom,
    updateNowPlayingLog,
    togglePause,
};
