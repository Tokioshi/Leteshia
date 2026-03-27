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
} = require("../../utils/lofiControl");
const { handleCommand, handleModal } = require("../../utils/interaction");
const { Events } = require("discord.js");

const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isChatInputCommand()) {
            await handleCommand(interaction);
        }

        if (interaction.isButton()) {
            const { customId } = interaction;
            const buttonHandlers = {
                buy: handleBuyButton,
                ask: handleAskButton,
                done: handleDoneButton,
                close: handleCloseButton,
                lofi_pause: handleLofiPause,
                lofi_previous: handleLofiPrevious,
                lofi_next: handleLofiNext,
                lofi_queue: handleLofiQueue,
            };

            if (buttonHandlers[customId]) {
                await buttonHandlers[customId](interaction);
            }
        }

        if (interaction.isModalSubmit()) {
            const { customId } = interaction;
            const modalHandlers = {
                buy: handleBuyModal,
                ask: handleAskModal,
                done: handleDoneModal,
                feedback: handleModal,
                testimoni: handleModal,
            };

            if (modalHandlers[customId]) {
                await modalHandlers[customId](interaction);
            }
        }

        if (interaction.isAutocomplete()) {
            const command = interaction.commandName;

            if (command === "password") {
                const focusedValue = interaction.options.getFocused();
                const userId = interaction.user.id;
                const dbKey = `password:${userId}`;

                const passwords = (await db.get(dbKey)) || [];
                const choices = passwords.map((p) => p.name);

                const filtered = choices.filter((choice) =>
                    choice.toLowerCase().includes(focusedValue.toLowerCase()),
                );

                await interaction.respond(
                    filtered.slice(0, 25).map((choice) => ({ name: choice, value: choice })),
                );
            }

            if (command === "lofi") {
                const focusedValue = interaction.options.getFocused();
                const subcommand = interaction.options.getSubcommand();

                if (subcommand !== "play") return;

                try {
                    const playlist = require("../../utils/musicPlayer").getPlaylist();
                    let choices = playlist.map((song) => song.name);

                    if (focusedValue) {
                        const lowerFocused = focusedValue.toLowerCase();
                        choices = choices.filter((name) =>
                            name.toLowerCase().includes(lowerFocused),
                        );
                    }

                    const responseChoices = choices.slice(0, 25).map((name) => ({
                        name: name.length > 100 ? name.substring(0, 97) + "..." : name,
                        value: name,
                    }));

                    await interaction.respond(responseChoices);
                } catch (error) {
                    console.error(chalk.red("[ERROR]"), chalk.white("Autocomplete error:"), error);
                    await interaction.respond([]);
                }
            }
        }
    },
};
