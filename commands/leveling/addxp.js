const {
    SlashCommandBuilder,
    EmbedBuilder,
    InteractionContextType,
    MessageFlags,
} = require("discord.js");
const { addUserXP, getUserXP } = require("../../function");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("addxp")
        .setDescription("Add XP to a user (Owner only)")
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("The user to add XP to")
                .setRequired(true)
        )
        .addIntegerOption((option) =>
            option
                .setName("amount")
                .setDescription(
                    "The amount of XP to add (can be negative to subtract)"
                )
                .setRequired(true)
        )
        .setContexts(InteractionContextType.Guild),

    async execute(interaction) {
        if (interaction.user.id !== interaction.client.config.developer.tokioshy) {
            const embed = new EmbedBuilder()
                .setTitle("❌ Access Denied")
                .setDescription(
                    "You don't have permission to use this command!"
                )
                .setColor("#ff0000")
                .setTimestamp();

            return interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
        }

        await interaction.deferReply();

        const targetUser = interaction.options.getUser("user");
        const xpAmount = interaction.options.getInteger("amount");
        const guildId = interaction.guild.id;

        try {
            const beforeData = await getUserXP(targetUser.id, guildId);

            const newTotalXP = await addUserXP(
                targetUser.id,
                guildId,
                xpAmount
            );

            const afterData = await getUserXP(targetUser.id, guildId);

            const isAdding = xpAmount >= 0;
            const action = isAdding ? "Added" : "Subtracted";
            const actionColor = isAdding ? "#00ff00" : "#ff9900";
            const actionEmoji = isAdding ? "➕" : "➖";

            const embed = new EmbedBuilder()
                .setTitle(`${actionEmoji} XP ${action} Successfully`)
                .setDescription(
                    `Successfully ${
                        isAdding ? "added" : "subtracted"
                    } ${Math.abs(xpAmount).toLocaleString()} XP ${
                        isAdding ? "to" : "from"
                    } ${targetUser}`
                )
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
                            xpAmount >= 0 ? "+" : ""
                        }${xpAmount.toLocaleString()}\n**Levels:** ${
                            afterData.level >= beforeData.level ? "+" : ""
                        }${afterData.level - beforeData.level}`,
                        inline: true,
                    }
                )
                .setColor(actionColor)
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp()
                .setFooter({
                    text: `Command executed by ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL(),
                });

            if (afterData.level !== beforeData.level) {
                const levelChange = afterData.level - beforeData.level;
                if (levelChange > 0) {
                    embed.addFields({
                        name: "🎉 Level Up!",
                        value: `${
                            targetUser.username
                        } gained ${levelChange} level${
                            levelChange > 1 ? "s" : ""
                        }!`,
                        inline: false,
                    });
                } else {
                    embed.addFields({
                        name: "📉 Level Down",
                        value: `${targetUser.username} lost ${Math.abs(
                            levelChange
                        )} level${Math.abs(levelChange) > 1 ? "s" : ""}`,
                        inline: false,
                    });
                }
            }

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error("Error adding user XP:", error);

            const errorEmbed = new EmbedBuilder()
                .setTitle("❌ Error")
                .setDescription(
                    "An error occurred while modifying the user's XP."
                )
                .setColor("#ff0000")
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};
