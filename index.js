const { Client, GatewayIntentBits, ActivityType, Collection } = require("discord.js");
const chalk = require("chalk");
const mongoose = require("mongoose");
require("dotenv").config();

const dns = require("node:dns"); // Optional, if you don't have google dns on your operating system ...
dns.setServers(["8.8.8.8", "8.8.4.4"]); // ... Or got any error when connecting to the database.

class Bot extends Client {
    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildPresences,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
            ],
            presence: {
                activities: [
                    {
                        type: ActivityType.Custom,
                        name: "custom",
                        state: "Please Get a Job!",
                    },
                ],
            },
        });

        this.commands = new Collection();
        this.snipes = new Collection();

        this.loadConfig();
        this.loadHandlers();
    }

    loadConfig() {
        try {
            this.config = require("./config");

            if (!process.env.CLIENT_TOKEN) {
                throw new Error("Bot token is required in config");
            }
        } catch (error) {
            console.error("Failed to load config: ", error);
            process.exit(1);
        }
    }

    reloadConfig() {
        delete require.cache[require.resolve("./config")];
        this.config = require("./config");
    }

    loadHandlers() {
        try {
            require("./handler")(this);
        } catch (error) {
            console.error("Failed to load handlers: ", error);
            throw error;
        }
    }

    async init() {
        try {
            await mongoose.connect(process.env.MONGO_URI);
            console.log(chalk.green("[DATABASE]"), chalk.white("MongoDB connected successfully"));
        } catch (error) {
            console.error(
                chalk.red("[DATABASE]"),
                chalk.white("MongoDB connection failed:"),
                error,
            );
            process.exit(1);
        }

        try {
            await this.login(process.env.CLIENT_TOKEN);
        } catch (error) {
            console.error("Login failed: ", error);
            process.exit(1);
        }
    }

    async shutdown() {
        console.log(chalk.red("[SHUTDOWN]"), chalk.white("Shutting down bot..."));
        try {
            await this.destroy();
            process.exit(0);
        } catch (error) {
            console.error(
                chalk.red("[ERROR]"),
                chalk.white("Error during shutdown: ", error.message),
            );
            process.exit(1);
        }
    }
}

const client = new Bot();

process.on("SIGINT", () => client.shutdown());
process.on("SIGTERM", () => client.shutdown());
process.on("unhandledRejection", (error) => {
    console.error("Unhandled promise rejection: ", error);
});

client.init();

module.exports = client;
