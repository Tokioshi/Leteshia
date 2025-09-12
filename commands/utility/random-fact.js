const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    InteractionContextType,
} = require("discord.js");
const axios = require("axios");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("random-fact")
        .setDescription("Fakta random!")
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

            const factResponse = await axios.get(
                "https://api.popcat.xyz/v2/fact"
            );
            const factData = factResponse.data;

            if (factData.error || !factData.message?.fact) {
                return await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("Terjadi Kesalahan")
                            .setColor(interaction.client.config.embed.fail)
                            .setDescription(`Gagal mengambil fakta`)
                            .setFooter({
                                text: `Silahkan coba lagi`,
                                iconURL: interaction.client.user.avatarURL(),
                            })
                            .setTimestamp(),
                    ],
                });
            }

            const factOriginal = factData.message.fact;

            const translateResponse = await axios.get(
                `https://api.popcat.xyz/v2/translate?to=id&text=${encodeURIComponent(
                    factOriginal
                )}`
            );
            const translated = translateResponse.data.translated;

            const embed = new EmbedBuilder()
                .setTitle("Fakta Random")
                .setColor(interaction.client.config.embed.default)
                .setDescription(translated)
                .setFooter({ text: "Fakta dari PopCat API" })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);

            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Terjadi Kesalahan")
                        .setColor(interaction.client.config.embed.fail)
                        .setDescription(
                            `Terjadi kesalahan saat mengambil atau menerjemahkan fakta`
                        )
                        .setFooter({
                            text: `Silahkan coba lagi`,
                            iconURL: interaction.client.user.avatarURL(),
                        })
                        .setTimestamp(),
                ],
            });
        }
    },
};
