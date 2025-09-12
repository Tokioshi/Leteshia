const {
    SlashCommandBuilder,
    AttachmentBuilder,
    InteractionContextType,
    EmbedBuilder,
} = require("discord.js");
const { QuickDB } = require("quick.db");
const { createCanvas, loadImage } = require("canvas");
const { getUserXP, xpForNextLevel } = require("../../function");
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName("levels")
        .setDescription("Lihat 10 besar leaderboard leveling di server ini")
        .setContexts(InteractionContextType.Guild),
    async execute(interaction) {
        await interaction.deferReply();

        const guildId = interaction.guild.id;
        const allData = await db.all();

        const guildData = allData
            .filter((entry) => entry.id.startsWith(`xp_${guildId}_`))
            .map((entry) => {
                const userId = entry.id.split("_")[2];
                return {
                    userId,
                    xp: entry.value,
                    level: getUserXP(userId, guildId).then(
                        (data) => data.level
                    ),
                };
            });

        guildData.sort((a, b) => b.xp - a.xp);
        const top10 = guildData.slice(0, 10);

        const resolvedTop10 = await Promise.all(
            top10.map(async (entry) => {
                const userData = await getUserXP(entry.userId, guildId);
                return {
                    userId: entry.userId,
                    xp: userData.xp,
                    level: userData.level,
                };
            })
        );

        const canvas = createCanvas(680, 745);
        const ctx = canvas.getContext("2d");

        ctx.fillStyle = "#1e1e1e";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = "20px Arial";
        ctx.fillStyle = "#fff";
        ctx.textBaseline = "middle";

        const rowHeight = 70;
        for (let i = 0; i < resolvedTop10.length; i++) {
            const entry = resolvedTop10[i];
            const member = await interaction.guild.members
                .fetch(entry.userId)
                .catch(() => null);

            const username = member ? member.user.username : "Unknown";
            const avatarURL = member
                ? member.user.displayAvatarURL({ extension: "png", size: 64 })
                : null;

            const y = 10 + i * rowHeight;

            ctx.fillStyle =
                i % 2 === 0 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.2)";
            ctx.fillRect(0, y, canvas.width, rowHeight - 5);

            ctx.fillStyle = "#FFD700";
            ctx.font = "bold 22px Arial";
            ctx.fillText(`#${i + 1}`, 10, y + rowHeight / 2);

            if (avatarURL) {
                const avatar = await loadImage(avatarURL);
                ctx.save();
                ctx.beginPath();
                ctx.arc(73, y + rowHeight / 2, 25, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(avatar, 48, y + rowHeight / 2 - 25, 50, 50);
                ctx.restore();
            }

            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 18px Arial";
            ctx.fillText(username, 110, y + rowHeight / 2 - 10);

            ctx.fillStyle = "#aaa";
            ctx.font = "16px Arial";
            ctx.fillText(`LVL: ${entry.level}`, 110, y + rowHeight / 2 + 15);

            const nextXP = xpForNextLevel(entry.level);
            const prevXP = xpForNextLevel(entry.level - 1);
            const progress = entry.xp - prevXP;
            const required = nextXP - prevXP;
            const percent = Math.min(progress / required, 1);

            const barX = 300;
            const barY = y + rowHeight / 2 - 10;
            const barWidth = 300;
            const barHeight = 15;

            ctx.fillStyle = "rgba(255,255,255,0.2)";
            ctx.fillRect(barX, barY, barWidth, barHeight);

            ctx.fillStyle = "#00d2ff";
            ctx.fillRect(barX, barY, barWidth * percent, barHeight);
        }

        const buffer = canvas.toBuffer("image/png");
        const file = new AttachmentBuilder(buffer, { name: "leaderboard.png" });

        const embed = new EmbedBuilder()
            .setTitle(`${interaction.guild.name}'s XP Leaderboard`)
            .setColor(interaction.client.config.embed.default)
            .setImage(`attachment://${file.name}`);

        await interaction.editReply({ embeds: [embed], files: [file] });
    },
};
