const { REST, Routes } = require("discord.js");
const chalk = require("chalk");

module.exports = async (client) => {
    const commands = [];
    const failedCommands = [];

    for (const [name, command] of client.commands) {
        try {
            if (!command.data) {
                console.warn(
                    chalk.yellow("[WARNING]"),
                    chalk.white(`Command ${name} is missing a data property`),
                );
                failedCommands.push(name);
                continue;
            }
            commands.push(command.data.toJSON());
        } catch (error) {
            console.error(
                chalk.red("[ERROR]"),
                chalk.white(`Failed to serialize command ${name}: ${error.message}`),
            );
            failedCommands.push(name);
        }
    }

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

    const rest = new REST({ version: "10" }).setToken(process.env.CLIENT_TOKEN);

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
