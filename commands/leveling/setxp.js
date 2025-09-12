const {
    SlashCommandBuilder,
    EmbedBuilder,
    InteractionContextType,
    MessageFlags,
} = require("discord.js");
const { setUserXP, getUserXP, calculateLevel } = require("../../function");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("setxp")
        .setDescription("Set a user's XP (Owner only)")
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("The user to set XP for")
                .setRequired(true)
        )
        .addIntegerOption((option) =>
            option
                .setName("amount")
                .setDescription("The amount of XP to set")
                .setRequired(true)
                .setMinValue(0)
        )
        .setContexts(InteractionContextType.Guild),
    async execute(interaction) {
        if (
            interaction.channel.id !== interaction.client.config.channel.level
        ) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Channel Tidak Diizinkan")
                        .setColor(interaction.client.config.embed.fail)
                        .setDescription(
                            `Maaf, perintah ini hanya dapat digunakan di channel yang ditentukan <#${interaction.client.config.channel.level}>.`
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

        if (
            interaction.user.id !== interaction.client.config.developer.tokioshy
        ) {
            const embed = new EmbedBuilder()
                .setTitle("❌ Access Denied")
                .setDescription(
                    "You don't have permission to use this command!"
                )
                .setColor("#ff0000")
                .setTimestamp();

            return interaction.reply({
                embeds: [embed],
                flags: [MessageFlags.Ephemeral],
            });
        }

        await interaction.deferReply();

        const targetUser = interaction.options.getUser("user");
        const xpAmount = interaction.options.getInteger("amount");
        const guildId = interaction.guild.id;

        try {
            const beforeData = await getUserXP(targetUser.id, guildId);

            await setUserXP(targetUser.id, guildId, xpAmount);

            const afterData = await getUserXP(targetUser.id, guildId);

            const embed = new EmbedBuilder()
                .setTitle("✅ XP Updated Successfully")
                .setDescription(`Successfully set XP for ${targetUser}`)
                .addFields(
                    {
                        name: "Before",
                        value: `**Level:** ${
                            beforeData.level
                        }\n**XP:** ${beforeData.xp.toLocaleString()}`,
                        inline: true,
                    },
                    {
                        name: "After",
                        value: `**Level:** ${
                            afterData.level
                        }\n**XP:** ${afterData.xp.toLocaleString()}`,
                        inline: true,
                    },
                    {
                        name: "Change",
                        value: `**XP:** ${
                            xpAmount >= beforeData.xp ? "+" : ""
                        }${(
                            xpAmount - beforeData.xp
                        ).toLocaleString()}\n**Levels:** ${
                            afterData.level >= beforeData.level ? "+" : ""
                        }${afterData.level - beforeData.level}`,
                        inline: true,
                    }
                )
                .setColor("#00ff00")
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp()
                .setFooter({
                    text: `Command executed by ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL(),
                });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error("Error setting user XP:", error);

            const errorEmbed = new EmbedBuilder()
                .setTitle("❌ Error")
                .setDescription(
                    "An error occurred while setting the user's XP."
                )
                .setColor("#ff0000")
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};
