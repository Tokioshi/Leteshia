const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    InteractionContextType,
} = require("discord.js");
const axios = require("axios");

const currencies = [
    { name: "US Dollar", value: "USD", flag: "🇺🇸" },
    { name: "Euro", value: "EUR", flag: "🇪🇺" },
    { name: "Japanese Yen", value: "JPY", flag: "🇯🇵" },
    { name: "British Pound", value: "GBP", flag: "🇬🇧" },
    { name: "Swiss Franc", value: "CHF", flag: "🇨🇭" },
    { name: "Canadian Dollar", value: "CAD", flag: "🇨🇦" },
    { name: "Australian Dollar", value: "AUD", flag: "🇦🇺" },
    { name: "China Yuan", value: "CNY", flag: "🇨🇳" },
    { name: "Indian Rupee", value: "INR", flag: "🇮🇳" },
    { name: "Indonesian Rupiah", value: "IDR", flag: "🇮🇩" },
    { name: "Russian Ruble", value: "RUB", flag: "🇷🇺" },
    { name: "Singapore Dollar", value: "SGD", flag: "🇸🇬" },
    { name: "South Korean Won", value: "KRW", flag: "🇰🇷" },
    { name: "Thai Baht", value: "THB", flag: "🇹🇭" },
    { name: "Vietnamese Dong", value: "VND", flag: "🇻🇳" },
    { name: "Malaysian Ringgit", value: "MYR", flag: "🇲🇾" },
    { name: "Philippines Peso", value: "PHP", flag: "🇵🇭" },
    { name: "New Taiwan Dollar", value: "TWD", flag: "🇹🇼" },
    { name: "Hong Kong Dollar", value: "HKD", flag: "🇭🇰" },
    { name: "Brazilian Real", value: "BRL", flag: "🇧🇷" },
    { name: "Mexican Peso", value: "MXN", flag: "🇲🇽" },
    { name: "Saudi Riyal", value: "SAR", flag: "🇸🇦" },
    { name: "UAE Dirham", value: "AED", flag: "🇦🇪" },
    { name: "Polish Złoty", value: "PLN", flag: "🇵🇱" },
    { name: "Turkish Lira", value: "TRY", flag: "🇹🇷" },
];

function formatNumber(number, currency) {
    const noDecimalCurrencies = ["JPY", "KRW", "VND", "IDR"];

    if (noDecimalCurrencies.includes(currency)) {
        return new Intl.NumberFormat("en-US", {
            maximumFractionDigits: 0,
        }).format(number);
    } else {
        return new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(number);
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("convert")
        .setDescription("Konversi nilai mata uang dari satu ke lainnya")
        .addNumberOption((option) =>
            option
                .setName("amount")
                .setDescription("Jumlah yang ingin dikonversi")
                .setRequired(true)
        )
        .addStringOption((option) => {
            option
                .setName("from")
                .setDescription("Mata uang asal")
                .setRequired(true);

            currencies.forEach((currency) => {
                option.addChoices({
                    name: `${currency.flag} ${currency.name} (${currency.value})`,
                    value: currency.value,
                });
            });

            return option;
        })
        .addStringOption((option) => {
            option
                .setName("to")
                .setDescription("Mata uang tujuan")
                .setRequired(true);

            currencies.forEach((currency) => {
                option.addChoices({
                    name: `${currency.flag} ${currency.name} (${currency.value})`,
                    value: currency.value,
                });
            });

            return option;
        })
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
            await interaction.deferReply();

            const amount = interaction.options.getNumber("amount");
            const fromCurrency = interaction.options.getString("from");
            const toCurrency = interaction.options.getString("to");

            if (amount <= 0) {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("Kesalahan Input")
                            .setColor(interaction.client.config.embed.fail)
                            .setDescription(
                                "Jumlah yang dimasukkan harus lebih besar dari 0!"
                            )
                            .setFooter({
                                text: `Periksa input Anda`,
                                iconURL: interaction.client.user.avatarURL(),
                            })
                            .setTimestamp(),
                    ],
                });
            }

            const API_KEY = interaction.client.config.api.exchange;
            const API_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${fromCurrency}`;

            const response = await axios.get(API_URL);
            const { conversion_rates } = response.data;

            if (!conversion_rates || !conversion_rates[toCurrency]) {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("Kurs Tidak Ditemukan")
                            .setColor(interaction.client.config.embed.fail)
                            .setDescription(
                                `Tidak dapat menemukan kurs untuk ${fromCurrency} ke ${toCurrency}`
                            )
                            .setFooter({
                                text: `Periksa input Anda`,
                                iconURL: interaction.client.user.avatarURL(),
                            })
                            .setTimestamp(),
                    ],
                });
            }

            const rate = conversion_rates[toCurrency];
            const result = amount * rate;

            const fromCurrencyDetails = currencies.find(
                (c) => c.value === fromCurrency
            );
            const toCurrencyDetails = currencies.find(
                (c) => c.value === toCurrency
            );

            const embed = new EmbedBuilder()
                .setColor(interaction.client.config.embed.default)
                .setTitle("Konversi Mata Uang")
                .addFields(
                    {
                        name: "Dari",
                        value: `${fromCurrencyDetails.flag} ${formatNumber(
                            amount,
                            fromCurrency
                        )} ${fromCurrency}`,
                    },
                    {
                        name: "Ke",
                        value: `${toCurrencyDetails.flag} ${formatNumber(
                            result,
                            toCurrency
                        )} ${toCurrency}`,
                    },
                    {
                        name: "Kurs",
                        value: `1 ${fromCurrency} = ${formatNumber(
                            rate,
                            toCurrency
                        )} ${toCurrency}`,
                    }
                )
                .setFooter({
                    text: `Data diupdate: ${new Date(
                        response.data.time_last_update_utc
                    ).toLocaleString()}`,
                    iconURL:
                        "https://cdn.discordapp.com/emojis/1375809604725768302.png",
                });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error("Currency conversion error:", error);

            let errorMessage = "Terjadi kesalahan saat mengkonversi mata uang.";

            if (error.response) {
                if (error.response.status === 404) {
                    errorMessage =
                        "Mata uang tidak ditemukan. Pastikan kode mata uang valid.";
                } else if (
                    error.response.status === 401 ||
                    error.response.status === 403
                ) {
                    errorMessage =
                        "Akses API ditolak. Kemungkinan API key tidak valid.";
                } else if (error.response.status === 429) {
                    errorMessage =
                        "Terlalu banyak permintaan ke API. Coba lagi nanti.";
                }
            } else if (
                error.code === "ENOTFOUND" ||
                error.code === "ETIMEDOUT"
            ) {
                errorMessage =
                    "Tidak dapat menghubungi layanan API. Periksa koneksi atau coba lagi nanti.";
            }

            const errorEmbed = new EmbedBuilder()
                .setColor(interaction.client.config.embed.fail)
                .setTitle("Error Konversi")
                .setDescription(errorMessage)
                .setFooter({
                    text: `Perintah Gagal`,
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
