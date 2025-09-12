const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    InteractionContextType,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("anime")
        .setDescription("Mencari anime berdasarkan judul")
        .addStringOption((option) =>
            option
                .setName("judul")
                .setDescription("Judul anime yang ingin dicari")
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
        const url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(
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
                    .setTitle("Anime Tidak Ditemukan")
                    .setDescription(
                        `Maaf, kami tidak dapat menemukan anime dengan judul "**${title}**".`
                    )
                    .addFields({
                        name: "Saran",
                        value: "Coba periksa kembali ejaan atau gunakan judul yang lebih spesifik.",
                        inline: false,
                    })
                    .setFooter({
                        text: "Pencarian Anime oleh Bot",
                        iconURL: interaction.client.user.avatarURL(),
                    })
                    .setTimestamp();

                return interaction.editReply({ embeds: [notFoundEmbed] });
            }

            const anime = data.data[0];

            const genres =
                anime.genres?.map((genre) => genre.name).join(", ") ||
                "Tidak Diketahui";

            const embed = new EmbedBuilder()
                .setColor(interaction.client.config.embed.default)
                .setTitle(`${anime.title}`)
                .setURL(anime.url)
                .setDescription(
                    anime.synopsis
                        ? anime.synopsis.length > 500
                            ? anime.synopsis.substring(0, 500) + "..."
                            : anime.synopsis
                        : "Tidak ada deskripsi singkat."
                )
                .setThumbnail(anime.images.jpg.image_url)
                .setImage(anime.images.jpg.large_image_url)
                .addFields(
                    {
                        name: "📚 Tipe",
                        value: `\`${anime.type || "N/A"}\``,
                        inline: true,
                    },
                    {
                        name: "🎬 Status",
                        value: `\`${anime.status || "N/A"}\``,
                        inline: true,
                    },
                    {
                        name: "⭐️ Rating",
                        value: `\`${anime.score || "N/A"}\` (${
                            anime.scored_by || 0
                        } users)`,
                        inline: true,
                    },
                    {
                        name: "📺 Episode",
                        value: `\`${
                            anime.episodes ? `${anime.episodes}` : "N/A"
                        }\``,
                        inline: true,
                    },
                    {
                        name: "🗓️ Tanggal Rilis",
                        value: `\`${anime.aired.string || "N/A"}\``,
                        inline: true,
                    },
                    { name: "🎭 Genre", value: `\`${genres}\``, inline: true }
                )
                .setFooter({
                    text: `ID MyAnimeList: ${anime.mal_id}`,
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
                    "Maaf, terjadi kesalahan saat mencoba mencari anime. Silakan coba lagi nanti."
                )
                .addFields({
                    name: "Detail Teknis",
                    value: `\`\`\`${
                        error.message || "Kesalahan tidak diketahui"
                    }\`\`\``,
                })
                .setFooter({
                    text: "Pencarian Anime oleh Bot",
                    iconURL: interaction.client.user.avatarURL(),
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};
