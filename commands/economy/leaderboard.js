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
        .setName("leaderboard")
        .setDescription("Melihat 10 pengguna dengan koin terbanyak")
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

        const allCoins = await db.startsWith("coins_");

        if (!allCoins || allCoins.length === 0) {
            const emptyEmbed = new EmbedBuilder()
                .setColor(interaction.client.config.embed.default)
                .setTitle("Leaderboard Koin")
                .setDescription(
                    "Belum ada pengguna dengan koin saat ini. Ayo klaim koinmu dengan /daily!"
                )
                .setFooter({ text: "Cek lagi nanti!" })
                .setTimestamp();
            return interaction.reply({ embeds: [emptyEmbed] });
        }

        const leaderboard = allCoins.map((entry) => ({
            userId: entry.id.replace("coins_", ""),
            coins: entry.value || 0,
        }));

        leaderboard.sort((a, b) => b.coins - a.coins);
        const top10 = leaderboard.slice(0, 10);

        let leaderboardEntries = "";
        for (let i = 0; i < top10.length; i++) {
            const user = await interaction.client.users
                .fetch(top10[i].userId)
                .catch(() => null);
            const username = user ? user.tag : "Pengguna Tidak Diketahui";

            let medal = "";
            if (i === 0) medal = "🥇 ";
            else if (i === 1) medal = "🥈 ";
            else if (i === 2) medal = "🥉 ";

            leaderboardEntries += `${medal}${i + 1}. **${username}** - \`${
                top10[i].coins
            } koin\`\n`;
        }

        const leaderboardEmbed = new EmbedBuilder()
            .setColor(interaction.client.config.embed.default)
            .setTitle("Papan Peringkat Koin Teratas")
            .setDescription(leaderboardEntries)
            .setFooter({ text: "Terus tingkatkan koinmu dengan /daily!" })
            .setTimestamp();

        await interaction.reply({ embeds: [leaderboardEmbed] });
    },
};
