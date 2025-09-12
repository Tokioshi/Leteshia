const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    InteractionContextType,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("shop")
        .setDescription("Melihat daftar item yang dijual di toko")
        .setContexts(InteractionContextType.Guild),
    async execute(interaction) {
        if (
            interaction.channel.id !== interaction.client.config.channel.economy
        ) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Channel Tidak Diizinkan")
                        .setColor(interaction.client.config.embed.fail)
                        .setDescription(
                            `Maaf, perintah ini hanya dapat digunakan di channel yang ditentukan <#${interaction.client.config.channel.economy}>.`
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

        const shopEmbed = new EmbedBuilder()
            .setColor(interaction.client.config.embed.default)
            .setThumbnail(
                "https://media.discordapp.net/attachments/1251432839543525406/1376045686788849765/shop_1.png?ex=6833e5e9&is=68329469&hm=2664de95ad370129ba222d9c9e7a65b70d067bc4ef7484bf5423d81afce861dd&=&format=webp&quality=lossless"
            )
            .setTitle("Toko Keren")
            .setDescription(
                "Selamat datang di toko! Berikut adalah daftar item yang tersedia untuk dibeli:\n\n" +
                    "<:roti:1376087462157226075> **Roti** - 5 koin\n" +
                    "<:kopi:1376089294933983233> **Kopi** - 10 koin\n" +
                    "<:pedang:1376088535810969651> **Pedang** - 25 koin\n" +
                    "<:lotre:1376089946418315344> **Tiket Lotre** - 20 koin\n\n" +
                    "Gunakan koinmu dengan bijak! Beli dengan /buy."
            )
            .setFooter({ text: "Harga dapat berubah sewaktu-waktu!" })
            .setTimestamp();

        await interaction.reply({ embeds: [shopEmbed] });
    },
};
