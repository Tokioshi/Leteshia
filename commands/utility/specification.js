const { SlashCommandBuilder, EmbedBuilder, InteractionContextType } = require("discord.js");
const os = require("os");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("specification")
        .setDescription("Check bot specifications")
        .setContexts(InteractionContextType.Guild),
    async execute(interaction) {
        await interaction.deferReply();

        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        const totalMem = os.totalmem() / 1024 / 1024 / 1024;
        const usedMem = process.memoryUsage().rss / 1024 / 1024 / 1024;

        const embed = new EmbedBuilder()
            .setColor("Orange")
            .setTitle("Check bot specifications")
            .addFields(
                { name: "CPU", value: os.cpus()[0].model, inline: false },
                {
                    name: "Memory Usage",
                    value: `${usedMem.toFixed(2)} GB / ${totalMem.toFixed(2)} GB`,
                    inline: true,
                },
                {
                    name: "Uptime",
                    value: `${hours}h ${minutes}m ${seconds}s`,
                    inline: true,
                },
                {
                    name: "Platform",
                    value: `${os.platform()} (${os.arch()})`,
                    inline: true,
                },
                {
                    name: "Node.js Version",
                    value: process.version,
                    inline: true,
                },
            )
            .setFooter({
                text: `API Ping: ${Math.round(interaction.client.ws.ping)} ms`,
            })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
};
