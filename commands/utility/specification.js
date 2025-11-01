const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const os = require("os");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("specification")
        .setDescription("Periksa spesifikasi bot")
        .setContexts(0),
    async execute(interaction) {
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        const totalMem = os.totalmem() / 1024 / 1024 / 1024;
        const usedMem = process.memoryUsage().rss / 1024 / 1024 / 1024;

        const embed = new EmbedBuilder()
            .setColor("Orange")
            .setTitle("Periksa spesifikasi bot")
            .addFields(
                { name: "CPU", value: os.cpus()[0].model, inline: false },
                {
                    name: "Penggunaan Memori",
                    value: `${usedMem.toFixed(2)} GB / ${totalMem.toFixed(
                        2
                    )} GB`,
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
                }
            )
            .setFooter({
                text: `API Ping: ${Math.round(interaction.client.ws.ping)} ms`,
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
