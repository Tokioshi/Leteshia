const { Events } = require("discord.js");
const chalk = require("chalk");
const { initMusicPlayer } = require("../../utils/musicPlayer");

module.exports = {
    name: Events.ClientReady,
    async execute(client) {
        console.log(
            chalk.magenta("[READY]"),
            chalk.white(`Connected as ${chalk.italic(client.user.tag)}!`),
        );

        await initMusicPlayer(client);
    },
};
