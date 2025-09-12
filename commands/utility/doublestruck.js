const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    InteractionContextType,
} = require("discord.js");
const axios = require("axios");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("doublestruck")
        .setDescription("Ubah teks menjadi format double-struck")
        .addStringOption((option) =>
            option
                .setName("teks")
                .setDescription("Teks yang ingin diubah")
                .setRequired(true)
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

        const teks = interaction.options.getString("teks");

        try {
            const response = await axios.get(
                `https://api.popcat.xyz/v2/doublestruck?text=${encodeURIComponent(
                    teks
                )}`
            );
            const data = response.data;

            if (!data.error && data.message?.text) {
                const embed = new EmbedBuilder()
                    .setTitle("Teks Double-Struck")
                    .setColor(interaction.client.config.embed.default)
                    .addFields(
                        { name: "Teks Asli", value: teks },
                        { name: "Double-Struck", value: data.message.text }
                    )
                    .setFooter({ text: "Dikonversi oleh PopCat API" })
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("Terjadi Kesalahan")
                            .setColor(interaction.client.config.embed.fail)
                            .setDescription(
                                `Gagal mengonversi teks ke double-struck`
                            )
                            .setFooter({
                                text: `Silahkan coba lagi`,
                                iconURL: interaction.client.user.avatarURL(),
                            })
                            .setTimestamp(),
                    ],
                    flags: MessageFlags.Ephemeral,
                });
            }
        } catch (error) {
            console.error(error);

            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Terjadi Kesalahan")
                        .setColor(interaction.client.config.embed.fail)
                        .setDescription(`Gagal mengambil data dari API`)
                        .setFooter({
                            text: `Silahkan coba lagi`,
                            iconURL: interaction.client.user.avatarURL(),
                        })
                        .setTimestamp(),
                ],
                flags: MessageFlags.Ephemeral,
            });
        }
    },
};
