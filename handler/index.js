const fs = require("node:fs");
const path = require("node:path");
const chalk = require("chalk");
const registerCommands = require("./commands");

module.exports = async (client) => {
    const commandsPath = path.join(__dirname, "../commands");
    const eventsPath = path.join(__dirname, "../events");

    function readFilesRecursively(dir, callback, fileType = ".js") {
        try {
            if (!fs.existsSync(dir)) {
                console.warn(
                    chalk.yellow("[WARNING]"),
                    chalk.white(`Directory ${dir} does not exist`)
                );
                return;
            }

            const files = fs.readdirSync(dir);

            for (const file of files) {
                const filePath = path.join(dir, file);

                try {
                    const stat = fs.statSync(filePath);

                    if (stat.isDirectory()) {
                        readFilesRecursively(filePath, callback, fileType);
                    } else if (file.endsWith(fileType)) {
                        callback(filePath);
                    }
                } catch (error) {
                    console.error(
                        chalk.red("[ERROR]"),
                        chalk.white(
                            `Failed to process file ${filePath}: ${error.message}`
                        )
                    );
                }
            }
        } catch (error) {
            console.error(
                chalk.red("[ERROR]"),
                chalk.white(`Failed to read directory ${dir}: ${error.message}`)
            );
        }
    }

    function loadCommand(filePath) {
        try {
            delete require.cache[require.resolve(filePath)];
            const command = require(filePath);

            if ("data" in command && "execute" in command) {
                command.path = filePath;
                client.commands.set(command.data.name, command);
            } else {
                console.log(
                    chalk.yellow("[WARNING]"),
                    chalk.white(
                        `The command at ${filePath} is missing a required "data" or "execute" property.`
                    )
                );
            }
        } catch (error) {
            console.error(
                chalk.red("[ERROR]"),
                chalk.white(
                    `Failed to load command from ${filePath}: ${error.message}`
                )
            );
        }
    }

    function loadEvent(filePath) {
        try {
            delete require.cache[require.resolve(filePath)];
            const event = require(filePath);

            if (!event.name || !event.execute) {
                console.log(
                    chalk.yellow("[WARNING]"),
                    chalk.white(
                        `The event at ${filePath} is missing a required "name" or "execute" property.`
                    )
                );
                return;
            }

            if (event.once) {
                client.once(event.name, (...args) => {
                    try {
                        event.execute(...args);
                    } catch (error) {
                        console.error(
                            chalk.red("[ERROR]"),
                            chalk.white(
                                `Event ${event.name} execution failed: ${error}`
                            )
                        );
                    }
                });
            } else {
                client.on(event.name, (...args) => {
                    try {
                        event.execute(...args);
                    } catch (error) {
                        console.error(
                            chalk.red("[ERROR]"),
                            chalk.white(
                                `Event ${event.name} execution failed: ${error}`
                            )
                        );
                    }
                });
            }
        } catch (error) {
            console.error(
                chalk.red("[ERROR]"),
                chalk.white(
                    `Failed to load event from ${filePath}: ${error.message}`
                )
            );
        }
    }

    client.once("clientReady", async () => {
        try {
            await registerCommands(client);
        } catch (error) {
            console.error(
                chalk.red("[ERROR]"),
                chalk.white("Failed to register commands:", error)
            );
        }
    });

    console.log(chalk.cyan("[INFO]"), chalk.white("Loading commands..."));
    readFilesRecursively(commandsPath, loadCommand);
    console.log(
        chalk.green("[SUCCESS]"),
        chalk.white(`Loaded ${client.commands.size} commands`)
    );

    console.log(chalk.cyan("[INFO]"), chalk.white("Loading events..."));
    readFilesRecursively(eventsPath, loadEvent);
    console.log(
        chalk.green("[SUCCESS]"),
        chalk.white("Events loaded successfully")
    );
};
