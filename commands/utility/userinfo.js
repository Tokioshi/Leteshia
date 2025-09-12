const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    InteractionContextType,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("userinfo")
        .setDescription("Menampilkan informasi detail tentang user")
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("Pilih user untuk menampilkan informasi")
                .setRequired(false)
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

        const user = interaction.options.getUser("user") || interaction.user;
        const member = await interaction.guild.members
            .fetch(user.id)
            .catch(() => null);

        const fetchedUser = await user.fetch();
        const banner = fetchedUser.banner;

        const embed = new EmbedBuilder()
            .setAuthor({
                name: member.displayName,
                iconURL: user.displayAvatarURL({ dynamic: true }),
            })
            .setColor(interaction.client.config.embed.default || 0x00bfff)
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                {
                    name: "Username",
                    value: `${user.username}${
                        user.discriminator === "0"
                            ? ""
                            : `#${user.discriminator}`
                    }`,
                    inline: true,
                },
                { name: "Bot", value: user.bot ? "Ya" : "Tidak", inline: true },
                {
                    name: "Akun Dibuat",
                    value: `<t:${Math.floor(
                        user.createdAt.getTime() / 1000
                    )}:F> (<t:${Math.floor(
                        user.createdAt.getTime() / 1000
                    )}:R>)`,
                    inline: false,
                }
            );

        if (banner) {
            embed.setImage(
                `https://cdn.discordapp.com/banners/${fetchedUser.id}/${
                    fetchedUser.banner
                }.${
                    fetchedUser.banner.startsWith("a_") ? "gif" : "png"
                }?size=4096`
            );
        }

        if (member) {
            let statusEmoji;
            switch (member.presence?.status) {
                case "online":
                    statusEmoji = "🟢 Online";
                    break;
                case "idle":
                    statusEmoji = "🌙 Idle";
                    break;
                case "dnd":
                    statusEmoji = "⛔ Do Not Disturb";
                    break;
                case "offline":
                    statusEmoji = "⚫ Offline";
                    break;
                default:
                    statusEmoji = "⚪ Tidak Diketahui";
                    break;
            }

            embed.addFields(
                {
                    name: "Bergabung di Server",
                    value: `<t:${Math.floor(
                        member.joinedAt.getTime() / 1000
                    )}:F> (<t:${Math.floor(
                        member.joinedAt.getTime() / 1000
                    )}:R>)`,
                    inline: false,
                }, // Waktu bergabung di server
                { name: "Status Member", value: statusEmoji, inline: true },
                {
                    name: "Server Booster",
                    value: member.premiumSince
                        ? `Sejak <t:${Math.floor(
                              member.premiumSince.getTime() / 1000
                          )}:D>`
                        : "Tidak",
                    inline: true,
                },
                {
                    name: `Peran (${member.roles.cache.size - 1})`,
                    value:
                        member.roles.cache.size > 1
                            ? member.roles.cache
                                  .filter((role) => role.name !== "@everyone")
                                  .map((role) => `<@&${role.id}>`)
                                  .join(", ")
                            : "Tidak Ada Peran Khusus",
                    inline: false,
                }
            );

            const memberPermissions = member.permissions.toArray();
            const importantPermissions = [
                "Administrator",
                "ManageGuild",
                "KickMembers",
                "BanMembers",
                "ManageChannels",
                "ManageRoles",
                "ModerateMembers",
            ].filter((perm) => memberPermissions.includes(perm));

            if (importantPermissions.length > 0) {
                embed.addFields({
                    name: "Izin Utama",
                    value: importantPermissions.map((p) => `${p}`).join(", "),
                    inline: false,
                });
            }
        }

        embed.setFooter({ text: `ID: ${user.id}` }).setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
