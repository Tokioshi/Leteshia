const {
    Events,
    EmbedBuilder,
    MessageFlags,
    ChannelType,
    PermissionFlagsBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    AttachmentBuilder,
} = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { capital } = require("../../function/index");
const chalk = require("chalk");
const { createCanvas, loadImage, registerFont } = require("canvas");
const path = require("path");

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Command Interaction
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(
                interaction.commandName
            );
            if (!command) {
                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(interaction.client.config.embed.fail)
                            .setDescription(
                                `Unknown command \`${interaction.commandName}\`. It might have been deleted.`
                            ),
                    ],
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(
                    `Error executing command ${interaction.commandName}:`,
                    error
                );

                if (!interaction.replied) {
                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(interaction.client.config.embed.fail)
                                .setDescription(
                                    `There was a problem executing \`${interaction.commandName}\`.`
                                ),
                        ],
                        flags: MessageFlags.Ephemeral,
                    });
                } else if (interaction.deferred) {
                    await interaction.followUp({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(interaction.client.config.embed.fail)
                                .setDescription(
                                    `There was a problem executing \`${interaction.commandName}\`.`
                                ),
                        ],
                        flags: MessageFlags.Ephemeral,
                    });
                }
            }
        }

        // Button Interaction
        if (interaction.isButton()) {
            // Membeli
            if (interaction.customId == "beli") {
                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(interaction.client.config.embed.default)
                            .setTitle("Tiket anda sedang dibuat")
                            .setDescription(
                                "Harap bersabar! Tiket anda sedang diproses dan akan siap dalam beberapa detik..."
                            ),
                    ],
                    flags: MessageFlags.Ephemeral,
                });

                try {
                    await interaction.guild.channels
                        .create({
                            name: `◜beli-${interaction.user.username}◞`,
                            type: ChannelType.GuildText,
                            parent: "1251433453669449800",
                            topic: `Tiket membeli ${interaction.user}`,
                            permissionOverwrites: [
                                {
                                    id: interaction.guild.roles.everyone,
                                    deny: PermissionFlagsBits.ViewChannel,
                                },
                                {
                                    id: interaction.user.id,
                                    allow: PermissionFlagsBits.ViewChannel,
                                },
                                {
                                    id: "1101865823188025354",
                                    allow: PermissionFlagsBits.ViewChannel,
                                },
                                {
                                    id: interaction.client.user.id,
                                    allow: PermissionFlagsBits.ViewChannel,
                                },
                            ],
                        })
                        .then(async (channel) => {
                            await channel.send({
                                embeds: [
                                    new EmbedBuilder()
                                        .setTitle("Tiket Untuk Order Jasa")
                                        .setColor(
                                            interaction.client.config.embed
                                                .default
                                        )
                                        .setDescription(
                                            "```Nama Produk:\nList Perintah:```"
                                        )
                                        .setFooter({
                                            text: "Gunakan format diatas untuk membeli jasa!",
                                            iconURL:
                                                interaction.client.user.displayAvatarURL(
                                                    {
                                                        size: 512,
                                                        extension: "png",
                                                    }
                                                ),
                                        }),
                                ],
                                components: [
                                    new ActionRowBuilder().addComponents(
                                        new ButtonBuilder()
                                            .setCustomId("selesai")
                                            .setLabel("Selesai")
                                            .setEmoji("✅")
                                            .setStyle(ButtonStyle.Success),
                                        new ButtonBuilder()
                                            .setCustomId("tutup")
                                            .setLabel("Tutup")
                                            .setEmoji("🔒")
                                            .setStyle(ButtonStyle.Danger)
                                    ),
                                ],
                            });

                            interaction.editReply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor(
                                            interaction.client.config.embed
                                                .success
                                        )
                                        .setTitle("Tiket anda telah dibuat")
                                        .setDescription(
                                            `Tiket anda berhasil dibuat di ${channel}`
                                        ),
                                ],
                                flags: MessageFlags.Ephemeral,
                            });

                            await db.set(
                                `ticket-owner-${channel.id}`,
                                interaction.user.id
                            );
                        });
                } catch (error) {
                    interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(
                                    interaction.client.config.embed.failed
                                )
                                .setTitle("Tiket anda gagal dibuat")
                                .setDescription(
                                    `Tiket anda gagal dibuat, silahkan hubungi <@1010474132753883207>`
                                ),
                        ],
                        flags: MessageFlags.Ephemeral,
                    });

                    console.error(
                        chalk.redBright("[ERROR]"),
                        chalk.red(
                            `Failed trying to create channel because: `,
                            error
                        )
                    );
                }
            }

            if (interaction.customId == "bertanya") {
                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(interaction.client.config.embed.default)
                            .setTitle("Tiket anda sedang dibuat")
                            .setDescription(
                                "Harap bersabar! Tiket anda sedang diproses dan akan siap dalam beberapa detik..."
                            ),
                    ],
                    flags: MessageFlags.Ephemeral,
                });

                try {
                    await interaction.guild.channels
                        .create({
                            name: `◜bertanya-${interaction.user.username}◞`,
                            type: ChannelType.GuildText,
                            parent: "1251433453669449800",
                            topic: `Tiket bertanya ${interaction.user}`,
                            permissionOverwrites: [
                                {
                                    id: interaction.guild.roles.everyone,
                                    deny: PermissionFlagsBits.ViewChannel,
                                },
                                {
                                    id: interaction.user.id,
                                    allow: PermissionFlagsBits.ViewChannel,
                                },
                                {
                                    id: "1101865823188025354",
                                    allow: PermissionFlagsBits.ViewChannel,
                                },
                                {
                                    id: interaction.client.user.id,
                                    allow: PermissionFlagsBits.ViewChannel,
                                },
                            ],
                        })
                        .then(async (channel) => {
                            await channel.send({
                                embeds: [
                                    new EmbedBuilder()
                                        .setTitle("Tiket Untuk Bertanya")
                                        .setColor(
                                            interaction.client.config.embed
                                                .default
                                        )
                                        .setDescription(
                                            "Silahkan tanya pertanyaan anda disini. Anda diperbolehkan untuk mention <@1010474132753883207> jika diperlukan. Jangan ragu untuk bertanya sebelum membeli!"
                                        )
                                        .setFooter({
                                            text: "Gunakan format diatas untuk membeli jasa!",
                                            iconURL:
                                                interaction.client.user.displayAvatarURL(
                                                    {
                                                        size: 512,
                                                        extension: "png",
                                                    }
                                                ),
                                        }),
                                ],
                                components: [
                                    new ActionRowBuilder().addComponents(
                                        new ButtonBuilder()
                                            .setCustomId("selesai")
                                            .setLabel("Selesai")
                                            .setEmoji("✅")
                                            .setStyle(ButtonStyle.Success),
                                        new ButtonBuilder()
                                            .setCustomId("tutup")
                                            .setLabel("Tutup")
                                            .setEmoji("🔒")
                                            .setStyle(ButtonStyle.Danger)
                                    ),
                                ],
                            });

                            interaction.editReply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor(
                                            interaction.client.config.embed
                                                .success
                                        )
                                        .setTitle("Tiket anda telah dibuat")
                                        .setDescription(
                                            `Tiket anda berhasil dibuat di ${channel}`
                                        ),
                                ],
                                flags: MessageFlags.Ephemeral,
                            });

                            await db.set(
                                `ticket-owner-${channel.id}`,
                                interaction.user.id
                            );
                        });
                } catch (error) {
                    interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(
                                    interaction.client.config.embed.failed
                                )
                                .setTitle("Tiket anda gagal dibuat")
                                .setDescription(
                                    `Tiket anda gagal dibuat, silahkan hubungi <@1010474132753883207>`
                                ),
                        ],
                        flags: MessageFlags.Ephemeral,
                    });

                    console.error(
                        chalk.redBright("[ERROR]"),
                        chalk.red(
                            `Failed trying to create channel because: `,
                            error
                        )
                    );
                }
            }

            if (interaction.customId == "selesai") {
                if (interaction.user.id !== "1010474132753883207") {
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle("Gagal")
                                .setColor(interaction.client.config.embed.fail)
                                .setDescription(
                                    "Button ini hanya bisa diklik oleh manager! Gunakan tombol disebelah jika ingin menghapus manual!"
                                ),
                        ],
                        flags: MessageFlags.Ephemeral,
                    });
                }

                interaction.showModal(
                    new ModalBuilder()
                        .setCustomId("selesai")
                        .setTitle("Selesai Orderan")
                        .addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId("pesan")
                                    .setLabel("Pesan untuk customer")
                                    .setMaxLength(1024)
                                    .setStyle(TextInputStyle.Paragraph)
                            )
                        )
                );
            }

            if (interaction.customId == "tutup") {
                interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("Yakin?")
                            .setColor(interaction.client.config.embed.default)
                            .setDescription(
                                "Yakin ingin menghapus tiket? Klik tombol dibawah untuk konfirmasi."
                            ),
                    ],
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId("yakin")
                                .setEmoji("✅")
                                .setStyle(ButtonStyle.Secondary)
                        ),
                    ],
                });
            }

            if (interaction.customId == "yakin") {
                interaction.channel.delete().then(async (channel) => {
                    const user = await db.get(`ticket-owner-${channel.id}`);

                    interaction.guild.channels.cache
                        .get("1253955907113455700")
                        .send({
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle("Tiket Dihapus")
                                    .setColor(
                                        interaction.client.config.embed.default
                                    )
                                    .setThumbnail(
                                        interaction.user.displayAvatarURL({
                                            extension: "png",
                                            size: 512,
                                        })
                                    )
                                    .setFields(
                                        {
                                            name: "Nama Tiket",
                                            value: `${channel.name}`,
                                            inline: true,
                                        },
                                        {
                                            name: "Pemilik Tiket",
                                            value: `<@${user}>`,
                                            inline: true,
                                        },
                                        {
                                            name: "Ditutup Oleh",
                                            value: `${interaction.user}`,
                                            inline: true,
                                        },
                                        {
                                            name: "Alasan",
                                            value: `Tiket ditutup tanpa alasan`,
                                        }
                                    )
                                    .setFooter({
                                        text: "Ya udah segitu aja",
                                        iconURL:
                                            interaction.client.user.displayAvatarURL(
                                                { extension: "png", size: 512 }
                                            ),
                                    })
                                    .setTimestamp(),
                            ],
                        });

                    try {
                        await interaction.guild.members.cache.get(user).send({
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle("Tiket Anda Dihapus")
                                    .setColor(
                                        interaction.client.config.embed.default
                                    )
                                    .setThumbnail(
                                        interaction.user.displayAvatarURL({
                                            extension: "png",
                                            size: 512,
                                        })
                                    )
                                    .setFields(
                                        {
                                            name: "Nama Tiket",
                                            value: `${channel.name}`,
                                            inline: true,
                                        },
                                        {
                                            name: "Pemilik Tiket",
                                            value: `<@${user}>`,
                                            inline: true,
                                        },
                                        {
                                            name: "Ditutup Oleh",
                                            value: `${interaction.user}`,
                                            inline: true,
                                        },
                                        { name: "Alasan", value: `Dihapus` }
                                    )
                                    .setFooter({
                                        text: "Tiket ditutup tanpa alasan",
                                        iconURL:
                                            interaction.client.user.displayAvatarURL(
                                                { extension: "png", size: 512 }
                                            ),
                                    })
                                    .setTimestamp(),
                            ],
                        });
                    } catch (error) {
                        return;
                    }

                    await db.delete(`ticket-owner-${channel.id}`);
                });
            }

            if (interaction.customId == "verify") {
                if (interaction.member.roles.cache.has("1373289325021761637")) {
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle("Gagal")
                                .setColor(interaction.client.config.embed.fail)
                                .setDescription("Kamu sudah terverifikasi!"),
                        ],
                        flags: MessageFlags.Ephemeral,
                    });
                }

                interaction.member.roles.add("1373289325021761637").then(() => {
                    interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle("Berhasil Verifikasi!")
                                .setColor("Blue")
                                .setDescription(
                                    "Kamu berhasil mendapatkan role <@&1373289325021761637>!"
                                )
                                .setFooter({
                                    text: "Role akan menghilang dalam 10 detik...",
                                }),
                        ],
                        flags: MessageFlags.Ephemeral,
                    });

                    setTimeout(() => {
                        interaction.member.roles
                            .remove("1373289325021761637")
                            .catch((error) =>
                                console.error(`Failed to remove role: ${error}`)
                            );
                    }, 10000);
                });
            }

            if (interaction.customId == "welcome-button") {
                try {
                    await interaction.deferReply({
                        flags: MessageFlags.Ephemeral,
                    });

                    const user = interaction.user;

                    const canvas = createCanvas(1024, 500);
                    const ctx = canvas.getContext("2d");

                    const avatar = await loadImage(
                        user.displayAvatarURL({ extension: "png", size: 256 })
                    );

                    const centerX = canvas.width / 2;
                    const avatarSize = 200;
                    const avatarX = centerX - avatarSize / 2;
                    const avatarY = 40;
                    registerFont(
                        path.join(
                            __dirname,
                            "../../assets/fonts/Metropolis-Bold.otf"
                        ),
                        {
                            family: "Metropolis",
                        }
                    );

                    ctx.save();
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
                    ctx.drawImage(
                        avatar,
                        avatarX,
                        avatarY,
                        avatarSize,
                        avatarSize
                    );
                    ctx.restore();

                    ctx.beginPath();
                    ctx.arc(
                        centerX,
                        avatarY + avatarSize / 2,
                        avatarSize / 2 + 5,
                        0,
                        Math.PI * 2
                    );
                    ctx.lineWidth = 6;
                    ctx.strokeStyle = "#FFFFFF";
                    ctx.stroke();

                    ctx.fillStyle = "#FFFFFF";
                    ctx.font = "64px Metropolis";
                    ctx.textAlign = "center";
                    ctx.fillText("WELCOME", centerX, 310);

                    ctx.font = "36px Metropolis";
                    ctx.fillText(user.username.toUpperCase(), centerX, 360);

                    ctx.font = "28px Metropolis";
                    ctx.fillText("KAMU ADALAH MEMBER KE-30", centerX, 410);

                    const buffer = canvas.toBuffer("image/png");
                    const attachment = new AttachmentBuilder(buffer, {
                        name: "welcome.png",
                    });

                    await interaction.editReply({
                        files: [attachment],
                    });
                } catch (err) {
                    console.error("Gagal buat welcome card:", err);
                    await interaction.editReply({
                        content: `Selamat datang, ${user}!`,
                    });
                }
            }

            if (interaction.customId == "welcome-text") {
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(
                                `Jayalah Kedatanganmu di ${interaction.guild.name}!`
                            )
                            .setColor(interaction.client.config.embed.success)
                            .setDescription(
                                `Salam, **${interaction.user.username}**! Hamba amat bersukacita karena engkau telah bergabung dengan **balai persaudaraan** kami.`
                            )
                            .addFields(
                                {
                                    name: "✨ Apakah Selanjutnya?",
                                    value: "Silakan tilik <#1251432122741424188> guna membaca **tata tertib** **peseban** kami dan <#1370383470794244157> untuk mulai **bersemuka**!",
                                    inline: false,
                                },
                                {
                                    name: "🚀 Mari Bertemu!",
                                    value: "Janganlah lenggana untuk memperkenalkan diri di **wahana** <#1370682018416820254>!",
                                    inline: false,
                                }
                            )
                            .setThumbnail(
                                interaction.user.displayAvatarURL({
                                    dynamic: true,
                                    size: 256,
                                })
                            )
                            .setFooter({
                                text: `Hamba harap engkau betah bersemayam di sini!`,
                                iconURL:
                                    interaction.client.user.displayAvatarURL({
                                        extension: "png",
                                        size: 512,
                                    }),
                            })
                            .setTimestamp(),
                    ],
                    flags: MessageFlags.Ephemeral,
                });
            }
        }

        if (interaction.isModalSubmit()) {
            if (interaction.customId == "selesai") {
                const pesan = interaction.fields.getTextInputValue("pesan");

                await interaction.reply({
                    content: "Deleting...",
                    flags: MessageFlags.Ephemeral,
                });

                interaction.channel.delete().then(async (channel) => {
                    const user = await db.get(`ticket-owner-${channel.id}`);

                    interaction.guild.channels.cache
                        .get("1253955907113455700")
                        .send({
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle("Tiket Dihapus")
                                    .setColor(
                                        interaction.client.config.embed.default
                                    )
                                    .setThumbnail(
                                        interaction.user.displayAvatarURL({
                                            extension: "png",
                                            size: 512,
                                        })
                                    )
                                    .setFields(
                                        {
                                            name: "Nama Tiket",
                                            value: `${channel.name}`,
                                            inline: true,
                                        },
                                        {
                                            name: "Pemilik Tiket",
                                            value: `<@${user}>`,
                                            inline: true,
                                        },
                                        {
                                            name: "Ditutup Oleh",
                                            value: `${interaction.user}`,
                                            inline: true,
                                        },
                                        { name: "Alasan", value: `${pesan}` }
                                    )
                                    .setFooter({
                                        text: "Ya udah segitu aja",
                                        iconURL:
                                            interaction.client.user.displayAvatarURL(
                                                { extension: "png", size: 512 }
                                            ),
                                    })
                                    .setTimestamp(),
                            ],
                        });

                    try {
                        await interaction.guild.members.cache.get(user).send({
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle("Tiket Anda Dihapus")
                                    .setColor(
                                        interaction.client.config.embed.default
                                    )
                                    .setThumbnail(
                                        interaction.user.displayAvatarURL({
                                            extension: "png",
                                            size: 512,
                                        })
                                    )
                                    .setDescription(
                                        "Jangan lupa kasih feedback di channel <#1251433593616465920> ya!"
                                    )
                                    .setFields(
                                        {
                                            name: "Nama Tiket",
                                            value: `${channel.name}`,
                                            inline: true,
                                        },
                                        {
                                            name: "Pemilik Tiket",
                                            value: `<@${user}>`,
                                            inline: true,
                                        },
                                        {
                                            name: "Ditutup Oleh",
                                            value: `${interaction.user}`,
                                            inline: true,
                                        },
                                        { name: "Alasan", value: `${pesan}` }
                                    )
                                    .setFooter({
                                        text: "Terima kasih telah membeli!",
                                        iconURL:
                                            interaction.client.user.displayAvatarURL(
                                                { extension: "png", size: 512 }
                                            ),
                                    })
                                    .setTimestamp(),
                            ],
                        });
                    } catch (error) {
                        return;
                    }

                    await db.delete(`ticket-owner-${channel.id}`);
                });
            }

            if (interaction.customId == "feedback") {
                const pesan = interaction.fields.getTextInputValue("pesan");
                const bintang = interaction.fields.getTextInputValue("bintang");

                if (isNaN(bintang)) {
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle("Gagal")
                                .setColor(interaction.client.config.embed.fail)
                                .setDescription(
                                    "Harap masukkan angka di field bintang antar 1 - 5!"
                                ),
                        ],
                        flags: MessageFlags.Ephemeral,
                    });
                }

                const bintangNumber = Number(bintang);
                if (bintangNumber >= 1 && bintangNumber <= 5) {
                    const stars = "⭐".repeat(bintangNumber);

                    interaction.guild.channels.cache
                        .get("1251433593616465920")
                        .send({
                            embeds: [
                                new EmbedBuilder()
                                    .setAuthor({
                                        name: `Feedback Dari ${capital(
                                            interaction.user.username
                                        )}`,
                                    })
                                    .setColor(
                                        interaction.client.config.embed.default
                                    )
                                    .setThumbnail(
                                        interaction.user.displayAvatarURL({
                                            extension: "png",
                                            size: 512,
                                        })
                                    )
                                    .setFields(
                                        { name: "Pesan", value: `${pesan}` },
                                        { name: "Bintang", value: `${stars}` }
                                    )
                                    .setFooter({
                                        text: "Terima kasih atas feedbacknya!",
                                    })
                                    .setTimestamp(),
                            ],
                        });

                    interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle("Berhasil Mengirim Feedback!")
                                .setColor(
                                    interaction.client.config.embed.success
                                )
                                .setDescription(
                                    `Berhasil merekam dan mengirim feedback mu ke <#1251433593616465920>!`
                                ),
                        ],
                        flags: MessageFlags.Ephemeral,
                    });
                } else {
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle("Gagal")
                                .setColor(interaction.client.config.embed.fail)
                                .setDescription(
                                    "Nomor bintang tidak boleh lebih dari 5!"
                                ),
                        ],
                        flags: MessageFlags.Ephemeral,
                    });
                }
            }
        }
    },
};
