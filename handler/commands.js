const { REST, Routes } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const chalk = require("chalk");

module.exports = async (client) => {
    const commandsPath = path.join(__dirname, "../commands");
    const commands = [];
    const failedCommands = [];

    function readCommands(dir) {
        try {
            if (!fs.existsSync(dir)) {
                console.error(
                    chalk.red("[ERROR]"),
                    chalk.white(`Commands directory ${dir} does not exist`),
                );
                return;
            }

            const files = fs.readdirSync(dir);

            for (const file of files) {
                const filePath = path.join(dir, file);

                try {
                    const stat = fs.statSync(filePath);

                    if (stat.isDirectory()) {
                        readCommands(filePath);
                    } else if (file.endsWith(".js")) {
                        try {
                            const command = require(filePath);

                            if (!command.data) {
                                console.warn(
                                    chalk.yellow("[WARNING]"),
                                    chalk.white(`Command at ${filePath} missing data property`),
                                );
                                failedCommands.push(filePath);
                                continue;
                            }

                            commands.push(command.data.toJSON());
                        } catch (error) {
                            console.error(
                                chalk.red("[ERROR]"),
                                chalk.white(`Failed to load command ${filePath}: ${error.message}`),
                            );
                            failedCommands.push(filePath);
                        }
                    }
                } catch (error) {
                    console.error(
                        chalk.red("[ERROR]"),
                        chalk.white(`Failed to process file ${filePath}: ${error.message}`),
                    );
                }
            }
        } catch (error) {
            console.error(
                chalk.red("[ERROR]"),
                chalk.white(`Failed to read directory ${dir}: ${error.message}`),
            );
        }
    }

    readCommands(commandsPath);

    if (commands.length === 0) {
        console.error(chalk.red("[ERROR]"), chalk.white("No valid commands found to deploy"));
        return;
    }

    if (failedCommands.length > 0) {
        console.warn(
            chalk.yellow("[WARNING]"),
            chalk.white(`${failedCommands.length} commands failed to load`),
        );
    }

    if (!client.user?.id) {
        console.error(
            chalk.red("[ERROR]"),
            chalk.white("Client user ID not available. Make sure bot is logged in."),
        );
        return;
    }

    const rest = new REST({ version: "10" }).setToken(client.config.token);

    try {
        console.log(
            chalk.cyan("[INFO]"),
            chalk.white(`Started refreshing ${commands.length} application (/) commands`),
        );

        const data = await rest.put(Routes.applicationCommands(client.user.id), { body: commands });

        console.log(
            chalk.green("[SUCCESS]"),
            chalk.white(`Successfully reloaded ${data.length} application (/) commands`),
        );

        if (failedCommands.length > 0) {
            console.log(
                chalk.yellow("[WARNING]"),
                chalk.white(`Note: ${failedCommands.length} commands failed to load`),
            );
        }
    } catch (error) {
        console.error(chalk.red("[ERROR]"), chalk.white("Failed to refresh application commands"));

        if (error.code === 50001) {
            console.error(
                chalk.red("[ERROR]"),
                chalk.white("Missing Access - Bot may not have necessary permissions"),
            );
        } else if (error.code === 10002) {
            console.error(
                chalk.red("[ERROR]"),
                chalk.white("Unknown Application - Invalid application ID"),
            );
        } else if (error.status === 429) {
            console.error(chalk.red("[ERROR]"), chalk.white("Rate Limited - Too many requests"));
        } else {
            console.error(chalk.red("[ERROR]"), chalk.white(error.message || error));
        }
    }
};
