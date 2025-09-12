const {
    Client,
    GatewayIntentBits,
    ActivityType,
    Collection,
    Partials,
    EmbedBuilder,
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
            this.channels.cache.get(this.config.channel.logs).send({
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({
                            name: `${this.user.username} is shutting down`,
                            iconURL: this.user.displayAvatarURL({
                                extension: "png",
                                size: 512,
                            }),
                        })
                        .setColor(this.config.embed.fail)
                        .setTitle("System Shutdown Initiated")
                        .setDescription(
                            `The bot is beginning the shutdown process. This can happen for several reasons, including a scheduled restart or a manual command from a developer.\n\nPlease be aware that the bot will be unavailable for a few moments.`
                        )
                        .addFields(
                            {
                                name: "Status",
                                value: "Preparing to go offline...",
                                inline: true,
                            },
                            {
                                name: "Timestamp",
                                value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
                                inline: true,
                            }
                        )
                        .setFooter({ text: "System Notification" })
                        .setTimestamp(),
                ],
            });

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
