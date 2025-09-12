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
        .setName("balance")
        .setDescription("Memeriksa jumlah koin yang Anda miliki")
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
        const coins = (await db.get(`coins_${userId}`)) || 0;

        const balanceEmbed = new EmbedBuilder()
            .setColor(interaction.client.config.embed.default)
            .setTitle("Saldo Koin Anda")
            .setDescription(
                `Halo! Saldo koin Anda saat ini adalah **${coins} koin**.`
            )
            .setFooter({ text: "Klaim koin harianmu dengan /daily!" })
            .setTimestamp();

        await interaction.reply({ embeds: [balanceEmbed] });
    },
};
