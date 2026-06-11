require("dotenv").config({ quiet: true });
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const chalk = require("chalk");
const mongoose = require("mongoose");
const path = require("node:path");
const dns = require("node:dns");

const requiredEnv = ["MONGO_URI", "CLIENT_TOKEN"];
const missingEnv = requiredEnv.filter((env) => !process.env[env]);
if (missingEnv.length > 0) {
    console.error(
        chalk.red("[CRITICAL]"),
        `Missing environment variables: ${missingEnv.join(", ")}`,
    );
    process.exit(1);
}

dns.setServers(["8.8.8.8", "8.8.4.4"]); // Workaround: default DNS fails to resolve MongoDB Atlas hostnames in this environment

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
        });

        this.config = null;
        this.commands = new Collection();
        this.snipes = new Collection();

        try {
            this.loadConfig();
            this.loadHandlers();
        } catch (error) {
            console.error(chalk.red("[INIT ERROR]"), "Failed during constructor setup:", error);
            process.exit(1);
        }
    }

    loadConfig() {
        try {
            const configPath = path.resolve(__dirname, "./config");
            this.config = require(configPath);
        } catch (error) {
            console.error(chalk.red("[CONFIG ERROR]"), "Failed to load config:", error);
            process.exit(1);
        }
    }

    reloadConfig() {
        const configPath = path.resolve(__dirname, "./config");
        delete require.cache[require.resolve(configPath)];
        this.loadConfig();
    }

    loadHandlers() {
        try {
            require("./handler")(this);
        } catch (error) {
            console.error(chalk.red("[HANDLER ERROR]"), "Failed to load handlers:", error);
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
            console.error(chalk.red("[LOGIN ERROR]"), chalk.white("Login failed:"), error);
            process.exit(1);
        }
    }

    async shutdown() {
        console.log(chalk.red("[SHUTDOWN]"), chalk.white("Shutting down bot..."));
        try {
            if (mongoose.connection.readyState === 1) {
                await mongoose.disconnect();
                console.log(
                    chalk.green("[DATABASE]"),
                    chalk.white("MongoDB disconnected cleanly."),
                );
            }

            this.destroy();
            process.exit(0);
        } catch (error) {
            console.error(chalk.red("[ERROR]"), chalk.white("Error during shutdown:"), error);
            process.exit(1);
        }
    }
}

const client = new Bot();

process.on("SIGINT", () => client.shutdown());
process.on("SIGTERM", () => client.shutdown());

process.on("unhandledRejection", (error) => {
    console.error(chalk.red("[UNHANDLED REJECTION]"), error);
});

process.on("uncaughtException", (error) => {
    console.error(chalk.red("[UNCAUGHT EXCEPTION]"), error);
    process.exit(1);
});

client.init();
