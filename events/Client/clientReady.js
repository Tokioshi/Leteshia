const { Events } = require("discord.js");
const { initMusicPlayer } = require("../../utils/musicPlayer");
const { updateLiveReport } = require("../../utils/getExchange");
const chalk = require("chalk");
const cron = require("node-cron");

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(
            chalk.magenta("[READY]"),
            chalk.white(`Connected as ${chalk.italic(client.user.tag)}!`),
        );

        let isUpdatingExchangeRate = false;

        const runExchangeRateUpdate = async () => {
            if (isUpdatingExchangeRate) return;

            isUpdatingExchangeRate = true;

            try {
                await updateLiveReport(client);
            } catch (error) {
                console.error("[ExchangeRate] Update failed:", error.message);
            } finally {
                isUpdatingExchangeRate = false;
            }
        };

        await runExchangeRateUpdate();

        cron.schedule("20 7 * * *", runExchangeRateUpdate, {
            timezone: "Asia/Jakarta",
            noOverlap: true,
        });

        if (client.config.playLofi) {
            await initMusicPlayer(client);
        }
    },
};
