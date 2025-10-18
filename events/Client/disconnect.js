const chalk = require("chalk");

module.exports = {
    name: "disconnect",
    async execute(client, event) {
        const chalk = require("chalk");

        console.warn(
            chalk.yellow("[DISCONNECT]"),
            chalk.white(
                `Connection lost! Code: ${chalk.yellow(
                    event.code
                )} - Reason: ${chalk.cyan(event.reason)}`
            )
        );
    },
};
