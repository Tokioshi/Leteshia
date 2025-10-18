const {
    Events,
    EmbedBuilder,
    ChannelType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    LabelBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    PermissionFlagsBits,
} = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const chalk = require("chalk");

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(
                interaction.commandName
            );
            if (!command) {
                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("Red")
                            .setDescription(
                                `Unknown command \`${interaction.commandName}\`. It might have been deleted.`
                            ),
                    ],
                    flags: 64,
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
                                .setColor("Red")
                                .setDescription(
                                    `There was a problem executing \`${interaction.commandName}\`.`
                                ),
                        ],
                        flags: 64,
                    });
                } else if (interaction.deferred) {
                    await interaction.followUp({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(
                                    `There was a problem executing \`${interaction.commandName}\`.`
                                ),
                        ],
                        flags: 64,
                    });
                }
            }
        }

        if (interaction.isButton()) {
            if (interaction.customId == "buy") {
                interaction.showModal(
                    new ModalBuilder()
                        .setTitle("Form Tiket")
                        .setCustomId("buy")
                        .addLabelComponents(
                            new LabelBuilder()
                                .setLabel("Membaca Syarat dan Ketentuan")
                                .setStringSelectMenuComponent(
                                    new StringSelectMenuBuilder()
                                        .setCustomId("s&k")
                                        .setPlaceholder("Pilih")
                                        .addOptions(
                                            new StringSelectMenuOptionBuilder()
                                                .setLabel("Sudah")
                                                .setValue("Sudah")
                                                .setDescription(
                                                    "Dengan ini, kamu dianggap telah membaca S&K"
                                                )
                                                .setEmoji("✅"),
                                            new StringSelectMenuOptionBuilder()
                                                .setLabel("Belum")
                                                .setValue("Belum")
                                                .setDescription(
                                                    "Dengan ini, kamu dianggap belum membaca S&K"
                                                )
                                                .setEmoji("❌")
                                        )
                                )
                        )
                        .addLabelComponents(
                            new LabelBuilder()
                                .setLabel("Jasa Yang Mau Dibeli")
                                .setStringSelectMenuComponent(
                                    new StringSelectMenuBuilder()
                                        .setCustomId("service")
                                        .setPlaceholder("Pilih")
                                        .addOptions(
                                            new StringSelectMenuOptionBuilder()
                                                .setLabel("Bot")
                                                .setValue("Bot")
                                                .setDescription(
                                                    "Pilih ini kalo kamu mau beli jasa bot Discord"
                                                )
                                                .setEmoji("🤖"),
                                            new StringSelectMenuOptionBuilder()
                                                .setLabel("Server")
                                                .setValue("Server")
                                                .setDescription(
                                                    "Pilih ini kalo kamu mau beli jasa server Discord"
                                                )
                                                .setEmoji("🗃️")
                                        )
                                )
                        )
                );
            }

            if (interaction.customId == "ask") {
                interaction.showModal(
                    new ModalBuilder()
                        .setTitle("Form Tiket")
                        .setCustomId("ask")
                        .addLabelComponents(
                            new LabelBuilder()
                                .setLabel("Hal Yang Ingin Ditanya")
                                .setStringSelectMenuComponent(
                                    new StringSelectMenuBuilder()
                                        .setCustomId("ask")
                                        .setPlaceholder("Pilih")
                                        .addOptions(
                                            new StringSelectMenuOptionBuilder()
                                                .setLabel("Bot")
                                                .setValue("Bot")
                                                .setDescription(
                                                    "Pilih ini jika ingin bertanya soal Bot Discord"
                                                )
                                                .setEmoji("🤖"),
                                            new StringSelectMenuOptionBuilder()
                                                .setLabel("Server")
                                                .setValue("Server")
                                                .setDescription(
                                                    "Pilih ini jika ingin bertanya soal Server Discord"
                                                )
                                                .setEmoji("🗃️")
                                        )
                                )
                        )
                );
            }

            if (interaction.customId == "done") {
                if (interaction.user.id !== "1010474132753883207") {
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle("Gagal")
                                .setColor("Red")
                                .setDescription(
                                    "Button ini hanya bisa diklik oleh Admin! Gunakan tombol disebelah jika ingin menghapus manual!"
                                ),
                        ],
                        flags: 64,
                    });
                }

                interaction.showModal(
                    new ModalBuilder()
                        .setCustomId("done")
                        .setTitle("Selesai Orderan")
                        .addLabelComponents(
                            new LabelBuilder()
                                .setLabel("Alasan Menutup Tiket")
                                .setTextInputComponent(
                                    new TextInputBuilder()
                                        .setCustomId("reason")
                                        .setStyle(TextInputStyle.Paragraph)
                                )
                        )
                );
            }

            if (interaction.customId == "close") {
                interaction.channel.delete().then(async (channel) => {
                    const user = await db.get(`ticket:owner:${channel.id}`);

                    interaction.guild.channels.cache
                        .get("1425643464351027282")
                        .send({
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle("Tiket Dihapus")
                                    .setColor("Orange")
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
                                                {
                                                    extension: "png",
                                                    size: 512,
                                                }
                                            ),
                                    })
                                    .setTimestamp(),
                            ],
                        });

                    await db.delete(`ticket:owner:${channel.id}`);
                });
            }
        }

        if (interaction.isModalSubmit()) {
            if (interaction.customId == "buy") {
                await interaction.deferReply({ flags: 64 });

                const condition =
                    interaction.fields.getStringSelectValues("s&k");
                const service =
                    interaction.fields.getStringSelectValues("service");

                if (condition == "Belum") {
                    return interaction.editReply({
                        content:
                            "https://cdn.discordapp.com/attachments/1370383277029982259/1427620977906421790/16840053903298082133.gif",
                    });
                }

                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("Orange")
                            .setTitle("Tiket anda sedang dibuat")
                            .setDescription(
                                "Harap bersabar! Tiket anda sedang diproses dan akan siap dalam beberapa detik..."
                            ),
                    ],
                });

                try {
                    await interaction.guild.channels
                        .create({
                            name: `◜beli-${interaction.user.username}◞`,
                            type: ChannelType.GuildText,
                            parent: interaction.client.config.channel.parent,
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
                                    id: interaction.client.user.id,
                                    allow: PermissionFlagsBits.ViewChannel,
                                },
                            ],
                        })
                        .then(async (channel) => {
                            await channel
                                .send({
                                    content: `${interaction.user}`,
                                    embeds: [
                                        new EmbedBuilder()
                                            .setTitle(`Tiket Untuk Order Jasa`)
                                            .setColor("Orange")
                                            .setDescription(
                                                `Di bawah ini adalah informasi dari form yang telah anda buat sebelumnya.\n\`\`\`Jasa yang akan dibeli : ${service}\nSudah membaca S&K     : ${condition}\`\`\`Dengan ini, anda dianggap telah membaca Syarat dan Ketentuan Harmony Hub.`
                                            ),
                                    ],
                                    components: [
                                        new ActionRowBuilder().addComponents(
                                            new ButtonBuilder()
                                                .setCustomId("done")
                                                .setLabel("Selesai")
                                                .setEmoji("✅")
                                                .setStyle(ButtonStyle.Success),
                                            new ButtonBuilder()
                                                .setCustomId("close")
                                                .setLabel("Tutup")
                                                .setEmoji("🔒")
                                                .setStyle(ButtonStyle.Danger)
                                        ),
                                    ],
                                })
                                .then((msg) => {
                                    msg.pin();
                                });

                            interaction.editReply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Green")
                                        .setTitle("Tiket anda telah dibuat")
                                        .setDescription(
                                            `Tiket anda berhasil dibuat di ${channel}`
                                        ),
                                ],
                            });

                            await db.set(
                                `ticket:owner:${channel.id}`,
                                interaction.user.id
                            );
                        });
                } catch (error) {
                    interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("Red")
                                .setTitle("Tiket anda gagal dibuat")
                                .setDescription(
                                    `Tiket anda gagal dibuat, silahkan hubungi <@1010474132753883207>`
                                ),
                        ],
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

            if (interaction.customId == "ask") {
                await interaction.deferReply({ flags: 64 });

                const service = interaction.fields.getStringSelectValues("ask");

                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("Orange")
                            .setTitle("Tiket anda sedang dibuat")
                            .setDescription(
                                "Harap bersabar! Tiket anda sedang diproses dan akan siap dalam beberapa detik..."
                            ),
                    ],
                });

                try {
                    await interaction.guild.channels
                        .create({
                            name: `◜bertanya-${interaction.user.username}◞`,
                            type: ChannelType.GuildText,
                            parent: "1425645832115327108",
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
                                    id: interaction.client.user.id,
                                    allow: PermissionFlagsBits.ViewChannel,
                                },
                            ],
                        })
                        .then(async (channel) => {
                            await channel
                                .send({
                                    content: `${interaction.user}`,
                                    embeds: [
                                        new EmbedBuilder()
                                            .setTitle(
                                                `Tiket Untuk Bertanya Soal ${service}`
                                            )
                                            .setColor("Orange")
                                            .setDescription(
                                                `Silahkan tanya pertanyaan anda disini. Anda diperbolehkan untuk mention <@1010474132753883207> jika diperlukan. Jangan ragu untuk bertanya sebelum membeli!`
                                            ),
                                    ],
                                    components: [
                                        new ActionRowBuilder().addComponents(
                                            new ButtonBuilder()
                                                .setCustomId("done")
                                                .setLabel("Selesai")
                                                .setEmoji("✅")
                                                .setStyle(ButtonStyle.Success),
                                            new ButtonBuilder()
                                                .setCustomId("close")
                                                .setLabel("Tutup")
                                                .setEmoji("🔒")
                                                .setStyle(ButtonStyle.Danger)
                                        ),
                                    ],
                                })
                                .then((msg) => {
                                    msg.pin();
                                });

                            interaction.editReply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Green")
                                        .setTitle("Tiket anda telah dibuat")
                                        .setDescription(
                                            `Tiket anda berhasil dibuat di ${channel}`
                                        ),
                                ],
                            });

                            await db.set(
                                `ticket:owner:${channel.id}`,
                                interaction.user.id
                            );
                        });
                } catch (error) {
                    interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("Red")
                                .setTitle("Tiket anda gagal dibuat")
                                .setDescription(
                                    `Tiket anda gagal dibuat, silahkan hubungi <@1010474132753883207>`
                                ),
                        ],
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

            if (interaction.customId == "done") {
                const pesan = interaction.fields.getTextInputValue("reason");

                await interaction.reply({
                    content: "Deleting...",
                    flags: 64,
                });

                interaction.channel.delete().then(async (channel) => {
                    const user = await db.get(`ticket:owner:${channel.id}`);

                    interaction.guild.channels.cache
                        .get(interaction.client.config.channel.logs)
                        .send({
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle("Tiket Dihapus")
                                    .setColor("Orange")
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
                                                {
                                                    extension: "png",
                                                    size: 512,
                                                }
                                            ),
                                    })
                                    .setTimestamp(),
                            ],
                        });

                    await db.delete(`ticket:owner:${channel.id}`);
                });
            }

            if (interaction.customId == "feedback") {
                const message =
                    interaction.fields.getTextInputValue("feedback_message");
                const star =
                    interaction.fields.getStringSelectValues("feedback_star");

                const starNumber = Number(star);
                if (starNumber >= 1 && starNumber <= 5) {
                    const stars = "⭐".repeat(starNumber);

                    interaction.guild.channels.cache
                        .get(interaction.client.config.channel.feedback)
                        .send({
                            embeds: [
                                new EmbedBuilder()
                                    .setAuthor({
                                        name: `Feedback Dari ${interaction.user.displayName}`,
                                        iconURL:
                                            interaction.user.displayAvatarURL({
                                                size: 512,
                                            }),
                                    })
                                    .setColor("Orange")
                                    .setFields(
                                        {
                                            name: "Pesan",
                                            value: `${message}`,
                                        },
                                        { name: "Bintang", value: `${stars}` }
                                    )
                                    .setFooter({
                                        text: "Terima kasih atas masukan Anda!",
                                    })
                                    .setTimestamp(),
                            ],
                        });

                    interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle("Berhasil")
                                .setColor("Green")
                                .setDescription(
                                    `Feedback Anda telah berhasil direkam dan dikirimkan ke <#${interaction.client.config.channel.feedback}>!`
                                ),
                        ],
                        flags: 64,
                    });
                }
            }
        }
    },
};
