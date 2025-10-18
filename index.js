const {
    Client,
    GatewayIntentBits,
    ActivityType,
    Collection,
    EmbedBuilder,
} = require("discord.js");
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
        console.log(
            chalk.red("[SHUTDOWN]"),
            chalk.white("Shutting down bot...")
        );
        try {
            this.channels.cache.get(this.config.channel.botLogs).send({
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({
                            name: `${this.user.username} is shutting down`,
                            iconURL: this.user.displayAvatarURL({
                                size: 512,
                            }),
                        })
                        .setColor("Red")
                        .setTitle("Pematian Sistem Telah Dimulai")
                        .setDescription(
                            `Bot sedang memulai proses shutdown. Hal ini dapat terjadi karena beberapa alasan, termasuk restart terjadwal atau perintah manual dari pengembang.\n\nHarap diperhatikan bahwa bot akan tidak tersedia untuk beberapa saat.`
                        )
                        .addFields(
                            {
                                name: "Status",
                                value: "Beralih ke mode offline...",
                                inline: true,
                            },
                            {
                                name: "Timestamp",
                                value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
                                inline: true,
                            }
                        )
                        .setFooter({ text: "Pemberitahuan Sistem" })
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
