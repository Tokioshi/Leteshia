const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    NoSubscriberBehavior,
} = require("@discordjs/voice");
const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const { execFile } = require("child_process");
const chalk = require("chalk");

const MUSIC_FOLDER = path.join(__dirname, "../assets/music");
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

const ffprobePath = resolveFfprobePath();

let player = null;
let connection = null;
let currentSongIndex = 0;
let playlist = [];

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

async function sendLog(client, song) {
    const logChannel = client.channels.cache.get(client.config.channel.logChannel);
    if (!logChannel?.isTextBased()) return;

    const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setAuthor({ name: "🎵 Now Playing" })
        .setTitle(song.name)
        .addFields(
            { name: "👤 Artist", value: song.meta.artist, inline: true },
            { name: "💿 Album", value: song.meta.album, inline: true },
            { name: "⏱️ Duration", value: song.duration, inline: true },
        )
        .setFooter({ text: "🔁 Local playlist is looping" })
        .setTimestamp();

    if (song.meta.year) {
        embed.addFields({ name: "📅 Year", value: song.meta.year, inline: true });
    }

    if (song.meta.cover) {
        const ext = song.meta.coverMime.split("/")[1] || "jpg";
        const attachment = new AttachmentBuilder(song.meta.cover, { name: `cover.${ext}` });
        embed.setThumbnail(`attachment://cover.${ext}`);
        await logChannel.send({ embeds: [embed], files: [attachment] }).catch(() => {});
    } else {
        await logChannel.send({ embeds: [embed] }).catch(() => {});
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

async function playSong(index, client) {
    const song = playlist[index];
    const filePath = path.join(MUSIC_FOLDER, `${song.name}.mp3`);

    const resource = createAudioResource(filePath, { inlineVolume: true });
    player.play(resource);
    currentSongIndex = index;

    await sendLog(client, song);
}

async function playNext(client) {
    const nextIndex = (currentSongIndex + 1) % playlist.length;
    await playSong(nextIndex, client);
}

function stopMusic() {
    player?.stop();
    connection?.destroy();
    player = null;
    connection = null;
}

async function initMusicPlayer(client) {
    const guild = client.guilds.cache.get(client.config.guildId);
    if (!guild) return console.error(chalk.red("[ERROR]"), chalk.white("Wrong Guild ID!"));

    const voiceChannel = guild.channels.cache.get(client.config.channel.voiceChannel);
    if (!voiceChannel || voiceChannel.type !== 2) {
        return console.error(chalk.red("[ERROR]"), chalk.white("Wrong Voice Channel ID!"));
    }

    await loadPlaylist();

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

    player.on(AudioPlayerStatus.Idle, () => playNext(client));

    player.on("error", (error) => {
        console.error(chalk.red("[ERROR]"), chalk.white(`Player error: ${error.message}`));
        playNext(client);
    });
}

module.exports = {
    initMusicPlayer,
    stopMusic,
    playSong,
    playNext,
    getPlaylist: () => playlist,
    getCurrentSong: () => playlist[currentSongIndex] ?? null,
};
