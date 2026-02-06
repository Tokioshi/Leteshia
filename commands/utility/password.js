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
const { QuickDB } = require("quick.db");
const db = new QuickDB();

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
                .setDescription("Find your password by it's name")
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
                .setDescription("Remove your password by it's name")
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
        const dbKey = `password:${userId}`;

        if (subcommand === "add") {
            const name = interaction.options.getString("name");
            const password = interaction.options.getString("password");

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            let passwords = (await db.get(dbKey)) || [];

            if (passwords.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("Red")
                            .setDescription(`A password with the name **${name}** already exists!`),
                    ],
                });
            }

            passwords.push({ name, password, createdAt: Date.now() });
            await db.set(dbKey, passwords);

            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Green")
                        .setDescription(`Successfully added password **${name}**!`),
                ],
            });
        }

        if (subcommand === "find") {
            const name = interaction.options.getString("name");

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const passwords = (await db.get(dbKey)) || [];
            const result = passwords.find((p) => p.name.toLowerCase() === name.toLowerCase());

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
                content: `**${result.name}** : ||${result.password}||`,
            });
        }

        if (subcommand === "remove") {
            const name = interaction.options.getString("name");

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            let passwords = (await db.get(dbKey)) || [];
            const initialLength = passwords.length;

            passwords = passwords.filter((p) => p.name.toLowerCase() !== name.toLowerCase());

            if (passwords.length === initialLength) {
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

            await db.set(dbKey, passwords);

            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Green")
                        .setDescription(`Successfully removed password **${name}**!`),
                ],
            });
        }

        if (subcommand === "list") {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const passwords = (await db.get(dbKey)) || [];

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
                    .map((p, index) => `${start + index + 1}. **${p.name}** : ||${p.password}||`)
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
        }
    },
};
