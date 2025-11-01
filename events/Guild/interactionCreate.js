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
    },
};
