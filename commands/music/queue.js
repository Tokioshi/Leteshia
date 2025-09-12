const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    InteractionContextType,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("queue")
        .setDescription("Show the current music queue")
        .setContexts(InteractionContextType.Guild),
    async execute(interaction) {
        if (
            interaction.channel.id !== interaction.client.config.channel.music
        ) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Channel Tidak Diizinkan")
                        .setColor(interaction.client.config.embed.fail)
                        .setDescription(
                            `Maaf, perintah ini hanya dapat digunakan di channel yang ditentukan <#${interaction.client.config.channel.music}>.`
                        )
                        .setFooter({
                            text: `Perintah Terbatas`,
                            iconURL: interaction.client.user.avatarURL(),
                        })
                        .setTimestamp(),
                ],
                flags: MessageFlags.Ephemeral,
            });
        }

        const channel = interaction.member.voice.channel;
        const botChannel = interaction.guild.members.me.voice.channel;

        if (!channel || (botChannel && channel.id !== botChannel.id)) {
            let description;
            if (!channel) {
                description = "You need to join a voice channel first.";
            } else {
                description = "You need to join the same voice channel as me.";
            }

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Error!")
                        .setColor("Red")
                        .setDescription(description),
                ],
                flags: [MessageFlags.Ephemeral],
            });
        }

        const player = interaction.client.riffy.players.get(
            interaction.guild.id
        );

        if (!player) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Error!")
                        .setColor("Red")
                        .setDescription(
                            "There is no player playing in this server!"
                        ),
                ],
                flags: [MessageFlags.Ephemeral],
            });
        }

        const current = player.current;
        const queue = player.queue;

        if (!current && queue.length === 0) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Error!")
                        .setColor("Red")
                        .setDescription("Nothing is playing right now."),
                ],
                flags: [MessageFlags.Ephemeral],
            });
        }

        let description = "";
        if (current) {
            description += `**Now Playing:** [${current.info.title}](${current.info.uri})\nBy: ${current.info.author}\n\n`;
        }

        if (queue.length > 0) {
            description += "**Up Next:**\n";
            queue.slice(0, 10).forEach((track, i) => {
                description += `${i + 1}. [${track.info.title}](${
                    track.info.uri
                }) — ${track.info.author}\n`;
            });

            if (queue.length > 10) {
                description += `\n...and **${
                    queue.length - 10
                }** more track(s).`;
            }
        }

        const embed = new EmbedBuilder()
            .setTitle("📜 Music Queue")
            .setDescription(description)
            .setColor(0x00ae86)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
