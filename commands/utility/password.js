const {
    SlashCommandBuilder,
    InteractionContextType,
    MessageFlags,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
} = require("discord.js");
const Password = require("../../models/Password");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("password")
        .setDescription("Manange your own password with me!")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("add")
                .setDescription("Add new password to your account")
                .addStringOption((opt) =>
                    opt.setName("name").setDescription("Name of the password").setRequired(true),
                )
                .addStringOption((opt) =>
                    opt.setName("password").setDescription("Your password").setRequired(true),
                ),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("find")
                .setDescription("Find your password by its name")
                .addStringOption((opt) =>
                    opt
                        .setName("name")
                        .setDescription("Name of the password")
                        .setRequired(true)
                        .setAutocomplete(true),
                ),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("remove")
                .setDescription("Remove your password by its name")
                .addStringOption((opt) =>
                    opt
                        .setName("name")
                        .setDescription("Name of the password")
                        .setRequired(true)
                        .setAutocomplete(true),
                ),
        )
        .addSubcommand((subcommand) =>
            subcommand.setName("list").setDescription("List all your password"),
        )
        .setContexts(InteractionContextType.Guild),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;

        if (subcommand === "add") {
            const name = interaction.options.getString("name");
            const password = interaction.options.getString("password");

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            try {
                const doc = await Password.findOne({ userId });
                const entries = doc?.entries || [];

                if (entries.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
                    return interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(
                                    `A password with the name **${name}** already exists!`,
                                ),
                        ],
                    });
                }

                await Password.findOneAndUpdate(
                    { userId },
                    { $push: { entries: { name, password, createdAt: Date.now() } } },
                    { upsert: true, returnDocument: "after" },
                );

                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("Green")
                            .setDescription(`Successfully added password **${name}**!`),
                    ],
                });
            } catch (error) {
                console.error("[Password] add error:", error);
                return interaction.editReply({ content: "An error occurred. Please try again." });
            }
        }

        if (subcommand === "find") {
            const name = interaction.options.getString("name");

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            try {
                const doc = await Password.findOne({ userId });
                const entries = doc?.entries || [];
                const result = entries.find((p) => p.name.toLowerCase() === name.toLowerCase());

                if (!result) {
                    return interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`No password found with the name **${name}**.`),
                        ],
                    });
                }

                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("Blue")
                            .setTitle(result.name)
                            .setDescription(`\`\`\`\n${result.password}\`\`\``),
                    ],
                });
            } catch (error) {
                console.error("[Password] find error:", error);
                return interaction.editReply({ content: "An error occurred. Please try again." });
            }
        }

        if (subcommand === "remove") {
            const name = interaction.options.getString("name");

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            try {
                const doc = await Password.findOne({ userId });
                const entries = doc?.entries || [];
                const initialLength = entries.length;
                const filtered = entries.filter((p) => p.name.toLowerCase() !== name.toLowerCase());

                if (filtered.length === initialLength) {
                    return interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(
                                    `No password found with the name **${name}** to remove.`,
                                ),
                        ],
                    });
                }

                await Password.findOneAndUpdate(
                    { userId },
                    { $set: { entries: filtered } },
                    { returnDocument: "after" },
                );

                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("Green")
                            .setDescription(`Successfully removed password **${name}**!`),
                    ],
                });
            } catch (error) {
                console.error("[Password] remove error:", error);
                return interaction.editReply({ content: "An error occurred. Please try again." });
            }
        }

        if (subcommand === "list") {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            try {
                const doc = await Password.findOne({ userId });
                const passwords = doc?.entries || [];

                if (passwords.length === 0) {
                    return interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("Red")
                                .setDescription("You don't have any passwords stored."),
                        ],
                    });
                }

                const itemsPerPage = 10;
                const totalPages = Math.ceil(passwords.length / itemsPerPage);
                let currentPage = 0;

                const generateEmbed = (page) => {
                    const start = page * itemsPerPage;
                    const end = start + itemsPerPage;
                    const currentPasswords = passwords.slice(start, end);
                    const description = currentPasswords
                        .map(
                            (p, index) => `${start + index + 1}. **${p.name}** : ||${p.password}||`,
                        )
                        .join("\n");
                    return new EmbedBuilder()
                        .setTitle("Your Passwords")
                        .setDescription(description)
                        .setFooter({ text: `Page ${page + 1} of ${totalPages}` })
                        .setColor("Blue");
                };

                const generateRow = (page) => {
                    return new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId("prev")
                            .setLabel("Previous")
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page === 0),
                        new ButtonBuilder()
                            .setCustomId("next")
                            .setLabel("Next")
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page === totalPages - 1),
                    );
                };

                const response = await interaction.editReply({
                    embeds: [generateEmbed(currentPage)],
                    components: totalPages > 1 ? [generateRow(currentPage)] : [],
                });

                if (totalPages > 1) {
                    const collector = response.createMessageComponentCollector({
                        componentType: ComponentType.Button,
                        time: 60000,
                    });

                    collector.on("collect", async (i) => {
                        if (i.customId === "prev") {
                            if (currentPage > 0) currentPage--;
                        } else if (i.customId === "next") {
                            if (currentPage < totalPages - 1) currentPage++;
                        }
                        await i.update({
                            embeds: [generateEmbed(currentPage)],
                            components: [generateRow(currentPage)],
                        });
                    });

                    collector.on("end", async () => {
                        const disabledRow = generateRow(currentPage);
                        disabledRow.components.forEach((btn) => btn.setDisabled(true));
                        try {
                            await interaction.editReply({ components: [disabledRow] });
                        } catch (e) {}
                    });
                }
            } catch (error) {
                console.error("[Password] list error:", error);
                return interaction.editReply({ content: "An error occurred. Please try again." });
            }
        }
    },
};
