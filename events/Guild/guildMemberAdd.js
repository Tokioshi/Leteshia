const { Events, AttachmentBuilder, EmbedBuilder } = require("discord.js");
const { createCanvas, loadImage, registerFont } = require("canvas");
const path = require("path");

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        if (member.guild.id == member.client.config.guildId) {
            const guild = member.guild;
            const newInvites = await guild.invites.fetch();
            const oldInvites = member.client.inviteCache.get(guild.id);

            let usedInvite = null;
            newInvites.forEach((invite) => {
                const oldUses = oldInvites.get(invite.code);
                if (invite.uses > oldUses) {
                    usedInvite = invite;
                }
            });

            member.client.inviteCache.set(
                guild.id,
                new Map(newInvites.map((inv) => [inv.code, inv.uses]))
            );

            if (usedInvite) {
                const inviter = usedInvite.inviter;
                member.client.channels.cache
                    .get(member.client.config.channel.invite)
                    .send({
                        embeds: [
                            new EmbedBuilder()
                            .setTitle('New Invite Detected')
                            .setColor(member.client.config.embed.default)
                            .setDescription(`${member.user} joined the server using invite \`${usedInvite.code}\` by ${inviter}`)
                            .setFooter({ text: `${member.guild.name}` })
                            .setTimestamp()
                        ]
                    });
            } else {
                member.client.channels.cache
                    .get(member.client.config.channel.invite)
                    .send({
                        embeds: [
                            new EmbedBuilder()
                            .setTitle('New Invite Detected')
                            .setColor(member.client.config.embed.default)
                            .setDescription(`${member.user} joined the server, but I could't know who invited them.`)
                            .setFooter({ text: `${member.guild.name}` })
                            .setTimestamp()
                        ]
                    });
            }

            try {
                const user = member.user;
                const canvas = createCanvas(735, 413);
                const ctx = canvas.getContext("2d");

                const background = await loadImage(
                    path.join(
                        __dirname,
                        "../../assets/images/welcome-background.jpg"
                    )
                );

                const avatar = await loadImage(
                    user.displayAvatarURL({ extension: "png", size: 256 })
                );

                registerFont(
                    path.join(
                        __dirname,
                        "../../assets/fonts/Metropolis-Bold.otf"
                    ),
                    { family: "Metropolis" }
                );

                ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

                ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                const gradient = ctx.createLinearGradient(
                    0,
                    0,
                    0,
                    canvas.height
                );
                gradient.addColorStop(0, "rgba(74, 144, 226, 0.3)");
                gradient.addColorStop(1, "rgba(80, 227, 194, 0.3)");
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                const centerX = canvas.width / 2;
                const avatarSize = 120;
                const avatarX = centerX - avatarSize / 2;
                const avatarY = 60;

                ctx.save();
                ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
                ctx.shadowBlur = 20;
                ctx.shadowOffsetY = 10;

                ctx.beginPath();
                ctx.arc(
                    centerX,
                    avatarY + avatarSize / 2,
                    avatarSize / 2,
                    0,
                    Math.PI * 2,
                    true
                );
                ctx.closePath();
                ctx.clip();

                ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
                ctx.restore();

                const borderGradient = ctx.createLinearGradient(
                    centerX - avatarSize / 2,
                    avatarY,
                    centerX + avatarSize / 2,
                    avatarY + avatarSize
                );
                borderGradient.addColorStop(0, "#4A90E2");
                borderGradient.addColorStop(0.5, "#50E3C2");
                borderGradient.addColorStop(1, "#4A90E2");

                ctx.beginPath();
                ctx.arc(
                    centerX,
                    avatarY + avatarSize / 2,
                    avatarSize / 2 + 4,
                    0,
                    Math.PI * 2
                );
                ctx.lineWidth = 8;
                ctx.strokeStyle = borderGradient;
                ctx.stroke();

                function drawTextWithShadow(
                    text,
                    x,
                    y,
                    fontSize,
                    fontFamily = "Metropolis"
                ) {
                    ctx.font = `${fontSize}px ${fontFamily}`;
                    ctx.textAlign = "center";

                    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
                    ctx.fillText(text, x + 2, y + 2);

                    const textGradient = ctx.createLinearGradient(
                        x - 200,
                        y - 20,
                        x + 200,
                        y + 20
                    );
                    textGradient.addColorStop(0, "#FFFFFF");
                    textGradient.addColorStop(0.5, "#F0F8FF");
                    textGradient.addColorStop(1, "#E6E6FA");

                    ctx.fillStyle = textGradient;
                    ctx.fillText(text, x, y);
                }

                drawTextWithShadow("WELCOME", centerX, 250, 48);

                const lineY = 265;
                const lineGradient = ctx.createLinearGradient(
                    centerX - 100,
                    lineY,
                    centerX + 100,
                    lineY
                );
                lineGradient.addColorStop(0, "rgba(74, 144, 226, 0)");
                lineGradient.addColorStop(0.5, "#4A90E2");
                lineGradient.addColorStop(1, "rgba(74, 144, 226, 0)");

                ctx.strokeStyle = lineGradient;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(centerX - 100, lineY);
                ctx.lineTo(centerX + 100, lineY);
                ctx.stroke();

                drawTextWithShadow(
                    user.username.toUpperCase(),
                    centerX,
                    295,
                    28
                );

                drawTextWithShadow(
                    `KAMU ADALAH MEMBER KE-${member.guild.memberCount}`,
                    centerX,
                    330,
                    20
                );

                const badgeY = 365;
                const badgeWidth = 200;
                const badgeHeight = 30;
                const badgeX = centerX - badgeWidth / 2;

                ctx.fillStyle = "rgba(74, 144, 226, 0.8)";
                ctx.beginPath();
                ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 15);
                ctx.fill();

                ctx.strokeStyle = "#FFFFFF";
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.fillStyle = "#FFFFFF";
                ctx.font = "14px Metropolis";
                ctx.textAlign = "center";
                ctx.fillText("SELAMAT BERGABUNG!", centerX, badgeY + 20);

                function drawSparkle(x, y, size) {
                    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, Math.PI * 2);
                    ctx.fill();
                }

                function generateRandomSparkles() {
                    const sparkleCount = 15 + Math.floor(Math.random() * 10);

                    for (let i = 0; i < sparkleCount; i++) {
                        const x = 30 + Math.random() * (canvas.width - 60);
                        const y = 30 + Math.random() * (canvas.height - 60);

                        const size = 0.5 + Math.random() * 2;

                        const opacity = 0.4 + Math.random() * 0.6;

                        const distanceFromAvatar = Math.sqrt(
                            Math.pow(x - centerX, 2) +
                                Math.pow(y - (avatarY + avatarSize / 2), 2)
                        );

                        if (distanceFromAvatar > avatarSize / 2 + 20) {
                            drawSparkle(x, y, size, opacity);
                        }
                    }
                }

                generateRandomSparkles();

                const buffer = canvas.toBuffer("image/png");
                const attachment = new AttachmentBuilder(buffer, {
                    name: "welcome.png",
                });

                member.client.channels.cache
                    .get(member.client.config.channel.welcome)
                    .send({
                        files: [attachment],
                    });
            } catch (err) {
                console.error("Gagal buat welcome card: ", err);
            }
        }
    },
};
