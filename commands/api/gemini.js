const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    InteractionContextType,
} = require("discord.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("gemini")
        .setDescription("Tanya Gemini AI tentang apapun!")
        .addStringOption((option) =>
            option
                .setName("prompt")
                .setDescription("Prompt yang ingin Anda tanyakan ke Gemini AI")
                .setMaxLength(500)
                .setMinLength(5)
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

        const genAI = new GoogleGenerativeAI(
            interaction.client.config.api.gemini
        );
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = interaction.options.getString("prompt");

        await interaction.reply({
            content: "Menunggu jawaban dari Gemini AI...",
        });

        try {
            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            if (text) {
                const chunks = splitMessage(text, 4096);

                await interaction.editReply({
                    content: null,
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(
                                `Respon Gemini untuk ${interaction.user.username}`
                            )
                            .setColor("#5086d2")
                            .setDescription(chunks[0])
                            .setFooter({
                                text: "Gemini can make mistakes, so double-check it",
                                iconURL:
                                    "https://cdn.discordapp.com/emojis/1375750297112285285.png",
                            })
                            .setTimestamp(),
                    ],
                });

                for (let i = 1; i < chunks.length; i++) {
                    await interaction.followUp({
                        content: null,
                        embeds: [
                            new EmbedBuilder()
                                .setTitle(
                                    `Respon AI untuk ${
                                        interaction.user.username
                                    } (Part ${i + 1})`
                                )
                                .setColor("#5086d2")
                                .setDescription(chunks[i])
                                .setFooter({
                                    text: "Gemini can make mistakes, so double-check it",
                                    iconURL:
                                        "https://cdn.discordapp.com/emojis/1375750297112285285.png",
                                })
                                .setTimestamp(),
                        ],
                    });
                }
            } else {
                interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(interaction.client.config.embed.fail)
                            .setTitle("Terjadi Kesalahan!")
                            .setDescription(
                                "Maaf, terjadi kesalahan saat generate jawaban. Silakan coba lagi nanti."
                            )
                            .setTimestamp(),
                    ],
                });
            }
        } catch (error) {
            console.error("Error generating AI response:", error);

            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(interaction.client.config.embed.fail)
                        .setTitle("Terjadi Kesalahan!")
                        .setDescription(
                            "Maaf, terjadi kesalahan saat generate jawaban. Silakan coba lagi nanti."
                        )
                        .setTimestamp(),
                ],
            });
        }
    },
};

function splitMessage(text, maxLength) {
    const chunks = [];
    for (let i = 0; i < text.length; i += maxLength) {
        chunks.push(text.substring(i, i + maxLength));
    }
    return chunks;
}
