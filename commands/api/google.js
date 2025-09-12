const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    InteractionContextType,
} = require("discord.js");
const axios = require("axios");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("google")
        .setDescription("Mencari sesuatu di Google")
        .addStringOption((option) =>
            option
                .setName("query")
                .setDescription("Apa yang ingin Anda cari?")
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

        const GOOGLE_API_KEY = interaction.client.config.api.googleToken;
        const GOOGLE_CSE_ID = interaction.client.config.api.googleCSEId;

        const query = interaction.options.getString("query");

        if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
            return interaction.reply({
                content:
                    "🚫 Konfigurasi API Google belum lengkap. Hubungi administrator bot.",
                flags: MessageFlags.Ephemeral,
            });
        }

        await interaction.deferReply();

        try {
            const apiUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CSE_ID}&q=${encodeURIComponent(
                query
            )}&num=3`; // num=3 untuk 3 hasil teratas

            const response = await axios.get(apiUrl);
            const data = response.data;

            if (!data.items || data.items.length === 0) {
                const noResultsEmbed = new EmbedBuilder()
                    .setColor(0xffd700)
                    .setTitle("Hasil Pencarian Tidak Ditemukan")
                    .setDescription(
                        `Tidak ada hasil yang ditemukan untuk pencarian: **${query}**`
                    )
                    .setFooter({
                        text: "Google Search",
                        iconURL: interaction.client.user.displayAvatarURL(),
                    })
                    .setTimestamp();
                return interaction.editReply({ embeds: [noResultsEmbed] });
            }

            const searchResultsEmbed = new EmbedBuilder()
                .setColor("#f9ba05")
                .setTitle(`Hasil Pencarian Google untuk: "${query}"`)
                .setDescription(
                    "Berikut adalah beberapa hasil teratas dari Google:"
                )
                .setFooter({
                    text: "Google Search",
                    iconURL:
                        "https://cdn.discordapp.com/emojis/1375436201443594261.png",
                })
                .setTimestamp();

            data.items.forEach((item, index) => {
                searchResultsEmbed.addFields({
                    name: `${index + 1}. ${item.title}`,
                    value: `[Link Website](${item.link})\n${item.snippet}`,
                    inline: false,
                });
            });

            await interaction.editReply({ embeds: [searchResultsEmbed] });
        } catch (error) {
            console.error(
                "Error fetching Google search results:",
                error.response?.data || error.message
            );
            const errorEmbed = new EmbedBuilder()
                .setColor(interaction.client.config.embed.fail)
                .setTitle("Gagal Melakukan Pencarian Google")
                .setDescription(
                    "Terjadi kesalahan saat mencoba mencari di Google. Pastikan API key dan CSE ID sudah benar."
                )
                .addFields({
                    name: "Detail Error",
                    value: `\`\`\`${
                        error.response?.data?.error?.message ||
                        error.message ||
                        "Unknown error"
                    }\`\`\``,
                })
                .setFooter({
                    text: "Google Search",
                    iconURL: interaction.client.user.displayAvatarURL(),
                })
                .setTimestamp();
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};
