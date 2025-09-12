const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    InteractionContextType,
} = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName("daily")
        .setDescription("Mendapatkan koin harian")
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

        const userId = interaction.user.id;
        const lastClaim = (await db.get(`daily_${userId}`)) || 0;
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;

        if (lastClaim && now - lastClaim < oneDay) {
            const nextClaimTime = Math.floor((lastClaim + oneDay) / 1000);

            const cooldownEmbed = new EmbedBuilder()
                .setColor("#FFA500")
                .setTitle("Waktu Tunggu Klaim Harian")
                .setDescription(
                    `Wah, sepertinya Anda baru saja klaim! Jangan khawatir, Anda bisa mendapatkan daily coin lagi pada:\n\n**<t:${nextClaimTime}:t>** (<t:${nextClaimTime}:R>)\n\nSampai jumpa lagi nanti! ✨`
                )
                .setFooter({ text: "Pantau terus notifikasi kami!" })
                .setTimestamp();

            return interaction.reply({
                embeds: [cooldownEmbed],
                flags: MessageFlags.Ephemeral,
            });
        }

        const coins = Math.floor(Math.random() * (20 - 10 + 1)) + 10;
        await db.add(`coins_${userId}`, coins);
        await db.set(`daily_${userId}`, now);

        const successEmbed = new EmbedBuilder()
            .setColor(interaction.client.config.embed.default)
            .setTitle("Klaim Berhasil! Koin di Tangan!")
            .setDescription(
                `Selamat! Anda berhasil mengklaim daily coin hari ini dan mendapatkan **${coins} koin**! Saldo Anda pasti bertambah nih. Terus semangat ya!`
            )
            .setFooter({ text: "Klaim lagi besok!" })
            .setTimestamp();

        await interaction.reply({ embeds: [successEmbed] });
    },
};
