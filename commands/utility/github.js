const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    InteractionContextType,
} = require("discord.js");
const axios = require("axios");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("github")
        .setDescription("Lihat informasi profil GitHub seseorang")
        .addStringOption((option) =>
            option
                .setName("username")
                .setDescription("Username GitHub")
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

        const username = interaction.options.getString("username");

        try {
            await interaction.deferReply();

            const response = await axios.get(
                `https://api.popcat.xyz/v2/github/${encodeURIComponent(
                    username
                )}`
            );
            const data = response.data;

            if (data.error) {
                return await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("Akun tidak ditemukan!")
                            .setColor(interaction.client.config.embed.fail)
                            .setDescription(
                                `Pengguna \`${username}\` tidak ditemukan!`
                            )
                            .setFooter({
                                text: "Periksa kembali",
                                iconURL: interaction.client.user.avatarURL(),
                            })
                            .setTimestamp(),
                    ],
                });
            }

            const user = data.message;
            const embed = new EmbedBuilder()
                .setTitle(`${user.name || username} (${user.account_type})`)
                .setURL(user.url)
                .setThumbnail(user.avatar)
                .setColor("#080404")
                .setDescription(user.bio || "*Tidak ada bio*")
                .addFields(
                    {
                        name: "📁 Public Repos",
                        value: user.public_repos,
                        inline: true,
                    },
                    {
                        name: "📄 Public Gists",
                        value: user.public_gists,
                        inline: true,
                    },
                    {
                        name: "👥 Followers",
                        value: user.followers,
                        inline: true,
                    },
                    {
                        name: "👤 Following",
                        value: user.following,
                        inline: true,
                    },
                    {
                        name: "📍 Lokasi",
                        value: user.location || "Tidak disetel",
                        inline: true,
                    },
                    {
                        name: "🏢 Perusahaan",
                        value: user.company || "Tidak ada",
                        inline: true,
                    },
                    {
                        name: "📅 Dibuat",
                        value: `<t:${Math.floor(
                            new Date(user.created_at).getTime() / 1000
                        )}:F>`,
                        inline: false,
                    }
                )
                .setFooter({
                    text: `Diupdate: ${new Date(user.updated_at).toLocaleString(
                        "id-ID"
                    )}`,
                    iconURL:
                        "https://cdn.discordapp.com/emojis/1375811618000076870.png",
                });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Terjadi kesalahan")
                        .setColor(interaction.client.config.embed.fail)
                        .setDescription(
                            "Terjadi kesalahan saat mengambil data dari API."
                        )
                        .setFooter({
                            text: "Coba lagi nanti",
                            iconURL: interaction.client.user.avatarURL(),
                        })
                        .setTimestamp(),
                ],
            });
        }
    },
};
