const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("user")
        .setDescription("Menampilkan informasi detail tentang pengguna")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("info")
                .setDescription("Melihat informasi pengguna")
                .addUserOption((option) =>
                    option
                        .setName("user")
                        .setDescription(
                            "Pilih pengguna untuk menampilkan informasi tentangnya."
                        )
                        .setRequired(false)
                )
        )
        .setContexts(0),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand == "info") {
            await interaction.deferReply();

            const user =
                interaction.options.getUser("user") || interaction.user;
            const member = await interaction.guild.members
                .fetch(user.id)
                .catch(() => null);

            const fetchedUser = await user.fetch();
            const banner = fetchedUser.banner;

            const embed = new EmbedBuilder()
                .setAuthor({
                    name: member.displayName,
                    iconURL: user.displayAvatarURL(),
                })
                .setColor(0x00bfff)
                .setThumbnail(user.displayAvatarURL({ size: 256 }))
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
                        statusEmoji = "⚪ Uknow";
                        break;
                }

                embed.addFields(
                    {
                        name: "Masuk ke Server",
                        value: `<t:${Math.floor(
                            member.joinedAt.getTime() / 1000
                        )}:F> (<t:${Math.floor(
                            member.joinedAt.getTime() / 1000
                        )}:R>)`,
                        inline: false,
                    },
                    { name: "Status Member", value: statusEmoji, inline: true },
                    {
                        name: "Server Booster",
                        value: member.premiumSince
                            ? `Sejak <t:${Math.floor(
                                  member.premiumSince.getTime() / 1000
                              )}:D>`
                            : "No",
                        inline: true,
                    },
                    {
                        name: `Roles (${member.roles.cache.size - 1})`,
                        value:
                            member.roles.cache.size > 1
                                ? member.roles.cache
                                      .filter(
                                          (role) => role.name !== "@everyone"
                                      )
                                      .map((role) => `<@&${role.id}>`)
                                      .join(", ")
                                : "Tidak Ada Peran Tertentu",
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
                        value: importantPermissions
                            .map((p) => `${p}`)
                            .join(", "),
                        inline: false,
                    });
                }
            }

            embed.setFooter({ text: `ID: ${user.id}` }).setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
    },
};
