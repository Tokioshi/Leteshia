const { Events } = require("discord.js");
const chalk = require("chalk");
const Password = require("../../models/Password");

const {
    handleBuyButton,
    handleAskButton,
    handleDoneButton,
    handleCloseButton,
    handleBuyModal,
    handleAskModal,
    handleDoneModal,
} = require("../../utils/ticket");
const {
    handleLofiPause,
    handleLofiNext,
    handleLofiPrevious,
    handleLofiQueue,
    handleLyrics,
} = require("../../utils/lofiControl");
const { handleCommand, handleModal } = require("../../utils/interaction");
const { getPlaylist } = require("../../utils/musicPlayer");

const BUTTON_HANDLERS = {
    buy: handleBuyButton,
    ask: handleAskButton,
    done: handleDoneButton,
    close: handleCloseButton,
    lofi_pause: handleLofiPause,
    lofi_previous: handleLofiPrevious,
    lofi_next: handleLofiNext,
    lofi_queue: handleLofiQueue,
    lofi_lyrics: handleLyrics,
};

const MODAL_HANDLERS = {
    buy: handleBuyModal,
    ask: handleAskModal,
    done: handleDoneModal,
    feedback: handleModal,
    testimoni: handleModal,
    message: handleModal,
};

async function handlePasswordAutocomplete(interaction) {
    try {
        const focusedValue = interaction.options.getFocused();
        const doc = await Password.findOne({ userId: interaction.user.id });
        const entries = doc?.entries || [];

        const filtered = entries
            .map((p) => p.name)
            .filter((name) => name.toLowerCase().includes(focusedValue.toLowerCase()));

        await interaction.respond(filtered.slice(0, 25).map((name) => ({ name, value: name })));
    } catch (error) {
        console.error(chalk.red("[ERROR]"), chalk.white("Password autocomplete error:"), error);
        await interaction.respond([]);
    }
}

async function handleLofiAutocomplete(interaction) {
    if (interaction.options.getSubcommand() !== "play") return;

    const focusedValue = interaction.options.getFocused().toLowerCase();
    const playlist = getPlaylist();

    const filtered = playlist
        .map((song) => song.name)
        .filter((name) => !focusedValue || name.toLowerCase().includes(focusedValue));

    const choices = filtered.slice(0, 25).map((name) => ({
        name: name.length > 100 ? `${name.substring(0, 97)}...` : name,
        value: name,
    }));

    await interaction.respond(choices);
}

const AUTOCOMPLETE_HANDLERS = {
    password: handlePasswordAutocomplete,
    lofi: handleLofiAutocomplete,
};

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isChatInputCommand()) {
            await handleCommand(interaction);
            return;
        }

        if (interaction.isButton()) {
            const handler = BUTTON_HANDLERS[interaction.customId];
            if (handler) await handler(interaction);
            return;
        }

        if (interaction.isModalSubmit()) {
            const handler = MODAL_HANDLERS[interaction.customId];
            if (handler) await handler(interaction);
            return;
        }

        if (interaction.isAutocomplete()) {
            const handler = AUTOCOMPLETE_HANDLERS[interaction.commandName];
            if (!handler) return;

            try {
                await handler(interaction);
            } catch (error) {
                console.error(chalk.red("[ERROR]"), chalk.white("Autocomplete error:"), error);
                await interaction.respond([]);
            }
        }
    },
};
