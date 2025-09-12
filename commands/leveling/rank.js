const {
    SlashCommandBuilder,
    AttachmentBuilder,
    InteractionContextType,
} = require("discord.js");
const { getUserXP } = require("../../function");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("rank")
        .setDescription("See your current leveling rank system")
        .setContexts(InteractionContextType.Guild),
    async execute(interaction) {
        await interaction.deferReply();

        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        const userData = await getUserXP(userId, guildId);
        const {
            xp: userXP,
            level: userLevel,
            xpForNext: nextLevelXP,
            xpUntilNext,
        } = userData;

        const canvas = createCanvas(800, 250);
        const ctx = canvas.getContext("2d");

        const gradient = ctx.createLinearGradient(
            0,
            0,
            canvas.width,
            canvas.height
        );
        gradient.addColorStop(0, "#667eea");
        gradient.addColorStop(1, "#764ba2");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
        for (let x = 0; x < canvas.width; x += 40) {
            for (let y = 0; y < canvas.height; y += 40) {
                ctx.fillRect(x, y, 2, 2);
            }
        }

        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 5;
        this.roundedRect(
            ctx,
            20,
            20,
            canvas.width - 40,
            canvas.height - 40,
            15
        );
        ctx.fill();

        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        const avatarX = 50;
        const avatarY = 50;
        const avatarSize = 120;
        const avatarRadius = avatarSize / 2;

        const avatarGlow = ctx.createRadialGradient(
            avatarX + avatarRadius,
            avatarY + avatarRadius,
            avatarRadius - 10,
            avatarX + avatarRadius,
            avatarY + avatarRadius,
            avatarRadius + 20
        );
        avatarGlow.addColorStop(0, "rgba(255, 255, 255, 0.3)");
        avatarGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = avatarGlow;
        ctx.beginPath();
        ctx.arc(
            avatarX + avatarRadius,
            avatarY + avatarRadius,
            avatarRadius + 15,
            0,
            Math.PI * 2
        );
        ctx.fill();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(
            avatarX + avatarRadius,
            avatarY + avatarRadius,
            avatarRadius + 2,
            0,
            Math.PI * 2
        );
        ctx.stroke();

        const avatar = await loadImage(
            interaction.user.displayAvatarURL({ extension: "png", size: 512 })
        );
        ctx.save();
        ctx.beginPath();
        ctx.arc(
            avatarX + avatarRadius,
            avatarY + avatarRadius,
            avatarRadius,
            0,
            Math.PI * 2
        );
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();

        const textStartX = 200;
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.font = "bold 32px Arial";
        ctx.fillText(interaction.user.username, textStartX + 2, 72);

        ctx.fillStyle = "#ffffff";
        ctx.fillText(interaction.user.username, textStartX, 70);

        const levelBadgeX = textStartX;
        const levelBadgeY = 85;
        const levelBadgeWidth = 100;
        const levelBadgeHeight = 30;

        const levelGradient = ctx.createLinearGradient(
            levelBadgeX,
            levelBadgeY,
            levelBadgeX + levelBadgeWidth,
            levelBadgeY + levelBadgeHeight
        );
        levelGradient.addColorStop(0, "#ff6b6b");
        levelGradient.addColorStop(1, "#ee5a24");

        ctx.fillStyle = levelGradient;
        this.roundedRect(
            ctx,
            levelBadgeX,
            levelBadgeY,
            levelBadgeWidth,
            levelBadgeHeight,
            15
        );
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
            `LEVEL ${userLevel}`,
            levelBadgeX + levelBadgeWidth / 2,
            levelBadgeY + 20
        );
        ctx.textAlign = "left";

        const prevLevelXP = userLevel > 0 ? Math.pow(userLevel, 2) * 100 : 0;
        const progress = userXP - prevLevelXP;
        const required = nextLevelXP - prevLevelXP;

        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.font = "18px Arial";
        ctx.fillText(
            `${progress.toLocaleString()} / ${required.toLocaleString()} XP`,
            textStartX,
            140
        );

        const progressBarX = textStartX;
        const progressBarY = 155;
        const progressBarWidth = 520;
        const progressBarHeight = 25;

        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        this.roundedRect(
            ctx,
            progressBarX,
            progressBarY,
            progressBarWidth,
            progressBarHeight,
            12
        );
        ctx.fill();

        const progressPercentage = Math.min(progress / required, 1);
        const progressGradient = ctx.createLinearGradient(
            progressBarX,
            progressBarY,
            progressBarX + progressBarWidth,
            progressBarY + progressBarHeight
        );
        progressGradient.addColorStop(0, "#00d2ff");
        progressGradient.addColorStop(1, "#3a7bd5");

        ctx.fillStyle = progressGradient;
        this.roundedRect(
            ctx,
            progressBarX,
            progressBarY,
            progressBarWidth * progressPercentage,
            progressBarHeight,
            12
        );
        ctx.fill();

        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        this.roundedRect(
            ctx,
            progressBarX,
            progressBarY,
            progressBarWidth * progressPercentage,
            progressBarHeight / 2,
            12
        );
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        const percentageText = `${Math.round(progressPercentage * 100)}%`;
        ctx.fillText(
            percentageText,
            progressBarX + (progressBarWidth * progressPercentage) / 2,
            progressBarY + 18
        );
        ctx.textAlign = "left";

        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.font = "16px Arial";
        ctx.textAlign = "right";
        ctx.fillText(
            "Total XP: " + userXP.toLocaleString(),
            canvas.width - 30,
            60
        );
        ctx.textAlign = "left";

        const buffer = canvas.toBuffer("image/png");
        const file = new AttachmentBuilder(buffer, { name: "rankcard.png" });

        await interaction.editReply({ files: [file] });
    },

    roundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(
            x + width,
            y + height,
            x + width - radius,
            y + height
        );
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    },
};
