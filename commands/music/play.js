const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    InteractionContextType,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Play a song or playlist")
        .addStringOption((opt) =>
            opt
                .setName("query")
                .setDescription("Song name or URL")
                .setRequired(true)
        )
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

        const query = interaction.options.getString("query");

        let player = interaction.client.riffy.players.get(interaction.guild.id);
        if (!player) {
            player = interaction.client.riffy.createConnection({
                guildId: interaction.guild.id,
                voiceChannel: channel.id,
                textChannel: interaction.channel.id,
                deaf: true,
            });
        }

        const resolve = await interaction.client.riffy.resolve({
            query,
            requester: interaction.user,
        });

        const { loadType, tracks, playlistInfo } = resolve;

        if (loadType === "playlist") {
            for (const track of tracks) {
                track.info.requester = interaction.user;
                player.queue.add(track);
            }
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("🎶 Playlist Added")
                        .setDescription(
                            `Added **${tracks.length} tracks** from **${playlistInfo.name}**`
                        )
                        .setColor(0x00ae86),
                ],
            });
            if (!player.playing && !player.paused) player.play();
        } else if (loadType === "track" || loadType === "search") {
            const track = tracks[0];
            track.info.requester = interaction.user;
            player.queue.add(track);

            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("🎶 Track Added")
                        .setDescription(
                            `**${track.info.title}**\nBy: ${track.info.author}`
                        )
                        .setColor(0x00ae86),
                ],
            });
            if (!player.playing && !player.paused) player.play();
        } else {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setDescription("No results found."),
                ],
                ephemeral: [MessageFlags.Ephemeral],
            });
        }
    },
};
