const {
    Client,
    GatewayIntentBits,
    ActivityType,
    Collection,
    Partials,
} = require("discord.js");
const chalk = require("chalk");

class Bot extends Client {
    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.GuildPresences,
                GatewayIntentBits.GuildInvites,
            ],
            presence: {
                activities: [
                    {
                        type: ActivityType.Listening,
                        name: "Your Order!",
                    },
                ],
            },
            partials: [Partials.Message, Partials.Channel, Partials.Reaction],
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

    loadHandlers() {
        try {
            require("./handler/index")(this);
            require("./handler/player")(this);
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
        console.log(
            chalk.red("[SHUTDOWN]"),
            chalk.white("Shutting down bot...")
        );
        try {
            await this.destroy();
            process.exit(0);
        } catch (error) {
            console.error(
                chalk.red("[ERROR]"),
                chalk.white("Error during shutdown: ", error.message)
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
