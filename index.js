const { Client, GatewayIntentBits, ActivityType, Collection } = require("discord.js");
const chalk = require("chalk");

class Bot extends Client {
    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildPresences,
            ],
            presence: {
                activities: [
                    {
                        type: ActivityType.Listening,
                        name: "Your Order!",
                    },
                ],
            },
        });

        this.commands = new Collection();

        this.inviteCache = new Map();

        this.loadConfig();
        this.loadHandlers();
    }

    loadConfig() {
        try {
            this.config = require("./config");

            if (!this.config?.token) {
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
            require("./handler/index")(this);
        } catch (error) {
            console.error("Failed to load handlers: ", error);
            throw error;
        }
    }

    async init() {
        try {
            await this.login(this.config.token);
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
