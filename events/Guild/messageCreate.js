const { Events, EmbedBuilder, MessageFlags } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { calculateLevel, xpForNextLevel } = require("../../function");
const cooldowns = new Map();

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.guild.id === message.client.config.guildId) {
            if (message.author.bot) return;

            if (message.channel.id == "1372955608445096057") {
                if (message.content.toLowerCase() !== "!verifikasi") {
                    message.delete();

                    return message.channel
                        .send({
                            content: `${message.author}, Silahkan gunakan perintah **!verifikasi** untuk mendapatkan role verifikasi lewat pesan!`,
                        })
                        .then((msg) => {
                            setTimeout(() => {
                                msg.delete().catch((error) =>
                                    console.error(
                                        `Failed to delete message: ${error}`
                                    )
                                );
                            }, 7000);
                        });
                }

                if (message.member.roles.cache.has("1373289445863985314")) {
                    message.delete();

                    return message.channel
                        .send({
                            content: `${message.author}`,
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle("Gagal")
                                    .setColor("#c92424")
                                    .setDescription(
                                        "Kamu sudah terverifikasi!"
                                    ),
                            ],
                            flags: MessageFlags.Ephemeral,
                        })
                        .then((msg) => {
                            setTimeout(() => {
                                msg.delete().catch((error) =>
                                    console.error(
                                        `Failed to delete message: ${error}`
                                    )
                                );
                            }, 7000);
                        });
                }

                await message.member.roles
                    .add("1373289445863985314")
                    .then(() => {
                        message.delete();

                        return message.channel
                            .send({
                                content: `${message.author}`,
                                embeds: [
                                    new EmbedBuilder()
                                        .setTitle("Berhasil Verifikasi!")
                                        .setColor("#FFDAB9")
                                        .setDescription(
                                            "Kamu berhasil mendapatkan role <@&1373289445863985314>!"
                                        )
                                        .setFooter({
                                            text: "Role akan menghilang dalam 10 detik...",
                                        }),
                                ],
                                flags: MessageFlags.Ephemeral,
                            })
                            .then((msg) => {
                                setTimeout(() => {
                                    msg.delete().catch((error) =>
                                        console.error(
                                            `Failed to delete message: ${error}`
                                        )
                                    );
                                }, 7000);
                            });
                    });

                setTimeout(() => {
                    message.member.roles
                        .remove("1373289445863985314")
                        .catch((error) =>
                            console.error(`Failed to remove role: ${error}`)
                        );
                }, 10000);
            }

            if (message.channel.id == "1373588125368193044") {
                const filter = (await db.get("filter_")) || [];
                const filteredWord = Array.isArray(filter)
                    ? filter.find((word) =>
                          message.content.toLowerCase().includes(word)
                      )
                    : null;

                if (
                    Array.isArray(filter) &&
                    filter.some((word) =>
                        message.content.toLowerCase().includes(word)
                    )
                ) {
                    try {
                        await message.delete();
                        const msg = await message.channel.send({
                            content: `${message.author}`,
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle("Peringatan Filter Kata")
                                    .setColor(0xffd700)
                                    .setDescription(
                                        "Kata yang Anda gunakan terdeteksi sebagai kata yang difilter. Harap perhatikan penggunaan kata."
                                    )
                                    .setThumbnail(
                                        "https://cdn.discordapp.com/emojis/1373641866385293342.png"
                                    )
                                    .addFields(
                                        {
                                            name: "Kata Terfilter",
                                            value: `\`${filteredWord}\``,
                                            inline: true,
                                        },
                                        {
                                            name: "Merasa Salah?",
                                            value: "Hubungi admin untuk klarifikasi.",
                                            inline: true,
                                        }
                                    )
                                    .setFooter({
                                        text: `Sistem Filter Kata`,
                                        iconURL: message.guild.iconURL(),
                                    })
                                    .setTimestamp(),
                            ],
                        });

                        setTimeout(() => {
                            msg.delete().catch((error) =>
                                console.error(
                                    `Failed to delete message: ${error}`
                                )
                            );
                        }, 5000);
                    } catch (error) {
                        console.error(`Error handling filtered word: ${error}`);
                    }
                }
            }

            // Leveling
            const COOLDOWN_TIME = 30 * 1000;

            const userId = message.author.id;
            const guildId = message.guild.id;
            const key = `${guildId}_${userId}`;

            const now = Date.now();
            if (
                cooldowns.has(key) &&
                now - cooldowns.get(key) < COOLDOWN_TIME
            ) {
                return;
            }
            cooldowns.set(key, now);

            let userXP = (await db.get(`xp_${key}`)) || 0;
            let userLevel = calculateLevel(userXP);

            const xpToAdd = Math.floor(Math.random() * 11) + 15;
            userXP += xpToAdd;
            await db.set(`xp_${key}`, userXP);

            const newLevel = calculateLevel(userXP);

            if (newLevel > userLevel) {
                const embed = new EmbedBuilder()
                    .setColor("Random")
                    .setTitle("🎉 Level Up!")
                    .setDescription(
                        `${message.author} telah naik ke **Level ${newLevel}**!`
                    )
                    .addFields(
                        { name: "Total XP", value: `${userXP}`, inline: true },
                        {
                            name: "Next Level",
                            value: `${
                                xpForNextLevel(newLevel) - userXP
                            } XP lagi`,
                            inline: true,
                        }
                    )
                    .setThumbnail(
                        message.author.displayAvatarURL({ forceStatic: true })
                    )
                    .setTimestamp();

                message.channel.send({ embeds: [embed] });
            }
        }
    },
};
