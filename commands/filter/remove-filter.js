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
        .setName("remove-filter")
        .setDescription("Menghapus kata dari filter kata")
        .addStringOption((option) =>
            option
                .setName("kata")
                .setDescription("Kata yang ingin dihapus dari filter")
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
        if (!filter.includes(word)) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Kata Tidak Ditemukan")
                        .setColor(0xffd700)
                        .setDescription(
                            `Kata \`${word}\` tidak ada dalam daftar filter. Pastikan ejaan sudah benar.`
                        )
                        .addFields(
                            {
                                name: "Kemungkinan Penyebab",
                                value: "- Kata sudah dihapus.\n- Ejaan kata salah.",
                                inline: false,
                            },
                            {
                                name: "Perintah yang Terkait",
                                value: "</filter-list:1373606818843983884>",
                                inline: false,
                            }
                        )
                        .setThumbnail(
                            "https://cdn.discordapp.com/emojis/1373641866385293342.png"
                        )
                        .setFooter({
                            text: `Filter Kata | ${interaction.guild.name}`,
                            iconURL: interaction.client.user.avatarURL(),
                        }),
                ],
                flags: MessageFlags.Ephemeral,
            });
        }

        filter = filter.filter((item) => item !== word);

        await db.set("filter_", filter);
        await db.set("filter_last_updated", Date.now());

        interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle("Kata Berhasil Dihapus")
                    .setColor(
                        interaction.client.config.embed.success || 0x00ff00
                    )
                    .setDescription(
                        `Kata \`${word}\` telah berhasil dihapus dari daftar filter.`
                    )
                    .addFields(
                        {
                            name: "Dihapus Oleh",
                            value: `${interaction.user.tag}`,
                            inline: true,
                        },
                        {
                            name: "Waktu Penghapusan",
                            value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
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
