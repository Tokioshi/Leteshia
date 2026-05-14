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

function compressVideo(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .videoBitrate("800k")
            .audioBitrate("128k")
            .outputOptions(["-preset fast", "-crf 28"])
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
        `yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" -o "${outputPath}" "${url}"`,
    );
}

module.exports = { TEMP_DIR, MAX_SIZE, compressVideo, safeDeleteFile, downloadVideo };
