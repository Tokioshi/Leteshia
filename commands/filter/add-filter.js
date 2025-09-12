const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    InteractionContextType,
} = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName("add-filter")
        .setDescription("Menambahkan kata baru ke dalam filter kata")
        .addStringOption((option) =>
            option
                .setName("kata")
                .setDescription("Kata yang ingin ditambahkan ke dalam filter")
                .setRequired(true)
                .setMinLength(1)
                .setMaxLength(100)
        )
        .setContexts(InteractionContextType.Guild),
    async execute(interaction) {
        if (
            interaction.channel.id !== interaction.client.config.channel.filter
        ) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Channel Tidak Diizinkan")
                        .setColor(interaction.client.config.embed.fail)
                        .setDescription(
                            `Maaf, perintah ini hanya dapat digunakan di channel yang ditentukan <#${interaction.client.config.channel.filter}>.`
                        )
                        .setFooter({
                            text: "Perintah Terbatas",
                            iconURL: interaction.client.user.avatarURL(),
                        })
                        .setTimestamp(),
                ],
                flags: MessageFlags.Ephemeral,
            });
        }

        const word = interaction.options.getString("kata");

        let filter = (await db.get("filter_")) || [];
        if (filter.includes(word)) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Gagal Menambahkan Kata")
                        .setColor(
                            interaction.client.config.embed.fail || 0xff0000
                        )
                        .setDescription(
                            `Kata \`${word}\` sudah ada dalam daftar filter. Kata ini tidak dapat ditambahkan lagi.`
                        )
                        .addFields({
                            name: "Saran",
                            value: "Periksa kembali daftar filter atau gunakan perintah untuk menghapus kata jika perlu.",
                            inline: false,
                        })
                        .setThumbnail(
                            "https://cdn.discordapp.com/emojis/1373613591625732198.png"
                        )
                        .setFooter({
                            text: `Filter Kata | ${interaction.guild.name}`,
                            iconURL: interaction.client.user.avatarURL(),
                        }),
                ],
                flags: MessageFlags.Ephemeral,
            });
        }

        await db.push("filter_", word);
        await db.set("filter_last_updated", Date.now());

        interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle("Kata Berhasil Ditambahkan!")
                    .setColor(interaction.client.config.embed.success)
                    .setDescription(
                        `Kata \`${word}\` telah ditambahkan ke dalam filter oleh ${interaction.user.tag}!`
                    )
                    .addFields(
                        {
                            name: "Ditambahkan Pada",
                            value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
                            inline: true,
                        },
                        {
                            name: "Perintah",
                            value: "</add-filter:1373604425473724437>",
                            inline: true,
                        }
                    )
                    .setThumbnail(
                        "https://cdn.discordapp.com/emojis/1373613556217679973.png"
                    )
                    .setFooter({
                        text: `Filter Kata | ${interaction.guild.name}`,
                        iconURL: interaction.client.user.avatarURL(),
                    }),
            ],
        });
    },
};
