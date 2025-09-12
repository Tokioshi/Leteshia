const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    InteractionContextType,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("pause")
        .setDescription("Pause or resume the current track")
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

        if (player.paused) {
            player.pause(false);
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Blue")
                        .setDescription("Resumed the track."),
                ],
            });
        } else {
            player.pause(true);
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setDescription("Paused the track."),
                ],
            });
        }
    },
};
