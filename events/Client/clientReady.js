const { Events } = require("discord.js");
const chalk = require("chalk");

module.exports = {
    name: Events.ClientReady,
    async execute(client) {
        console.log(
            chalk.magenta("[READY]"),
            chalk.white(`Connected as ${chalk.italic(client.user.tag)}!`),
        );
    },
};
