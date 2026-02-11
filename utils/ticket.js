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
    const config = interaction.client.config.ticket.buy;

    const snKComponent = new LabelBuilder()
        .setLabel("Read Terms and Conditions")
        .setStringSelectMenuComponent(createSnKSelectMenu());

    const serviceComponent = new LabelBuilder()
        .setLabel("Service To Buy")
        .setStringSelectMenuComponent(createServiceSelectMenu(config));

    interaction.showModal(
        new ModalBuilder()
            .setTitle(config.modalTitle)
            .setCustomId(config.customId)
            .addLabelComponents(snKComponent, serviceComponent),
    );
}

async function handleAskButton(interaction) {
    const config = interaction.client.config.ticket.ask;

    const askComponent = new LabelBuilder()
        .setLabel("What You Want To Ask")
        .setStringSelectMenuComponent(createServiceSelectMenu(config));

    interaction.showModal(
        new ModalBuilder()
            .setTitle(config.modalTitle)
            .setCustomId(config.customId)
            .addLabelComponents(askComponent),
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
    await deleteTicket(interaction, "Ticket closed without reason");
}

async function handleBuyModal(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const snKFields = interaction.fields.getStringSelectValues("s&k");
    const serviceFields = interaction.fields.getStringSelectValues("service");

    const condition = snKFields ? snKFields[0] : "Unknown";
    const service = serviceFields ? serviceFields[0] : "Unknown";

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
        description: `Below is the information from the form you created before.\`\`\`Service to buy : ${service}\nRead TOS       : ${condition}\`\`\``,
    });
}

async function handleAskModal(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const askFields = interaction.fields.getStringSelectValues("ask");
    const service = askFields ? askFields[0] : "Unknown";

    await createTicketChannel(interaction, {
        type: "ask",
        service,
        name: `◜ask-${interaction.user.username}◞`,
        topic: `Ask Ticket ${interaction.user}`,
        description: `Below is the information from the form you created before.\`\`\`Service to ask : ${service}\`\`\``,
    });
}

async function handleDoneModal(interaction) {
    const pesan = interaction.fields.getTextInputValue("reason");
    await interaction.reply({ content: "Deleting...", flags: MessageFlags.Ephemeral });
    await deleteTicket(interaction, pesan);
}

async function deleteTicket(interaction, reason) {
    const channel = interaction.channel;

    if (!channel) return;

    interaction.channel
        .delete()
        .then(async (channel) => {
            await logTicketDeletion(interaction, channel, reason);
            await db.delete(`ticket:owner:${channel.id}`);
        })
        .catch((error) => {
            console.error(chalk.red("Failed to delete ticket channel: ", error));
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

function createServiceSelectMenu(config) {
    const menu = new StringSelectMenuBuilder()
        .setCustomId(config.serviceCustomId)
        .setPlaceholder(config.selectPlaceholder);

    const options = config.options.map((opt) =>
        new StringSelectMenuOptionBuilder()
            .setLabel(opt.label)
            .setValue(opt.value)
            .setDescription(opt.description)
            .setEmoji(opt.emoji),
    );

    return menu.addOptions(options);
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

        const embedTitle =
            options.type === "buy"
                ? "Ticket for Order Service"
                : `Ticket for Ask ${options.service}`;

        const embed = new EmbedBuilder()
            .setTitle(embedTitle)
            .setColor("Orange")
            .setDescription(options.description);

        const components = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("done")
                .setLabel("Complete")
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId("close")
                .setLabel("Close")
                .setStyle(ButtonStyle.Danger),
        );

        const message = await channel.send({
            content: `${interaction.user}`,
            embeds: [embed],
            components: [components],
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

    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setTitle("Ticket Closed")
        .setColor("Orange")
        .setThumbnail(interaction.user.displayAvatarURL({ extension: "png", size: 512 }))
        .setFields(
            { name: "Ticket Name", value: `${channel.name}`, inline: true },
            { name: "Ticket Owner", value: user ? `<@${user}>` : "Unknown", inline: true },
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
