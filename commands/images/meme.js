const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    InteractionContextType,
} = require("discord.js");
const axios = require("axios");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("meme")
        .setDescription("Menampilkan meme acak dari Reddit")
        .setContexts(InteractionContextType.Guild),
    async execute(interaction) {
        if (
            interaction.channel.id !== interaction.client.config.channel.images
        ) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Channel Tidak Diizinkan")
                        .setColor(interaction.client.config.embed.fail)
                        .setDescription(
                            `Maaf, perintah ini hanya dapat digunakan di channel yang ditentukan <#${interaction.client.config.channel.images}>.`
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

            const response = await axios.get("https://api.popcat.xyz/v2/meme");
            const data = response.data;

            if (!data.error && data.message?.content?.image) {
                const meme = data.message;
                const embed = new EmbedBuilder()
                    .setTitle(meme.title || "Meme")
                    .setURL(meme.link)
                    .setImage(meme.content.imageHigh || meme.content.image)
                    .setColor(interaction.client.config.embed.default)
                    .setFooter({
                        text: `👍 ${meme.misc.upvotes} | r/${meme.subreddit} | by u/${meme.author}`,
                    });

                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.editReply("Gagal mengambil meme.");
            }
        } catch (error) {
            console.error(error);
            await interaction.editReply({
                content: "Terjadi kesalahan saat mengambil data dari API.",
                flags: MessageFlags.Ephemeral,
            });
        }
    },
};
