const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    InteractionContextType,
} = require("discord.js");
const translate = require("google-translate-api-x");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("translate")
        .setDescription("Terjemahkan teks ke bahasa lain")
        .addStringOption((option) =>
            option
                .setName("text")
                .setDescription("Teks yang ingin diterjemahkan")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("language")
                .setDescription("Bahasa yang ingin diterjemahkan")
                .setRequired(true)
                .addChoices(
                    { name: "Bahasa Inggris", value: "en" },
                    { name: "Bahasa Indonesia", value: "id" },
                    { name: "Bahasa Jepang", value: "ja" },
                    { name: "Bahasa Korea", value: "ko" },
                    { name: "Bahasa Mandarin", value: "zh-CN" },
                    { name: "Bahasa Spanyol", value: "es" },
                    { name: "Bahasa Prancis", value: "fr" },
                    { name: "Bahasa Jerman", value: "de" }
                )
        )
        .addStringOption((option) =>
            option
                .setName("from")
                .setDescription(
                    "Bahasa asal teks (opsional, auto-detect jika tidak diisi)"
                )
                .setRequired(false)
                .addChoices(
                    { name: "Auto Detect", value: "auto" },
                    { name: "Bahasa Inggris", value: "en" },
                    { name: "Bahasa Indonesia", value: "id" },
                    { name: "Bahasa Jepang", value: "ja" },
                    { name: "Bahasa Korea", value: "ko" },
                    { name: "Bahasa Mandarin", value: "zh-CN" },
                    { name: "Bahasa Spanyol", value: "es" },
                    { name: "Bahasa Prancis", value: "fr" },
                    { name: "Bahasa Jerman", value: "de" }
                )
        )
        .setContexts(InteractionContextType.Guild),
    async execute(interaction) {
        if (
            interaction.channel.id !== interaction.client.config.channel.utility
        ) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Channel Tidak Diizinkan")
                        .setColor(interaction.client.config.embed.fail)
                        .setDescription(
                            `Maaf, perintah ini hanya dapat digunakan di channel yang ditentukan <#${interaction.client.config.channel.utility}>.`
                        )
                        .setFooter({
                            text: `Perintah Terbatas`,
                            iconURL: interaction.client.user.avatarURL(),
                        })
                        .setTimestamp(),
                ],
                flags: MessageFlags.Ephemeral,
            });
        }

        try {
            await interaction.deferReply();

            const text = interaction.options.getString("text");
            const targetLanguage = interaction.options.getString("language");
            const fromLanguage =
                interaction.options.getString("from") || "auto";

            const getLanguageName = (code) => {
                const languages = {
                    auto: "Auto Detect",
                    en: "Bahasa Inggris",
                    id: "Bahasa Indonesia",
                    ja: "Bahasa Jepang",
                    ko: "Bahasa Korea",
                    "zh-CN": "Bahasa Mandarin",
                    es: "Bahasa Spanyol",
                    fr: "Bahasa Prancis",
                    de: "Bahasa Jerman",
                    ms: "Bahasa Melayu",
                    ar: "Bahasa Arab",
                    hi: "Bahasa Hindi",
                    pt: "Bahasa Portugis",
                    ru: "Bahasa Rusia",
                    it: "Bahasa Italia",
                    nl: "Bahasa Belanda",
                    tr: "Bahasa Turki",
                    pl: "Bahasa Polandia",
                    th: "Bahasa Thailand",
                    vi: "Bahasa Vietnam",
                    sw: "Bahasa Swahili",
                    tl: "Bahasa Tagalog",
                    jv: "Bahasa Jawa",
                    su: "Bahasa Sunda",
                };
                return languages[code] || `Bahasa Lain (${code})`;
            };

            const result = await translate(text, {
                from: fromLanguage,
                to: targetLanguage,
            });

            const embed = new EmbedBuilder()
                .setColor("#5390f5")
                .setTitle("Hasil Terjemahan")
                .setDescription(`Berikut adalah terjemahan teks Anda:`)
                .addFields(
                    {
                        name: "📝 Teks Asli",
                        value:
                            text.length > 1024
                                ? text.substring(0, 1021) + "..."
                                : text,
                    },
                    {
                        name: "➡️ Diterjemahkan ke",
                        value: getLanguageName(targetLanguage),
                        inline: true,
                    },
                    {
                        name: "✨ Hasil Terjemahan",
                        value:
                            result.text.length > 1024
                                ? result.text.substring(0, 1021) + "..."
                                : result.text,
                    }
                )
                .setThumbnail(
                    "https://cdn.discordapp.com/emojis/1374735185802690651.png"
                )
                .setTimestamp();

            if (
                fromLanguage === "auto" &&
                result.from &&
                result.from.language &&
                result.from.language.iso !== targetLanguage
            ) {
                embed.addFields({
                    name: "🔍 Bahasa Terdeteksi",
                    value:
                        getLanguageName(result.from.language.iso) || "Unknown",
                    inline: true,
                });
            }

            embed.setFooter({
                text: `Diminta oleh ${interaction.user.username}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
            });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error("Translation error:", error);

            const errorEmbed = new EmbedBuilder()
                .setTitle("Terjadi Kesalahan")
                .setColor(interaction.client.config.embed.fail)
                .setDescription(`Terjadi kesalahan saat menerjemah teks.`)
                .setFooter({
                    text: `Silahkan coba lagi`,
                    iconURL: interaction.client.user.avatarURL(),
                })
                .setTimestamp();

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed] });
            }
        }
    },
};
