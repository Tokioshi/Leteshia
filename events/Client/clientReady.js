const { Events } = require("discord.js");
const chalk = require("chalk");
const { initMusicPlayer } = require("../../utils/musicPlayer");
const { updateLiveReport } = require("../../utils/getExchange");

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(
            chalk.magenta("[READY]"),
            chalk.white(`Connected as ${chalk.italic(client.user.tag)}!`),
        );

        await updateLiveReport(client);

        setInterval(
            () => {
                updateLiveReport(client);
            },
            30 * 60 * 1000,
        );

        if (client.config.playLofi) {
            await initMusicPlayer(client);
        }
    },
};
