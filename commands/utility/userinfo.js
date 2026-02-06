const { SlashCommandBuilder, EmbedBuilder, InteractionContextType } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("user")
        .setDescription("Displaying detailed information about users")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("info")
                .setDescription("Displaying user information")
                .addUserOption((option) =>
                    option
                        .setName("user")
                        .setDescription("Select a user to display information about them.")
                        .setRequired(false),
                ),
        )
        .setContexts(InteractionContextType.Guild),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand == "info") {
            await interaction.deferReply();

            const user = interaction.options.getUser("user") || interaction.user;
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);

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
                            user.discriminator === "0" ? "" : `#${user.discriminator}`
                        }`,
                        inline: true,
                    },
                    {
                        name: "Account Created",
                        value: `<t:${Math.floor(
                            user.createdAt.getTime() / 1000,
                        )}:F> (<t:${Math.floor(user.createdAt.getTime() / 1000)}:R>)`,
                        inline: false,
                    },
                );

            if (banner) {
                embed.setImage(
                    `https://cdn.discordapp.com/banners/${fetchedUser.id}/${fetchedUser.banner}.${
                        fetchedUser.banner.startsWith("a_") ? "gif" : "png"
                    }?size=4096`,
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
                        name: "Joined Server",
                        value: `<t:${Math.floor(
                            member.joinedAt.getTime() / 1000,
                        )}:F> (<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>)`,
                        inline: false,
                    },
                    { name: "Member Status", value: statusEmoji, inline: true },
                    {
                        name: "Server Booster",
                        value: member.premiumSince
                            ? `Since <t:${Math.floor(member.premiumSince.getTime() / 1000)}:D>`
                            : "No",
                        inline: true,
                    },
                    {
                        name: `Roles (${member.roles.cache.size - 1})`,
                        value:
                            member.roles.cache.size > 1
                                ? member.roles.cache
                                      .filter((role) => role.name !== "@everyone")
                                      .map((role) => `<@&${role.id}>`)
                                      .join(", ")
                                : "No Specific Role",
                        inline: false,
                    },
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
                        name: "Main Permissions",
                        value: importantPermissions.map((p) => `${p}`).join(", "),
                        inline: false,
                    });
                }
            }

            embed.setFooter({ text: `ID: ${user.id}` }).setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
    },
};
