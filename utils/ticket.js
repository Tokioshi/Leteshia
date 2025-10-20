const {
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

async function handleBuyButton(interaction) {
    interaction.showModal(
        new ModalBuilder()
            .setTitle("Form Tiket")
            .setCustomId("buy")
            .addLabelComponents(
                new LabelBuilder()
                    .setLabel("Membaca Syarat dan Ketentuan")
                    .setStringSelectMenuComponent(createSnKSelectMenu()),
                new LabelBuilder()
                    .setLabel("Jasa Yang Mau Dibeli")
                    .setStringSelectMenuComponent(createServiceSelectMenu())
            )
    );
}

async function handleAskButton(interaction) {
    interaction.showModal(
        new ModalBuilder()
            .setTitle("Form Tiket")
            .setCustomId("ask")
            .addLabelComponents(
                new LabelBuilder()
                    .setLabel("Hal Yang Ingin Ditanya")
                    .setStringSelectMenuComponent(createAskSelectMenu())
            )
    );
}

async function handleDoneButton(interaction) {
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

async function handleCloseButton(interaction) {
    interaction.channel.delete().then(async (channel) => {
        await logTicketDeletion(
            interaction,
            channel,
            "Tiket ditutup tanpa alasan"
        );
        await db.delete(`ticket:owner:${channel.id}`);
    });
}

async function handleBuyModal(interaction) {
    await interaction.deferReply({ flags: 64 });
    const condition = interaction.fields.getStringSelectValues("s&k");
    const service = interaction.fields.getStringSelectValues("service");

    if (condition == "Belum") {
        return interaction.editReply({
            content:
                "https://cdn.discordapp.com/attachments/1370383277029982259/1427620977906421790/16840053903298082133.gif",
        });
    }

    await createTicketChannel(interaction, {
        type: "buy",
        condition,
        service,
        name: `◜beli-${interaction.user.username}◞`,
        topic: `Tiket membeli ${interaction.user}`,
        description: `Di bawah ini adalah informasi dari form yang telah anda buat sebelumnya.\n\`\`\`Jasa yang akan dibeli : ${service}\nSudah membaca S&K     : ${condition}\`\`\`Dengan ini, anda dianggap telah membaca Syarat dan Ketentuan Harmony Hub.`,
    });
}

async function handleAskModal(interaction) {
    await interaction.deferReply({ flags: 64 });
    const service = interaction.fields.getStringSelectValues("ask");

    await createTicketChannel(interaction, {
        type: "ask",
        service,
        name: `◜bertanya-${interaction.user.username}◞`,
        topic: `Tiket bertanya ${interaction.user}`,
        description: `Silahkan tanya pertanyaan anda disini. Anda diperbolehkan untuk mention <@1010474132753883207> jika diperlukan. Jangan ragu untuk bertanya sebelum membeli!`,
    });
}

async function handleDoneModal(interaction) {
    const pesan = interaction.fields.getTextInputValue("reason");
    await interaction.reply({ content: "Deleting...", flags: 64 });

    interaction.channel.delete().then(async (channel) => {
        await logTicketDeletion(interaction, channel, pesan);
        await db.delete(`ticket:owner:${channel.id}`);
    });
}

function createSnKSelectMenu() {
    return new StringSelectMenuBuilder()
        .setCustomId("s&k")
        .setPlaceholder("Pilih")
        .addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel("Sudah")
                .setValue("Sudah")
                .setDescription("Dengan ini, kamu dianggap telah membaca S&K")
                .setEmoji("✅"),
            new StringSelectMenuOptionBuilder()
                .setLabel("Belum")
                .setValue("Belum")
                .setDescription("Dengan ini, kamu dianggap belum membaca S&K")
                .setEmoji("❌")
        );
}

function createServiceSelectMenu() {
    return new StringSelectMenuBuilder()
        .setCustomId("service")
        .setPlaceholder("Pilih")
        .addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel("Bot")
                .setValue("Bot")
                .setDescription("Pilih ini kalo kamu mau beli jasa bot Discord")
                .setEmoji("🤖"),
            new StringSelectMenuOptionBuilder()
                .setLabel("Server")
                .setValue("Server")
                .setDescription(
                    "Pilih ini kalo kamu mau beli jasa server Discord"
                )
                .setEmoji("🗃️")
        );
}

function createAskSelectMenu() {
    return new StringSelectMenuBuilder()
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
        );
}

async function createTicketChannel(interaction, options) {
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
        const channel = await interaction.guild.channels.create({
            name: options.name,
            type: ChannelType.GuildText,
            parent: interaction.client.config.channel.parent,
            topic: options.topic,
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
        });

        const embed = new EmbedBuilder()
            .setTitle(
                options.type === "buy"
                    ? `Tiket Untuk Order Jasa`
                    : `Tiket Untuk Bertanya Soal ${options.service}`
            )
            .setColor("Orange")
            .setDescription(options.description);

        const message = await channel.send({
            content: `${interaction.user}`,
            embeds: [embed],
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
        });
        await message.pin();

        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor("Green")
                    .setTitle("Tiket anda telah dibuat")
                    .setDescription(`Tiket anda berhasil dibuat di ${channel}`),
            ],
        });

        await db.set(`ticket:owner:${channel.id}`, interaction.user.id);
    } catch (error) {
        await interaction.editReply({
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
            chalk.red(`Failed trying to create channel because: `, error)
        );
    }
}

async function logTicketDeletion(interaction, channel, reason) {
    const user = await db.get(`ticket:owner:${channel.id}`);
    const logChannel = interaction.guild.channels.cache.get(
        interaction.client.config.channel.logs
    );

    const embed = new EmbedBuilder()
        .setTitle("Tiket Dihapus")
        .setColor("Orange")
        .setThumbnail(
            interaction.user.displayAvatarURL({ extension: "png", size: 512 })
        )
        .setFields(
            { name: "Nama Tiket", value: `${channel.name}`, inline: true },
            { name: "Pemilik Tiket", value: `<@${user}>`, inline: true },
            {
                name: "Ditutup Oleh",
                value: `${interaction.user}`,
                inline: true,
            },
            { name: "Alasan", value: reason }
        )
        .setFooter({
            text: "Ya udah segitu aja",
            iconURL: interaction.client.user.displayAvatarURL({
                extension: "png",
                size: 512,
            }),
        })
        .setTimestamp();

    await logChannel.send({ embeds: [embed] });
}

module.exports = {
    handleBuyButton,
    handleAskButton,
    handleDoneButton,
    handleCloseButton,
    handleBuyModal,
    handleAskModal,
    handleDoneModal,
};
