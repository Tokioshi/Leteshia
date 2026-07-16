const fs = require("fs");
const path = require("path");
const util = require("util");
const { execFile } = require("child_process");
const ffmpeg = require("fluent-ffmpeg");

const execFilePromise = util.promisify(execFile);

const BIN_DIR = path.join(__dirname, "../.bin");
const YTDLP_PATH = path.join(BIN_DIR, "yt-dlp");
const DENO_PATH = path.join(BIN_DIR, "deno");

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

async function compressVideo(inputPath, outputPath, targetSizeBytes = MAX_SIZE) {
    const duration = await getVideoDuration(inputPath);
    if (!duration || duration <= 0) {
        throw new Error("Could not determine video duration.");
    }

    const totalBitrateKbps = Math.floor(((targetSizeBytes * 8) / duration / 1000) * SAFETY_MARGIN);
    const videoBitrateKbps = Math.max(totalBitrateKbps - AUDIO_BITRATE_KBPS, 150);

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

function getCookiesPathForUrl(url) {
    const platformMap = [
        { pattern: /instagram\.com|instagr\.am/i, file: "cookies-instagram.txt" },
        { pattern: /tiktok\.com/i, file: "cookies-tiktok.txt" },
        { pattern: /youtube\.com|youtu\.be/i, file: "cookies-youtube.txt" },
    ];

    const match = platformMap.find((p) => p.pattern.test(url));
    if (!match) return null;

    const cookiesPath = path.join(BIN_DIR, match.file);
    return fs.existsSync(cookiesPath) ? cookiesPath : null;
}

async function downloadVideo(url, outputPath) {
    try {
        fs.chmodSync(YTDLP_PATH, 0o755);
        if (fs.existsSync(DENO_PATH)) {
            fs.chmodSync(DENO_PATH, 0o755);
        }
    } catch (e) {
        console.warn("Failed to set chmod for binary:", e.message);
    }

    const isYouTube = /youtube\.com|youtu\.be/i.test(url);
    const isTikTok = /tiktok\.com/i.test(url);

    const formatSelector = isYouTube
        ? "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best"
        : "best[height<=1080][ext=mp4]/best";

    const baseArgs = ["-f", formatSelector, "-o", outputPath];

    if (fs.existsSync(DENO_PATH)) {
        baseArgs.push("--js-runtimes", `deno:${DENO_PATH}`, "--remote-components", "ejs:github");
    }

    const cookiesPath = getCookiesPathForUrl(url);

    if (isYouTube) {
        try {
            await execFilePromise(YTDLP_PATH, [...baseArgs, url]);
            return;
        } catch (err) {
            const needsAuth = /sign in|private video|age[- ]restrict/i.test(err.stderr || "");
            if (!needsAuth || !cookiesPath) {
                if (/n challenge solving failed/i.test(err.stderr || "")) {
                    console.log("Trying to clear yt-dlp cache because n-challenge failed...");
                    try {
                        await execFilePromise(YTDLP_PATH, ["--rm-cache-dir"]);
                    } catch (_) {}
                }
                throw err;
            }
        }
    }

    const args = [...baseArgs];
    if (cookiesPath) {
        args.push("--cookies", cookiesPath);
    }
    args.push(url);

    try {
        await execFilePromise(YTDLP_PATH, args);
    } catch (err) {
        if (/Sign in to confirm|Unable to extract universal data/i.test(err.stderr || "")) {
            if (isTikTok) {
                throw new Error(
                    "Failed to extract TikTok data. Please ensure yt-dlp is up to date and your TikTok cookies are still active.",
                );
            }
            throw new Error(
                "This video requires valid platform cookies, but they are not yet available or have expired.",
            );
        }
        throw err;
    }
}

module.exports = {
    TEMP_DIR,
    MAX_SIZE,
    compressVideo,
    safeDeleteFile,
    downloadVideo,
};
