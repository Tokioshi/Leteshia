const chalk = require("chalk");

module.exports = {
    name: "error",
    async execute(error) {
        console.error(
            chalk.red.bold("[CLIENT ERROR]"),
            chalk.white("Client encountered a fatal error: "),
            error.message || error,
        );
    },
};
