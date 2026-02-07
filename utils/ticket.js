const {
    EmbedBuilder,
    ChannelType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    LabelBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    MessageFlags,
    PermissionFlagsBits,
} = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const chalk = require("chalk");

async function handleBuyButton(interaction) {
    interaction.showModal(
        new ModalBuilder()
            .setTitle("Form Ticket")
            .setCustomId("buy")
            .addLabelComponents(
                new LabelBuilder()
                    .setLabel("Read Terms and Conditions")
                    .setStringSelectMenuComponent(createSnKSelectMenu()),
                new LabelBuilder()
                    .setLabel("Service To Buy")
                    .setStringSelectMenuComponent(createServiceSelectMenu()),
            ),
    );
}

async function handleAskButton(interaction) {
    interaction.showModal(
        new ModalBuilder()
            .setTitle("Form Ticket")
            .setCustomId("ask")
            .addLabelComponents(
                new LabelBuilder()
                    .setLabel("What You Want To Ask")
                    .setStringSelectMenuComponent(createAskSelectMenu()),
            ),
    );
}

async function handleDoneButton(interaction) {
    if (interaction.user.id !== interaction.client.config.developer.tokioshy) {
        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(
                        "This button can only be clicked by Admin! Use the button next to it if you want to delete manually!",
                    ),
            ],
            flags: MessageFlags.Ephemeral,
        });
    }

    interaction.showModal(
        new ModalBuilder()
            .setCustomId("done")
            .setTitle("Ticket Closed")
            .addLabelComponents(
                new LabelBuilder()
                    .setLabel("Reason for Closing the Ticket")
                    .setTextInputComponent(
                        new TextInputBuilder()
                            .setCustomId("reason")
                            .setStyle(TextInputStyle.Paragraph),
                    ),
            ),
    );
}

async function handleCloseButton(interaction) {
    interaction.channel.delete().then(async (channel) => {
        await logTicketDeletion(interaction, channel, "Ticket closed without reason");
        await db.delete(`ticket:owner:${channel.id}`);
    });
}

async function handleBuyModal(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const condition = interaction.fields.getStringSelectValues("s&k")[0];
    const service = interaction.fields.getStringSelectValues("service");

    if (condition === "Not Yet") {
        return interaction.editReply({
            content:
                "https://cdn.discordapp.com/attachments/1370383277029982259/1427620977906421790/16840053903298082133.gif",
        });
    }

    await createTicketChannel(interaction, {
        type: "buy",
        condition,
        service,
        name: `◜buy-${interaction.user.username}◞`,
        topic: `Buy Ticket ${interaction.user}`,
        description: `Below is the information from the form you created before.\`\`\`Service to buy : ${service}\nRead S&K       : ${condition}\`\`\`By this, you are considered to have read the Terms and Conditions of Harmony Hub.`,
    });
}

async function handleAskModal(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const service = interaction.fields.getStringSelectValues("ask");

    await createTicketChannel(interaction, {
        type: "ask",
        service,
        name: `ask-${interaction.user.username}◞`,
        topic: `Ask Ticket ${interaction.user}`,
        description: `Below is the information from the form you created before.\`\`\`Service to ask : ${service}\`\`\`By this, you are considered to have read the Terms and Conditions of Harmony Hub.`,
    });
}

async function handleDoneModal(interaction) {
    const pesan = interaction.fields.getTextInputValue("reason");
    await interaction.reply({ content: "Deleting...", flags: MessageFlags.Ephemeral });

    interaction.channel.delete().then(async (channel) => {
        await logTicketDeletion(interaction, channel, pesan);
        await db.delete(`ticket:owner:${channel.id}`);
    });
}

function createSnKSelectMenu() {
    return new StringSelectMenuBuilder()
        .setCustomId("s&k")
        .setPlaceholder("Select")
        .addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel("Have")
                .setValue("Have")
                .setDescription(
                    "By this, you are considered to have read the Terms and Conditions of Harmony Hub",
                )
                .setEmoji("✅"),
            new StringSelectMenuOptionBuilder()
                .setLabel("Not Yet")
                .setValue("Not Yet")
                .setDescription(
                    "By doing so, you are deemed not to have read the Terms and Conditions.",
                )
                .setEmoji("❌"),
        );
}

function createServiceSelectMenu() {
    return new StringSelectMenuBuilder()
        .setCustomId("service")
        .setPlaceholder("Select")
        .addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel("Bot")
                .setValue("Bot")
                .setDescription("Select this if you want to buy Discord bot service")
                .setEmoji("🤖"),
            new StringSelectMenuOptionBuilder()
                .setLabel("Server")
                .setValue("Server")
                .setDescription("Select this if you want to buy Discord server service")
                .setEmoji("🗃️"),
        );
}

function createAskSelectMenu() {
    return new StringSelectMenuBuilder()
        .setCustomId("ask")
        .setPlaceholder("Select")
        .addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel("Bot")
                .setValue("Bot")
                .setDescription("Select this if you want to ask about Discord bot")
                .setEmoji("🤖"),
            new StringSelectMenuOptionBuilder()
                .setLabel("Server")
                .setValue("Server")
                .setDescription("Select this if you want to ask about Discord server")
                .setEmoji("🗃️"),
        );
}

async function createTicketChannel(interaction, options) {
    await interaction.editReply({
        embeds: [
            new EmbedBuilder()
                .setColor("Yellow")
                .setDescription(
                    "Please be patient! Your ticket is being processed and will be ready in a few seconds...",
                ),
        ],
    });

    try {
        const channel = await interaction.guild.channels.create({
            name: options.name,
            type: ChannelType.GuildText,
            parent: interaction.client.config.channel.parent,
            topic: options.topic,
            permissionOverwrites: [
                {
                    id: interaction.guild.roles.everyone,
                    deny: PermissionFlagsBits.ViewChannel,
                },
                {
                    id: interaction.user.id,
                    allow: PermissionFlagsBits.ViewChannel,
                },
                {
                    id: interaction.client.user.id,
                    allow: PermissionFlagsBits.ViewChannel,
                },
            ],
        });

        const embed = new EmbedBuilder()
            .setTitle(
                options.type === "buy"
                    ? `Ticket for Order Service`
                    : `Ticket for Ask ${options.service}`,
            )
            .setColor("Orange")
            .setDescription(options.description);

        const message = await channel.send({
            content: `${interaction.user}`,
            embeds: [embed],
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("done")
                        .setLabel("Complete")
                        .setEmoji("✅")
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId("close")
                        .setLabel("Close")
                        .setEmoji("🔒")
                        .setStyle(ButtonStyle.Danger),
                ),
            ],
        });
        await message.pin();

        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor("Green")
                    .setDescription(`Ticket successfully created in ${channel}`),
            ],
        });

        await db.set(`ticket:owner:${channel.id}`, interaction.user.id);
    } catch (error) {
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(
                        `Ticket failed to create, please contact <@${interaction.client.config.developer.tokioshy}>`,
                    ),
            ],
        });

        console.error(
            chalk.redBright("[ERROR]"),
            chalk.red(`Failed trying to create channel because: `, error),
        );
    }
}

async function logTicketDeletion(interaction, channel, reason) {
    const user = await db.get(`ticket:owner:${channel.id}`);
    const logChannel = interaction.guild.channels.cache.get(interaction.client.config.channel.logs);

    const embed = new EmbedBuilder()
        .setTitle("Ticket Closed")
        .setColor("Orange")
        .setThumbnail(interaction.user.displayAvatarURL({ extension: "png", size: 512 }))
        .setFields(
            { name: "Ticket Name", value: `${channel.name}`, inline: true },
            { name: "Ticket Owner", value: `<@${user}>`, inline: true },
            {
                name: "Closed By",
                value: `${interaction.user}`,
                inline: true,
            },
            { name: "Reason", value: reason },
        )
        .setFooter({
            text: "That's all",
            iconURL: interaction.client.user.displayAvatarURL({
                extension: "png",
                size: 512,
            }),
        })
        .setTimestamp();

    await logChannel.send({ embeds: [embed] });
}

module.exports = {
    handleBuyButton,
    handleAskButton,
    handleDoneButton,
    handleCloseButton,
    handleBuyModal,
    handleAskModal,
    handleDoneModal,
};
