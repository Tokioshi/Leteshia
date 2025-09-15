const {
    SlashCommandBuilder,
    EmbedBuilder,
    InteractionContextType,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription(
            "Menampilkan informasi detail tentang latensi dan status bot"
        )
        .setContexts(InteractionContextType.Guild),
    async execute(interaction) {
        const startTime = Date.now();

        await interaction.deferReply();

        const endTime = Date.now();
        const apiLatency = endTime - startTime;

        const wsLatency = interaction.client.ws.ping;

        const uptime = formatUptime(interaction.client.uptime);
        const serverCount = interaction.client.guilds.cache.size;
        const memoryUsage = (
            process.memoryUsage().heapUsed /
            1024 /
            1024
        ).toFixed(2);

        const embed = new EmbedBuilder()
            .setTitle("🏓 Pong!")
            .setColor(getLatensiColor(wsLatency))
            .addFields(
                {
                    name: "⌛ WebSocket",
                    value: `\`${wsLatency}ms\``,
                    inline: true,
                },
                { name: "🌐 API", value: `\`${apiLatency}ms\``, inline: true },
                { name: "⏱️ Uptime", value: `\`${uptime}\``, inline: true },
                {
                    name: "🖥️ Server",
                    value: `\`${serverCount} servers\``,
                    inline: true,
                },
                {
                    name: "💾 Memory",
                    value: `\`${memoryUsage} MB\``,
                    inline: true,
                },
                {
                    name: "🔄 OS Uptime",
                    value: `\`${formatUptime(process.uptime() * 1000)}\``,
                    inline: true,
                }
            )
            .setFooter({
                text: "It came from GitHub!",
                iconURL: interaction.user.displayAvatarURL({ size: 512 }),
            })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
};

/**
 *
 * @param {number} ms
 * @returns {string}
 */
function formatUptime(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

    return parts.join(" ");
}

/**
 *
 * @param {number} latency
 * @returns {number}
 */
function getLatensiColor(latency) {
    if (latency < 100) return 0x00ff00;
    if (latency < 200) return 0xffff00;
    if (latency < 400) return 0xff9900;
    return 0xff0000;
}
