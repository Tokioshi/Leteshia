const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    InteractionContextType,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("manga")
        .setDescription("Mencari manga berdasarkan judul")
        .addStringOption((option) =>
            option
                .setName("judul")
                .setDescription("Judul manga yang ingin dicari")
                .setRequired(true)
                .setMaxLength(100)
        )
        .setContexts(InteractionContextType.Guild),
    async execute(interaction) {
        if (interaction.channel.id !== interaction.client.config.channel.api) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Channel Tidak Diizinkan")
                        .setColor(interaction.client.config.embed.fail)
                        .setDescription(
                            `Maaf, perintah ini hanya dapat digunakan di channel yang ditentukan <#${interaction.client.config.channel.api}>.`
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

        await interaction.deferReply();

        const title = interaction.options.getString("judul");
        const url = `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(
            title
        )}&limit=1`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            const data = await response.json();

            if (data.data.length === 0) {
                const notFoundEmbed = new EmbedBuilder()
                    .setColor(interaction.client.config.embed.fail)
                    .setTitle("Manga Tidak Ditemukan")
                    .setDescription(
                        `Maaf, kami tidak dapat menemukan manga dengan judul "**${title}**".`
                    )
                    .addFields({
                        name: "Saran",
                        value: "Coba periksa kembali ejaan atau gunakan judul yang lebih spesifik.",
                        inline: false,
                    })
                    .setFooter({
                        text: "Pencarian Manga oleh Bot",
                        iconURL: interaction.client.user.avatarURL(),
                    })
                    .setTimestamp();

                return interaction.editReply({ embeds: [notFoundEmbed] });
            }

            const manga = data.data[0];

            const genres =
                manga.genres?.map((genre) => genre.name).join(", ") ||
                "Tidak Diketahui";
            const authors =
                manga.authors?.map((author) => author.name).join(", ") ||
                "Tidak Diketahui";

            const embed = new EmbedBuilder()
                .setColor(interaction.client.config.embed.default)
                .setTitle(`${manga.title}`)
                .setURL(manga.url)
                .setDescription(
                    manga.synopsis
                        ? manga.synopsis.length > 500
                            ? manga.synopsis.substring(0, 500) + "..."
                            : manga.synopsis
                        : "Tidak ada deskripsi singkat."
                )
                .setThumbnail(manga.images.jpg.image_url)
                .setImage(manga.images.jpg.large_image_url)
                .addFields(
                    {
                        name: "📚 Tipe",
                        value: `\`${manga.type || "N/A"}\``,
                        inline: true,
                    },
                    {
                        name: "🎬 Status",
                        value: `\`${manga.status || "N/A"}\``,
                        inline: true,
                    },
                    {
                        name: "⭐️ Rating",
                        value: `\`${manga.score || "N/A"}\` (${
                            manga.scored_by || 0
                        } users)`,
                        inline: true,
                    },
                    {
                        name: "📖 Chapter",
                        value: `\`${
                            manga.chapters ? `${manga.chapters}` : "N/A"
                        }\``,
                        inline: true,
                    },
                    {
                        name: "📚 Volume",
                        value: `\`${
                            manga.volumes ? `${manga.volumes}` : "N/A"
                        }\``,
                        inline: true,
                    },
                    {
                        name: "🗓️ Tanggal Terbit",
                        value: `\`${manga.published.string || "N/A"}\``,
                        inline: true,
                    },
                    {
                        name: "✍️ Penulis",
                        value: `\`${authors}\``,
                        inline: false,
                    },
                    { name: "🎭 Genre", value: `\`${genres}\``, inline: false }
                )
                .setFooter({
                    text: `ID MyAnimeList: ${manga.mal_id}`,
                    iconURL:
                        "https://cdn.discordapp.com/emojis/1375740584714829824.png",
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            const errorEmbed = new EmbedBuilder()
                .setColor(interaction.client.config.embed.fail)
                .setTitle("Terjadi Kesalahan!")
                .setDescription(
                    "Maaf, terjadi kesalahan saat mencoba mencari manga. Silakan coba lagi nanti."
                )
                .addFields({
                    name: "Detail Teknis",
                    value: `\`\`\`${
                        error.message || "Kesalahan tidak diketahui"
                    }\`\`\``,
                })
                .setFooter({
                    text: "Pencarian Manga oleh Bot",
                    iconURL: interaction.client.user.avatarURL(),
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};
