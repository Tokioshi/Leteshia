const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("server")
        .setDescription("Menampilkan informasi detail tentang server")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("info")
                .setDescription("Melihat informasi server")
        )
        .setContexts(0),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand == "info") {
            await interaction.deferReply();

            const guild = interaction.guild;
            const owner = await guild.fetchOwner();

            const rolesMention = guild.roles.cache
                .filter((role) => role.name !== "@everyone")
                .map((role) => `<@&${role.id}>`)
                .join(", ")
                .slice(0, 1024);

            const embed = new EmbedBuilder()
                .setAuthor({
                    name: guild.name,
                    iconURL: guild.iconURL({ size: 256 }),
                })
                .setThumbnail(guild.iconURL({ size: 4096 }))
                .setColor("Orange")
                .addFields(
                    { name: "Owner", value: `<@${owner.id}>`, inline: true },
                    {
                        name: "Members",
                        value: `${guild.memberCount}`,
                        inline: true,
                    },
                    {
                        name: "Roles",
                        value: `${guild.roles.cache.size}`,
                        inline: true,
                    },
                    {
                        name: "Category Channels",
                        value: `${
                            guild.channels.cache.filter((c) => c.type === 4)
                                .size
                        }`,
                        inline: true,
                    },
                    {
                        name: "Text Channels",
                        value: `${
                            guild.channels.cache.filter((c) => c.type === 0)
                                .size
                        }`,
                        inline: true,
                    },
                    {
                        name: "Voice Channels",
                        value: `${
                            guild.channels.cache.filter((c) => c.type === 2)
                                .size
                        }`,
                        inline: true,
                    },
                    {
                        name: "Threads",
                        value: `${
                            guild.channels.cache.filter((c) => c.isThread())
                                .size
                        }`,
                        inline: true,
                    },
                    {
                        name: "Role List",
                        value:
                            rolesMention ||
                            "There is no role other than @everyone",
                    }
                )
                .setFooter({
                    text: `ID: ${
                        guild.id
                    } • Server Created • ${guild.createdAt.toLocaleDateString(
                        "en-US"
                    )} • ${guild.createdAt.toLocaleTimeString("en-US")}`,
                });

            await interaction.editReply({ embeds: [embed] });
        }
    },
};
