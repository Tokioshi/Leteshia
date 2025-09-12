const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    InteractionContextType,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("serverinfo")
        .setDescription("Menampilkan informasi detail tentang server")
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
            .setColor(interaction.client.config.embed.default)
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
                        guild.channels.cache.filter((c) => c.type === 4).size
                    }`,
                    inline: true,
                },
                {
                    name: "Text Channels",
                    value: `${
                        guild.channels.cache.filter((c) => c.type === 0).size
                    }`,
                    inline: true,
                },
                {
                    name: "Voice Channels",
                    value: `${
                        guild.channels.cache.filter((c) => c.type === 2).size
                    }`,
                    inline: true,
                },
                {
                    name: "Threads",
                    value: `${
                        guild.channels.cache.filter((c) => c.isThread()).size
                    }`,
                    inline: true,
                },
                {
                    name: "Role List",
                    value: rolesMention || "Tidak ada role selain @everyone",
                }
            )
            .setFooter({
                text: `ID: ${
                    guild.id
                } • Server Created • ${guild.createdAt.toLocaleDateString(
                    "en-US"
                )} • ${guild.createdAt.toLocaleTimeString("en-US")}`,
            });

        await interaction.reply({ embeds: [embed] });
    },
};
