const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    InteractionContextType,
} = require("discord.js");
const axios = require("axios");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("steam")
        .setDescription("Cari informasi game dari Steam")
        .addStringOption((option) =>
            option
                .setName("query")
                .setDescription("Nama game yang ingin dicari")
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

        const query = interaction.options.getString("query");

        try {
            await interaction.deferReply();

            const response = await axios.get(
                `https://api.popcat.xyz/v2/steam?q=${encodeURIComponent(query)}`
            );
            const data = response.data;

            if (data.error) {
                return await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("Terjadi Kesalahan")
                            .setColor(interaction.client.config.embed.fail)
                            .setDescription(
                                `Game dengan nama \`${query}\` tidak ditemukan.`
                            )
                            .setFooter({
                                text: `Silahkan coba lagi`,
                                iconURL: interaction.client.user.avatarURL(),
                            })
                            .setTimestamp(),
                    ],
                });
            }

            const game = data.message;

            const embed = new EmbedBuilder()
                .setTitle(game.name)
                .setDescription(game.description || "*Tidak ada deskripsi*")
                .setURL(game.website || null)
                .setImage(game.banner)
                .setThumbnail(game.thumbnail)
                .setColor(interaction.client.config.embed.default)
                .addFields(
                    {
                        name: "🎮 Controller Support",
                        value: game.controller_support || "Tidak diketahui",
                        inline: true,
                    },
                    {
                        name: "💵 Harga",
                        value: game.price || "Tidak tersedia",
                        inline: true,
                    },
                    {
                        name: "👨‍💻 Developer",
                        value: game.developers?.join(", ") || "Tidak diketahui",
                        inline: false,
                    },
                    {
                        name: "📦 Publisher",
                        value: game.publishers?.join(", ") || "Tidak diketahui",
                        inline: false,
                    }
                )
                .setFooter({ text: "Data dari Steam via PopCat API" })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
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
            });
        }
    },
};
