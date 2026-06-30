const fs = require("fs");
const path = require("path");
const util = require("util");
const { exec } = require("child_process");
const ffmpeg = require("fluent-ffmpeg");

const execPromise = util.promisify(exec);

const TEMP_DIR = path.join(__dirname, "../temp");
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const MAX_SIZE = 10 * 1024 * 1024;
const AUDIO_BITRATE_KBPS = 96;
const SAFETY_MARGIN = 0.92;

function getVideoDuration(filePath) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) return reject(err);
            resolve(metadata.format.duration);
        });
    });
}

async function compressVideo(
    inputPath,
    outputPath,
    targetSizeBytes = MAX_SIZE,
) {
    const duration = await getVideoDuration(inputPath);
    if (!duration || duration <= 0) {
        throw new Error("Could not determine video duration.");
    }

    const totalBitrateKbps = Math.floor(
        ((targetSizeBytes * 8) / duration / 1000) * SAFETY_MARGIN,
    );
    const videoBitrateKbps = Math.max(
        totalBitrateKbps - AUDIO_BITRATE_KBPS,
        150,
    );

    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .videoCodec("libx264")
            .videoBitrate(videoBitrateKbps)
            .audioBitrate(AUDIO_BITRATE_KBPS)
            .outputOptions([
                "-preset veryfast",
                `-maxrate ${videoBitrateKbps}k`,
                `-bufsize ${videoBitrateKbps * 2}k`,
                "-movflags +faststart",
            ])
            .save(outputPath)
            .on("end", () => resolve(outputPath))
            .on("error", (err) => reject(err));
    });
}

function safeDeleteFile(filePath) {
    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
        } catch (err) {
            console.error(`Failed to delete file ${filePath}:`, err);
        }
    }
}

async function downloadVideo(url, outputPath) {
    await execPromise(
        `yt-dlp -f "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best" -o "${outputPath}" "${url}"`,
    );
}

module.exports = {
    TEMP_DIR,
    MAX_SIZE,
    compressVideo,
    safeDeleteFile,
    downloadVideo,
};
