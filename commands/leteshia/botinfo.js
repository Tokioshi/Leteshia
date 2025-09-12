const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    version: discordJsVersion,
} = require("discord.js");
const os = require("os");
const process = require("process");

function formatBytes(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function formatSeconds(sec) {
    sec = Math.floor(sec);
    const d = Math.floor(sec / 86400);
    sec %= 86400;
    const h = Math.floor(sec / 3600);
    sec %= 3600;
    const m = Math.floor(sec / 60);
    sec %= 60;
    const parts = [];
    if (d) parts.push(`${d}d`);
    if (h) parts.push(`${h}h`);
    if (m) parts.push(`${m}m`);
    if (sec || parts.length === 0) parts.push(`${sec}s`);
    return parts.join(" ");
}

function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
}

async function sampleProcessCpu(ms = 1000) {
    try {
        const startUsage = process.cpuUsage();
        const startTime = process.hrtime.bigint();

        await new Promise((resolve) => setTimeout(resolve, ms));

        const elapUsage = process.cpuUsage(startUsage);
        const elapTime = Number(process.hrtime.bigint() - startTime) / 1000000;

        const cpuMs = (elapUsage.user + elapUsage.system) / 1000;
        return Math.min(100, (cpuMs / elapTime) * 100).toFixed(1);
    } catch (error) {
        console.error("Error sampling CPU:", error);
        return "N/A";
    }
}

function getStatusColor(cpuPercent, memPercent) {
    const cpu = parseFloat(cpuPercent) || 0;
    const mem = parseFloat(memPercent) || 0;

    if (cpu >= 80 || mem >= 90) return 0xff4444;
    if (cpu >= 60 || mem >= 75) return 0xffa500;
    if (cpu >= 40 || mem >= 50) return 0xffff00;
    return 0x00ff88;
}

function getHealthStatus(cpuPercent, memPercent, ping) {
    const cpu = parseFloat(cpuPercent) || 0;
    const mem = parseFloat(memPercent) || 0;
    const wsPing = typeof ping === "number" ? ping : 0;

    if (cpu >= 80 || mem >= 90 || wsPing >= 200) return "🔴 Critical";
    if (cpu >= 60 || mem >= 75 || wsPing >= 150) return "🟠 Warning";
    if (cpu >= 40 || mem >= 50 || wsPing >= 100) return "🟡 Caution";
    return "🟢 Healthy";
}

async function getDetailedBotStats(client) {
    const stats = {
        guilds: client.guilds.cache.size,
        users: client.users.cache.size,
        channels: client.channels.cache.size,
        commands: client.commands ? client.commands.size : 0,
        emojis: client.emojis.cache.size,
        wsPing: client.ws?.ping ?? null,
        readyAt: client.readyAt,
        cachedUsers: client.users.cache.filter((user) => !user.bot).size,
        cachedBots: client.users.cache.filter((user) => user.bot).size,
    };

    try {
        stats.voiceConnections = client.riffy.players.size || 0;
    } catch {
        stats.voiceConnections = 0;
    }

    return stats;
}

function createSystemEmbed(
    cpuInfo,
    memoryInfo,
    procCpuPercent,
    memUsagePercent,
    botStats
) {
    const usedMem = memoryInfo.total - memoryInfo.free;
    const healthStatus = getHealthStatus(
        procCpuPercent,
        memUsagePercent,
        botStats.wsPing
    );

    return new EmbedBuilder()
        .setTitle("🖥️ System Information")
        .setColor(getStatusColor(procCpuPercent, memUsagePercent))
        .addFields(
            {
                name: "📊 Health Status",
                value: healthStatus,
                inline: true,
            },
            {
                name: "🕐 Uptime",
                value: `**Bot**: ${formatSeconds(
                    process.uptime()
                )}\n**System**: ${formatSeconds(os.uptime())}`,
                inline: true,
            },
            {
                name: "⚙️ Environment",
                value: `**OS**: ${os.platform()} ${os.release()}\n**Node.js**: ${
                    process.version
                }\n**Discord.js**: v${discordJsVersion}`,
                inline: true,
            },
            {
                name: "💻 CPU",
                value: `**Model**: ${cpuInfo.model.substring(0, 40)}${
                    cpuInfo.model.length > 40 ? "..." : ""
                }\n**Cores**: ${cpuInfo.cores} (${
                    cpuInfo.arch
                })\n**Usage**: ${procCpuPercent}%\n**Load Avg**: ${cpuInfo.loadAvg
                    .map((n) => n.toFixed(2))
                    .join(" / ")}`,
                inline: false,
            },
            {
                name: "🧠 Memory Usage",
                value: `**System**: ${formatBytes(usedMem)} / ${formatBytes(
                    memoryInfo.total
                )} (${memUsagePercent}%)\n**Process RSS**: ${formatBytes(
                    memoryInfo.process.rss
                )}\n**Heap**: ${formatBytes(
                    memoryInfo.process.heapUsed
                )} / ${formatBytes(
                    memoryInfo.process.heapTotal
                )}\n**External**: ${formatBytes(memoryInfo.process.external)}`,
                inline: true,
            },
            {
                name: "📈 Process Info",
                value: `**PID**: ${process.pid}\n**Parent PID**: ${
                    process.ppid || "N/A"
                }\n**Platform**: ${process.platform}\n**Args**: ${
                    process.argv.length
                }`,
                inline: true,
            }
        )
        .setTimestamp();
}

function createBotEmbed(botStats, client) {
    const readyTime = botStats.readyAt
        ? formatSeconds((Date.now() - botStats.readyAt) / 1000)
        : "N/A";

    return new EmbedBuilder()
        .setTitle("🤖 Bot Statistics")
        .setColor(0x5865f2)
        .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
        .addFields(
            {
                name: "📊 Cache Stats",
                value: `**Guilds**: ${formatNumber(
                    botStats.guilds
                )}\n**Channels**: ${formatNumber(
                    botStats.channels
                )}\n**Users**: ${formatNumber(
                    botStats.users
                )}\n**Commands**: ${formatNumber(botStats.commands)}`,
                inline: true,
            },
            {
                name: "👥 User Breakdown",
                value: `**Humans**: ${formatNumber(
                    botStats.cachedUsers
                )}\n**Bots**: ${formatNumber(
                    botStats.cachedBots
                )}\n**Emojis**: ${formatNumber(botStats.emojis)}`,
                inline: true,
            },
            {
                name: "🌐 Connection",
                value: `**WS Ping**: ${
                    typeof botStats.wsPing === "number"
                        ? `${botStats.wsPing}ms`
                        : "Unknown"
                }\n**Ready Since**: ${readyTime}\n**Voice Connections**: ${
                    botStats.voiceConnections
                }\n**Shard**: ${
                    client.shard
                        ? `${client.shard.ids.join(",")} / ${
                              client.shard.count
                          }`
                        : "None"
                }`,
                inline: true,
            },
            {
                name: "🔧 Bot Details",
                value: `**Username**: ${client.user.tag}\n**ID**: \`${
                    client.user.id
                }\`\n**Created**: <t:${Math.floor(
                    client.user.createdTimestamp / 1000
                )}:R>\n**Verified**: ${
                    client.user.flags?.has("VerifiedBot") ? "✅" : "❌"
                }`,
                inline: false,
            }
        )
        .setFooter({
            text: `Last updated • ${new Date().toLocaleString("en-US", {
                timeZone: "UTC",
            })} UTC`,
            iconURL: client.user.displayAvatarURL(),
        })
        .setTimestamp();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("botinfo")
        .setDescription(
            "Display detailed information about the bot's status and system specifications"
        )
        .addStringOption((option) =>
            option
                .setName("view")
                .setDescription("Choose which information to display")
                .addChoices(
                    { name: "Bot Stats", value: "bot" },
                    { name: "System Info", value: "system" },
                    { name: "All (Default)", value: "all" }
                )
                .setRequired(false)
        ),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const view = interaction.options.getString("view") || "all";

            const cpus = os.cpus();
            const cpuInfo = {
                model: cpus && cpus.length ? cpus[0].model : "Unknown",
                cores: cpus ? cpus.length : 0,
                arch: os.arch(),
                loadAvg: os.loadavg(),
            };

            const memoryInfo = {
                total: os.totalmem(),
                free: os.freemem(),
                process: process.memoryUsage(),
            };

            const botStats = await getDetailedBotStats(interaction.client);

            const usedMem = memoryInfo.total - memoryInfo.free;
            const procCpuPercent = await sampleProcessCpu(1000);
            const memUsagePercent = (
                (usedMem / memoryInfo.total) *
                100
            ).toFixed(1);

            const embeds = [];
            const components = [];

            if (view === "all" || view === "bot") {
                embeds.push(createBotEmbed(botStats, interaction.client));
            }

            if (view === "all" || view === "system") {
                embeds.push(
                    createSystemEmbed(
                        cpuInfo,
                        memoryInfo,
                        procCpuPercent,
                        memUsagePercent,
                        botStats
                    )
                );
            }

            const refreshButton = new ButtonBuilder()
                .setCustomId(`botinfo_refresh_${interaction.user.id}`)
                .setLabel("🔄 Refresh")
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(refreshButton);
            components.push(row);

            const response = await interaction.editReply({
                embeds: embeds,
                components: components,
            });

            const collector = response.createMessageComponentCollector({
                filter: (i) =>
                    i.customId.startsWith("botinfo_refresh_") &&
                    i.user.id === interaction.user.id,
                time: 300000,
            });

            collector.on("collect", async (buttonInteraction) => {
                try {
                    await buttonInteraction.deferUpdate();

                    const newBotStats = await getDetailedBotStats(
                        interaction.client
                    );
                    const newProcCpuPercent = await sampleProcessCpu(500);
                    const newMemUsagePercent = (
                        (usedMem / memoryInfo.total) *
                        100
                    ).toFixed(1);

                    const newEmbeds = [];
                    if (view === "all" || view === "bot") {
                        newEmbeds.push(
                            createBotEmbed(newBotStats, interaction.client)
                        );
                    }
                    if (view === "all" || view === "system") {
                        newEmbeds.push(
                            createSystemEmbed(
                                cpuInfo,
                                memoryInfo,
                                newProcCpuPercent,
                                newMemUsagePercent,
                                newBotStats
                            )
                        );
                    }

                    await buttonInteraction.editReply({
                        embeds: newEmbeds,
                        components: components,
                    });
                } catch (error) {
                    console.error("Error refreshing bot info:", error);
                    await buttonInteraction.followUp({
                        content: "❌ Failed to refresh information.",
                        ephemeral: true,
                    });
                }
            });

            collector.on("end", () => {
                refreshButton.setDisabled(true);
                interaction
                    .editReply({ embeds: embeds, components: [row] })
                    .catch(() => {});
            });
        } catch (error) {
            console.error("Error in botinfo command:", error);

            const errorEmbed = new EmbedBuilder()
                .setTitle("❌ Error")
                .setDescription(
                    "An error occurred while fetching bot information."
                )
                .setColor(0xff0000)
                .addFields({
                    name: "Error Details",
                    value: `\`\`\`${error.message.substring(0, 1000)}\`\`\``,
                    inline: false,
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] }).catch(() => {
                interaction
                    .editReply({
                        content:
                            "❌ An error occurred while fetching bot information.",
                    })
                    .catch(console.error);
            });
        }
    },
};
