const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    InteractionContextType,
} = require("discord.js");
const axios = require("axios");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("shorten")
        .setDescription("Memendekkan URL menggunakan TinyURL")
        .addStringOption((option) =>
            option
                .setName("url")
                .setDescription("URL yang ingin dipendekkan")
                .setRequired(true)
        )
        .addBooleanOption((option) =>
            option
                .setName("private")
                .setDescription(
                    "Tampilkan hasil hanya untuk Anda (default: false)"
                )
                .setRequired(false)
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

        try {
            const longUrl = interaction.options.getString("url");
            const isPrivate =
                interaction.options.getBoolean("private") || false;

            // Validasi URL
            if (!isValidUrl(longUrl)) {
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("URL Tidak Valid")
                            .setColor(interaction.client.config.embed.fail)
                            .setDescription(
                                "URL yang Anda masukkan tidak valid. Pastikan URL dimulai dengan `http://` atau `https://` dan diformat dengan benar."
                            )
                            .addFields({
                                name: "Contoh URL Valid",
                                value: "`https://www.example.com` atau `http://sub.domain.net/path`",
                                inline: false,
                            })
                            .setFooter({
                                text: "URL Shortener Service",
                                iconURL: interaction.client.user.avatarURL(),
                            })
                            .setTimestamp(),
                    ],
                    flags: MessageFlags.Ephemeral,
                });
            }

            await interaction.deferReply({ ephemeral: isPrivate });

            const shortenedUrl = await shortenUrl(longUrl);

            const embed = new EmbedBuilder()
                .setColor("#94b43c")
                .setTitle("URL Anda Telah Dipendekkan!")
                .setDescription(
                    "URL panjang Anda kini menjadi lebih ringkas dan mudah dibagikan."
                )
                .addFields(
                    { name: "🔗 URL Asli", value: `\`${longUrl}\`` },
                    {
                        name: "✨ URL Pendek",
                        value: `[Klik Disini](${shortenedUrl}) \n\`${shortenedUrl}\``,
                    }
                )
                .setFooter({
                    text: `Powered by TinyURL`,
                    iconURL:
                        "https://cdn.discordapp.com/emojis/1375753436381057034.png",
                })
                .setTimestamp();

            await interaction.editReply({
                embeds: [embed],
            });
        } catch (error) {
            console.error(
                "URL shortener error:",
                error.response?.data || error.message || error
            );

            let errorMessage =
                "Terjadi kesalahan tidak terduga saat memendekkan URL.";

            if (error.code === "TINYURL_ERROR") {
                errorMessage = error.message;
            } else if (error.response?.status === 400) {
                errorMessage =
                    "URL yang Anda berikan tidak valid atau ada masalah dengan permintaan TinyURL.";
            } else if (error.response?.status === 500) {
                errorMessage =
                    "Terjadi masalah pada server TinyURL. Mohon coba lagi nanti.";
            } else if (error.response?.status) {
                errorMessage = `Terjadi kesalahan pada layanan pemendek URL. Status: ${error.response.status}.`;
            }

            const errorEmbed = new EmbedBuilder()
                .setColor(interaction.client.config.embed.fail)
                .setTitle("Gagal Memendekkan URL")
                .setDescription(errorMessage)
                .setFooter({
                    text: "URL Shortener Service",
                    iconURL: interaction.client.user.avatarURL(),
                })
                .setTimestamp();

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({
                    embeds: [errorEmbed],
                    flags: MessageFlags.Ephemeral,
                });
            }
        }
    },
};

/**
 * Memendekkan URL menggunakan TinyURL API
 * @param {string} longUrl - URL asli
 * @returns {Promise<string>} URL yang sudah dipendekkan
 */
async function shortenUrl(longUrl) {
    try {
        const tinyurlApiUrl = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(
            longUrl
        )}`;
        const response = await axios.get(tinyurlApiUrl);

        if (
            response.status !== 200 ||
            !response.data ||
            response.data.startsWith("Error")
        ) {
            throw new Error(
                response.data || "Gagal memendekkan URL dengan TinyURL"
            );
        }

        return response.data;
    } catch (error) {
        console.error("Error shortening URL with TinyURL:", error);

        const customError = new Error(
            error.response?.data || error.message || "Gagal memendekkan URL"
        );
        customError.code = "TINYURL_ERROR";

        throw customError;
    }
}

/**
 * Validasi URL
 * @param {string} url - URL yang akan divalidasi
 * @returns {boolean} True jika URL valid
 */
function isValidUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.protocol === "http:" || urlObj.protocol === "https:";
    } catch (error) {
        return false;
    }
}
