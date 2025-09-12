const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    InteractionContextType,
} = require("discord.js");
const axios = require("axios");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("film")
        .setDescription("Mencari informasi film atau serial dari IMDb")
        .addStringOption((option) =>
            option
                .setName("query")
                .setDescription("Judul film atau serial yang ingin dicari")
                .setRequired(true)
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

        const query = interaction.options.getString("query");
        const apiUrl = `https://api.popcat.xyz/v2/imdb?q=${encodeURIComponent(
            query
        )}`;

        try {
            const response = await axios.get(apiUrl);
            const data = response.data.message;

            if (response.data.error) {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(interaction.client.config.embed.fail)
                            .setTitle("Film Tidak Ditemukan")
                            .setDescription(
                                `Maaf, kami tidak dapat menemukan film dengan judul "**${query}**".`
                            )
                            .addFields({
                                name: "Saran",
                                value: "Coba periksa kembali ejaan atau gunakan judul yang lebih spesifik.",
                                inline: false,
                            })
                            .setFooter({
                                text: "Pencarian Film oleh Bot",
                                iconURL: interaction.client.user.avatarURL(),
                            })
                            .setTimestamp(),
                    ],
                });
            }

            const embed = new EmbedBuilder()
                .setTitle(data.title ?? "Judul Tidak Tersedia")
                .setURL(data.imdburl ?? "https://www.imdb.com/")
                .setDescription(data.plot ?? "Sinopsis tidak tersedia.")
                .setColor(interaction.client.config.embed.default)
                .setThumbnail(data.poster ?? null)
                .setTimestamp();

            embed.addFields(
                {
                    name: "Tahun Rilis",
                    value: String(data.year ?? "N/A"),
                    inline: true,
                },
                {
                    name: "Rating Penonton",
                    value: data.rated ?? "N/A",
                    inline: true,
                },
                { name: "Durasi", value: data.runtime ?? "N/A", inline: true },
                { name: "Genre", value: data.genres ?? "N/A", inline: true },
                {
                    name: "Sutradara",
                    value: data.director ?? "N/A",
                    inline: true,
                },
                {
                    name: "Aktor Utama",
                    value: data.actors ?? "N/A",
                    inline: true,
                },
                {
                    name: "Bahasa",
                    value: data.languages ?? "N/A",
                    inline: true,
                },
                {
                    name: "Penghargaan",
                    value: data.awards ?? "N/A",
                    inline: true,
                },
                {
                    name: "Box Office",
                    value: data.boxoffice ?? "N/A",
                    inline: true,
                }
            );

            const imdbRating = data.rating ? `${data.rating}/10` : "N/A";
            const imdbVotes = data.votes ? `${data.votes} votes` : "";
            embed.setFooter({
                text: `IMDb Rating: ${imdbRating} ${imdbVotes}`.trim(),
                iconURL:
                    "https://cdn.discordapp.com/emojis/1375747987237765170.png",
            });

            if (
                data.ratings &&
                Array.isArray(data.ratings) &&
                data.ratings.length > 0
            ) {
                data.ratings.forEach((rating) => {
                    embed.addFields({
                        name: rating.source ?? "Sumber Rating",
                        value: rating.value ?? "N/A",
                        inline: true,
                    });
                });
            }

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error("Terjadi kesalahan saat mengambil data IMDb:", error);

            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(interaction.client.config.embed.fail)
                        .setTitle("Terjadi Kesalahan!")
                        .setDescription(
                            "Maaf, terjadi kesalahan saat mencoba mencari film. Silakan coba lagi nanti."
                        )
                        .addFields({
                            name: "Detail Teknis",
                            value: `\`\`\`${
                                error.message || "Kesalahan tidak diketahui"
                            }\`\`\``,
                        })
                        .setFooter({
                            text: "Pencarian Film oleh Bot",
                            iconURL: interaction.client.user.avatarURL(),
                        })
                        .setTimestamp(),
                ],
            });
        }
    },
};
