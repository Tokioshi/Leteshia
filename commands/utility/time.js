const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    InteractionContextType,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("time")
        .setDescription("Menampilkan waktu di zona waktu tertentu")
        .addStringOption((option) =>
            option
                .setName("timezone")
                .setDescription("Pilih zona waktu (contoh: Asia/Jakarta)")
                .setRequired(true)
                .addChoices(
                    { name: "Asia/Jakarta (WIB)", value: "Asia/Jakarta" },
                    {
                        name: "America/New_York (EST)",
                        value: "America/New_York",
                    },
                    { name: "Europe/London (GMT/BST)", value: "Europe/London" },
                    { name: "Asia/Tokyo (JST)", value: "Asia/Tokyo" },
                    {
                        name: "Australia/Sydney (AEST/AEDT)",
                        value: "Australia/Sydney",
                    },
                    { name: "Asia/Shanghai (CST)", value: "Asia/Shanghai" },
                    { name: "Europe/Paris (CET/CEST)", value: "Europe/Paris" },
                    {
                        name: "America/Los_Angeles (PST/PDT)",
                        value: "America/Los_Angeles",
                    }
                )
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

        const timezone = interaction.options.getString("timezone");

        try {
            const now = new Date();

            const timeOnly = now.toLocaleTimeString("en-US", {
                timeZone: timezone,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
            });
            const dateOnly = now.toLocaleDateString("en-US", {
                timeZone: timezone,
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            });

            const embed = new EmbedBuilder()
                .setTitle(`Waktu Saat Ini di ${timezone}`)
                .setColor(interaction.client.config.embed.default)
                .setDescription(
                    `Berikut adalah detail waktu dan tanggal di zona waktu **${timezone}** yang Anda pilih:`
                )
                .addFields(
                    {
                        name: "⏰ Waktu",
                        value: `\`${timeOnly}\``,
                        inline: true,
                    },
                    {
                        name: "🗓️ Tanggal Lengkap",
                        value: `\`${dateOnly}\``,
                        inline: true,
                    },
                    {
                        name: "🌐 UTC Offset",
                        value: `\`${
                            Intl.DateTimeFormat(undefined, {
                                timeZone: timezone,
                                timeZoneName: "shortOffset",
                            })
                                .format(now)
                                .split(" ")[1]
                        }\``,
                        inline: true,
                    }
                )
                .setFooter({ text: `Diminta oleh ${interaction.user.tag}` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(
                `Error fetching time for timezone ${timezone}: ${error}`
            );

            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Terjadi Kesalahan")
                        .setColor(interaction.client.config.embed.fail)
                        .setDescription(
                            `Terjadi kesalahan saat mencoba mendapatkan waktu untuk zona waktu \`${timezone}\`. Pastikan zona waktu valid`
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
