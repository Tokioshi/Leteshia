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
const ffprobePath = resolveFfprobePath();

const MUSIC_FOLDER = path.join(__dirname, "../assets/music");

let player = null;
let connection = null;
let currentSongIndex = 0;
let playlist = [];
let nowPlayingMessage = null;

function resolveFfprobePath() {
    try {
        return require("@ffprobe-installer/ffprobe").path;
    } catch {}
    try {
        return require("ffprobe-static").path;
    } catch {}
    try {
        const ffmpegPath = require("ffmpeg-static");
        return ffmpegPath.replace(/ffmpeg(\.exe)?$/i, "ffprobe$1");
    } catch {}
    return "ffprobe";
}

function getControlRow() {
    const isPaused = player?.state?.status === AudioPlayerStatus.Paused;

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
            .setCustomId("lofi_queue")
            .setLabel("Show Queue")
            .setStyle(ButtonStyle.Secondary),
    );
}

function togglePause() {
    if (!player || !player.state) return false;

    if (player.state.status === AudioPlayerStatus.Paused) {
        player.unpause();
        return true;
    } else if (player.state.status === AudioPlayerStatus.Playing) {
        player.pause();
        return false;
    }
    return false;
}

function stopMusic() {
    player?.stop();
    connection?.destroy();
    player = null;
    connection = null;
}

async function getDuration(filePath) {
    return new Promise((resolve) => {
        const args = ["-v", "quiet", "-print_format", "json", "-show_format", filePath];
        execFile(ffprobePath, args, { timeout: 10000 }, (error, stdout) => {
            if (error) {
                console.warn(
                    chalk.yellow("[WARN]"),
                    chalk.white(`ffprobe error on "${path.basename(filePath)}": ${error.message}`),
                );
                return resolve("Unknown");
            }
            if (!stdout?.trim()) {
                console.warn(
                    chalk.yellow("[WARN]"),
                    chalk.white(`ffprobe empty output for "${path.basename(filePath)}"`),
                );
                return resolve("Unknown");
            }
            try {
                const data = JSON.parse(stdout);
                const secs = parseFloat(data.format?.duration || 0);
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
    try {
        const mm = await import("music-metadata");
        const meta = await mm.parseFile(filePath, { skipCovers: false });
        const { common } = meta;

        const picture = common.picture?.[0] ?? null;

        return {
            artist: common.artist || common.artists?.join(", ") || "Unknown Artist",
            album: common.album || "Unknown Album",
            year: common.year ? String(common.year) : null,
            source: common.comment?.[0]?.text || null,
            cover: picture ? Buffer.from(picture.data) : null,
            coverMime: picture?.format ?? "image/jpeg",
        };
    } catch (err) {
        console.warn(
            chalk.yellow("[WARN]"),
            chalk.white(`Failed to read metadata for "${path.basename(filePath)}": ${err.message}`),
        );
        return {
            artist: "Unknown Artist",
            album: "Unknown Album",
            year: null,
            source: null,
            cover: null,
            coverMime: "image/jpeg",
        };
    }
}

async function loadPlaylist() {
    const files = fs.readdirSync(MUSIC_FOLDER).filter((file) => file.endsWith(".mp3"));

    if (files.length === 0) {
        console.error(chalk.red("[ERROR]"), chalk.white("Music folder is empty!"));
        process.exit(1);
    }

    playlist = await Promise.all(
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
}

async function playSong(index, client, requestedBy = "Playlist") {
    const song = playlist[index];
    const filePath = path.join(MUSIC_FOLDER, `${song.name}.mp3`);

    const resource = createAudioResource(filePath, { inlineVolume: true });
    player.play(resource);
    currentSongIndex = index;

    await updateNowPlayingLog(client, song, requestedBy);
}

async function playNext(client, requestedBy = "Playlist") {
    const nextIndex = (currentSongIndex + 1) % playlist.length;
    await playSong(nextIndex, client, requestedBy);
}

async function getCurrentSong() {
    if (!playlist.length || currentSongIndex < 0) {
        return null;
    }

    const song = playlist[currentSongIndex];
    if (!song) return null;

    const filePath = path.join(MUSIC_FOLDER, `${song.name}.mp3`);

    return {
        ...song,
        filePath,
        index: currentSongIndex,
        totalSongs: playlist.length,
        isPlaying: player?.state?.status === AudioPlayerStatus.Playing,
    };
}

async function initMusicPlayer(client) {
    const guild = client.guilds.cache.get(client.config.guildId);
    if (!guild) return console.error(chalk.red("[ERROR]"), chalk.white("Wrong Guild ID!"));

    const voiceChannel = guild.channels.cache.get(client.config.channel.voiceChannel);
    if (!voiceChannel || voiceChannel.type !== 2) {
        return console.error(chalk.red("[ERROR]"), chalk.white("Wrong Voice Channel ID!"));
    }

    await loadPlaylist();

    await fetchExistingNowPlayingMessage(client);

    connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
    });

    player = createAudioPlayer({
        behaviors: { noSubscriber: NoSubscriberBehavior.Pause },
    });

    connection.subscribe(player);
    await playSong(0, client);

    player.on(AudioPlayerStatus.Idle, () => playNext(client, "Playlist"));

    module.exports.getCurrentSong = getCurrentSong;

    player.on("error", (error) => {
        console.error(chalk.red("[ERROR]"), chalk.white(`Player error: ${error.message}`));
        playNext(client);
    });
}

async function getSongByName(songName) {
    if (!playlist.length) {
        await loadPlaylist();
    }

    const normalizedName = songName.toLowerCase().trim();

    let found = playlist.find((song) => song.name.toLowerCase() === normalizedName);

    if (!found) {
        found = playlist.find((song) => song.name.toLowerCase().includes(normalizedName));
    }

    return found || null;
}

async function isBotInVoice(client) {
    const guild = client.guilds.cache.get(client.config.guildId);
    if (!guild) return false;

    const voiceChannel = guild.channels.cache.get(client.config.channel.voiceChannel);
    if (!voiceChannel) return false;

    return voiceChannel.members.has(client.user.id);
}

async function joinAndPlayFrom(songName, client, user) {
    const guild = client.guilds.cache.get(client.config.guildId);
    if (!guild) throw new Error("Guild not found");

    const voiceChannel = guild.channels.cache.get(client.config.channel.voiceChannel);
    if (!voiceChannel || voiceChannel.type !== 2) {
        throw new Error("Voice channel not found or invalid");
    }

    connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
    });

    if (!player) {
        player = createAudioPlayer({
            behaviors: { noSubscriber: NoSubscriberBehavior.Pause },
        });
        connection.subscribe(player);

        player.on(AudioPlayerStatus.Idle, () => playNext(client));
        player.on("error", (error) => {
            console.error(chalk.red("[ERROR]"), chalk.white(`Player error: ${error.message}`));
            playNext(client);
        });
    }

    const song = await getSongByName(songName);
    if (!song) throw new Error(`Song "${songName}" not found`);

    const requestBy = user || "Playlist";

    const index = playlist.findIndex((s) => s.name === song.name);
    await playSong(index, client, requestBy);

    return song;
}

async function updateNowPlayingLog(client, song, requestedBy = "Playlist") {
    const logChannel = client.channels.cache.get(client.config.channel.logChannel);
    if (!logChannel?.isTextBased()) return;

    const linkField = song.meta.source ? `[Click Here](${song.meta.source})` : "—";

    const embed = new EmbedBuilder()
        .setColor(12928528)
        .setTitle(song.name)
        .setAuthor({ name: "🎵 Now Playing" })
        .setThumbnail(
            song.meta.cover
                ? `attachment://cover.${song.meta.coverMime.split("/")[1] || "jpg"}`
                : null,
        )
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

    const row = getControlRow();

    const files = song.meta.cover
        ? [
              new AttachmentBuilder(song.meta.cover, {
                  name: `cover.${song.meta.coverMime.split("/")[1] || "jpg"}`,
              }),
          ]
        : [];

    if (!nowPlayingMessage) {
        await fetchExistingNowPlayingMessage(client);
    }

    if (nowPlayingMessage) {
        try {
            await nowPlayingMessage.edit({ embeds: [embed], components: [row], files });
            return;
        } catch (error) {
            console.warn(
                chalk.yellow("[WARN]"),
                chalk.white("Failed to edit existing message, will create new one"),
            );
            nowPlayingMessage = null;
        }
    }

    nowPlayingMessage = await logChannel.send({ embeds: [embed], components: [row], files });
    console.log(chalk.yellow("[INFO]"), chalk.white("Created new Now Playing message as fallback"));
}

async function fetchExistingNowPlayingMessage(client) {
    if (nowPlayingMessage) return nowPlayingMessage;

    try {
        const logChannel = client.channels.cache.get(client.config.channel.logChannel);
        if (!logChannel?.isTextBased()) return null;

        nowPlayingMessage = await logChannel.messages.fetch(client.config.channel.updateId);
        return nowPlayingMessage;
    } catch (error) {
        console.warn(
            chalk.yellow("[WARN]"),
            chalk.white(
                `Could not fetch existing Now Playing message (${client.config.channel.updateId}). Will create new one if needed.`,
            ),
        );
        nowPlayingMessage = null;
        return null;
    }
}

async function playPrevious(client, requestedBy = "Playlist") {
    if (!playlist.length) return;
    const prevIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
    await playSong(prevIndex, client, requestedBy);
}

module.exports = {
    initMusicPlayer,
    stopMusic,
    playSong,
    playNext,
    playPrevious,
    getCurrentSong,
    getPlaylist: () => playlist,
    getSongByName,
    joinAndPlayFrom,
    isBotInVoice,
    updateNowPlayingLog,
    togglePause,
};
