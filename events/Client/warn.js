const chalk = require("chalk");

module.exports = {
    name: "warn",
    async execute(info) {
        console.warn(chalk.yellow("[CLIENT WARN]"), chalk.white(info));
    },
};
