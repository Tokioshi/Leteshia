const {
    handleBuyButton,
    handleAskButton,
    handleDoneButton,
    handleCloseButton,
    handleBuyModal,
    handleAskModal,
    handleDoneModal,
} = require("../../utils/ticket");
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
        }
    },
};
