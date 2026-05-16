const { Events, AttachmentBuilder, EmbedBuilder, ContainerBuilder } = require("discord.js");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const { isAdmin, sendLong } = require("../../utils/discord");
const { askAI } = require("../../utils/ai");
const {
    buildChannelKnowledge,
    addChannelKnowledge,
    addManualKnowledge,
    getKnowledge,
    clearKnowledge,
    resetHistory,
} = require("../../utils/knowledge");
const {
    TEMP_DIR,
    MAX_SIZE,
    compressVideo,
    safeDeleteFile,
    downloadVideo,
} = require("../../utils/media");

const PREFIX = "!";

const TIKTOK_REGEX =
    /https?:\/\/(?:www\.)?(?:tiktok\.com\/(?:@[\w.-]+\/(?:video|photo)\/\d+|t\/[\w-]+)|(?:vm|vt)\.tiktok\.com\/[\w-]+)\/?(?:[?#]\S*)?/i;

const IG_REGEX = /https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|tv)\/[\w-]+\/?(?:[?#]\S*)?/i;

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot || !message.guild) return;

        if (message.mentions.has(message.client.user)) {
            message.channel.send(`<@${message.author.id}>`);
        }

        if (message.content.startsWith(PREFIX)) {
            const args = message.content.slice(PREFIX.length).trim().split(/ +/);
            const cmd = args.shift().toLowerCase();

            if (cmd === "ai") {
                const input = args.join(" ");
                if (!input)
                    return message.reply({
                        content: "Write something.",
                        allowedMentions: { repliedUser: false },
                    });

                await message.channel.sendTyping();
                try {
                    const res = await askAI(message.guild.id, message.author.id, input);
                    await sendLong(message, res);
                } catch (e) {
                    if (e.message === "ALL_KEYS_RATE_LIMITED") {
                        return message.reply({
                            components: [
                                new ContainerBuilder().addTextDisplayComponents((text) =>
                                    text
                                        .setContent(
                                            "The AI is resting peacefully for a moment. Please wait until she wakes up...",
                                        )
                                        .addSeparatorComponents((s) => s)
                                        .addTextDisplayComponents((text) =>
                                            text.setContent("*Rate limit detected*"),
                                        ),
                                ),
                            ],
                            allowedMentions: { repliedUser: false },
                        });
                    }
                    console.error(e);
                    message.reply("Error.");
                }
                return;
            }

            if (!isAdmin(message.member)) return;

            if (cmd === "knowledge") {
                await message.reply("⏳ Learning...");
                const summary = await buildChannelKnowledge(message.channel);
                if (!summary) return message.reply("No messages.");

                await addChannelKnowledge(message.guild.id, message.channel, summary);
                return message.reply("✅ Done.");
            }

            if (cmd === "knowledge-add") {
                const text = args.join(" ");
                if (!text) return message.reply("Empty.");

                await addManualKnowledge(message.guild.id, text);
                return message.reply("✅ Added.");
            }

            if (cmd === "knowledge-show") {
                const { manual, channel } = await getKnowledge(message.guild.id);

                let out = "";
                if (manual.length) {
                    out += "Manual:\n";
                    manual.forEach((e, i) => (out += `${i + 1}. ${e.text}\n`));
                }
                if (channel.length) {
                    out += "\nChannel:\n";
                    channel.forEach((e) => (out += `#${e.channelName}\n`));
                }
                if (!out) out = "Empty.";

                return sendLong(message, out, true);
            }

            if (cmd === "knowledge-clear") {
                await clearKnowledge(message.guild.id);
                return message.reply("✅ Cleared.");
            }

            if (cmd === "reset") {
                await resetHistory(message.guild.id, message.author.id);
                return message.reply("✅ Reset.");
            }
        }

        const matchedLink = message.content.match(TIKTOK_REGEX) || message.content.match(IG_REGEX);

        if (matchedLink) {
            const url = matchedLink[0];
            const randomName = crypto.randomBytes(8).toString("hex");
            const tempFilePath = path.join(TEMP_DIR, `${randomName}.mp4`);
            const compressedFilePath = path.join(TEMP_DIR, `${randomName}_compressed.mp4`);

            await message.react("⏳");

            try {
                await downloadVideo(url, tempFilePath);

                let finalFilePath = tempFilePath;

                if (fs.statSync(tempFilePath).size > MAX_SIZE) {
                    const loadingMsg = await message.channel.send(
                        "⚠️ File is larger than 10MB. Attempting compression...",
                    );

                    await compressVideo(tempFilePath, compressedFilePath);
                    finalFilePath = compressedFilePath;

                    await loadingMsg.delete().catch(() => {});

                    if (fs.statSync(compressedFilePath).size > MAX_SIZE) {
                        throw new Error("File is still too large after compression.");
                    }
                }

                const msg = await message.channel.send({
                    files: [new AttachmentBuilder(finalFilePath)],
                });

                await message.client.channels.cache
                    .get(message.client.config.channel.linkLog)
                    .send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("Yellow")
                                .setTitle("Video Link Log")
                                .setThumbnail(
                                    `${message.author.displayAvatarURL({ forceStatis: false, size: 1024 })}`,
                                )
                                .addFields(
                                    { name: "Author", value: `${message.author}`, inline: true },
                                    {
                                        name: "Video Link",
                                        value: `[Click Here](${matchedLink})`,
                                        inline: true,
                                    },
                                    {
                                        name: "Go to Video",
                                        value: `[Jump to Message](${msg.url})`,
                                        inline: false,
                                    },
                                )
                                .setTimestamp(),
                        ],
                    });

                if (message.deletable) await message.delete();
            } catch (error) {
                console.error(error);

                message.reactions.cache
                    .get("⏳")
                    ?.remove()
                    .catch(() => {});

                const warningMsg = await message.channel.send(
                    "❌ **Failed to process the video.** It might be private, deleted, or still exceeds the 10MB limit after compression.",
                );

                setTimeout(() => warningMsg.delete().catch(() => {}), 5000);
            } finally {
                safeDeleteFile(tempFilePath);
                safeDeleteFile(compressedFilePath);
            }
        }
    },
};
