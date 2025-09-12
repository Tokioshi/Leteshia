const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    InteractionContextType,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("current")
        .setDescription("See the currently playing track")
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

        const track = player.current;
        if (!track) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Error!")
                        .setColor("Red")
                        .setDescription("No track is currently playing."),
                ],
                flags: [MessageFlags.Ephemeral],
            });
        }

        const formatDuration = (ms) => {
            const seconds = Math.floor((ms / 1000) % 60);
            const minutes = Math.floor((ms / (1000 * 60)) % 60);
            const hours = Math.floor(ms / (1000 * 60 * 60));

            if (hours > 0) {
                return `${hours}:${minutes
                    .toString()
                    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
            }
            return `${minutes}:${seconds.toString().padStart(2, "0")}`;
        };

        const embed = new EmbedBuilder()
            .setTitle("🎶 Now Playing")
            .setDescription(`**[${track.info.title}](${track.info.uri})**`)
            .addFields(
                {
                    name: "Artist",
                    value: track.info.author || "Unknown",
                    inline: true,
                },
                {
                    name: "Duration",
                    value: formatDuration(track.info.length),
                    inline: true,
                },
                {
                    name: "Requested By",
                    value: `${track.info.requester}`,
                    inline: true,
                }
            )
            .setColor(0x00ae86)
            .setThumbnail(track.info.artworkUrl || null)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
