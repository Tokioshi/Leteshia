const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    InteractionContextType,
} = require("discord.js");

let cachedToken = null;
let tokenExpiry = 0;

module.exports = {
    data: new SlashCommandBuilder()
        .setName("spotify")
        .setDescription("Mencari lagu berdasarkan judul")
        .addStringOption((option) =>
            option
                .setName("judul")
                .setDescription("Judul lagu yang ingin dicari")
                .setRequired(true)
                .setMaxLength(100)
        )
        .setContexts(InteractionContextType.Guild),
    async execute(interaction) {
        if (interaction.channel.id !== interaction.client.config.channel.api) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Channel Tidak Diizinkan")
                        .setColor(interaction.client.config.embed.fail)
                        .setDescription(
                            `Maaf, perintah ini hanya dapat digunakan di channel yang ditentukan <#${interaction.client.config.channel.api}>.`
                        )
                        .setFooter({
                            text: "Perintah Terbatas",
                            iconURL: interaction.client.user.avatarURL(),
                        })
                        .setTimestamp(),
                ],
                flags: MessageFlags.Ephemeral,
            });
        }

        const title = interaction.options.getString("judul");

        try {
            await interaction.deferReply();

            const token = await getSpotifyToken();

            const trackResponse = await fetch(
                `https://api.spotify.com/v1/search?q=${encodeURIComponent(
                    title
                )}&type=track&limit=1`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!trackResponse.ok) {
                const errorData = await trackResponse.json().catch(() => ({}));
                throw new Error(
                    `Spotify API Error (Track Search, ${
                        trackResponse.status
                    }): ${errorData.error?.message || "Unknown error"}`
                );
            }

            const trackData = await trackResponse.json();

            if (!trackData.tracks?.items?.length) {
                const notFoundEmbed = new EmbedBuilder()
                    .setColor(0xffd700)
                    .setTitle("Lagu Tidak Ditemukan")
                    .setDescription(
                        `Maaf, kami tidak dapat menemukan lagu dengan judul "**${title}**" di Spotify.`
                    )
                    .addFields({
                        name: "Saran",
                        value: "Coba periksa kembali ejaan atau gunakan judul lagu yang lebih spesifik.",
                    })
                    .setFooter({
                        text: "Spotify Search",
                        iconURL: interaction.client.user.avatarURL(),
                    })
                    .setTimestamp();

                return interaction.editReply({ embeds: [notFoundEmbed] });
            }

            const track = trackData.tracks.items[0];
            let genres = "Tidak tersedia";

            if (track.artists && track.artists.length > 0) {
                const mainArtistId = track.artists[0].id;
                const artistResponse = await fetch(
                    `https://api.spotify.com/v1/artists/${mainArtistId}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                if (artistResponse.ok) {
                    const artistData = await artistResponse.json();
                    if (artistData.genres && artistData.genres.length > 0) {
                        genres = artistData.genres
                            .map((g) =>
                                g
                                    .split(" ")
                                    .map(
                                        (word) =>
                                            word.charAt(0).toUpperCase() +
                                            word.slice(1)
                                    )
                                    .join(" ")
                            )
                            .join(", ");
                    }
                } else {
                    console.warn(
                        `Could not fetch artist genres for ${mainArtistId}: ${artistResponse.status}`
                    );
                }
            }

            const embed = createTrackEmbed(track, genres, "#1dd963");

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error("Spotify command error:", error);

            const errorEmbed = new EmbedBuilder()
                .setColor(interaction.client.config.embed.fail)
                .setTitle("Gagal Mencari Lagu")
                .setDescription(
                    "Terjadi kesalahan saat mencoba mencari lagu di Spotify. Mohon coba lagi nanti."
                )
                .addFields({
                    name: "Detail Teknis",
                    value: `\`\`\`${error.message || "Unknown error"}\`\`\``,
                })
                .setFooter({
                    text: "Spotify Search",
                    iconURL: interaction.client.user.avatarURL(),
                })
                .setTimestamp();

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({
                    embeds: [errorEmbed],
                    flags: MessageFlags.Ephemeral,
                });
            }
        }
    },
};

function createTrackEmbed(track, genres, color) {
    const duration = formatDuration(track.duration_ms);
    const artists =
        track.artists?.map((artist) => artist.name).join(", ") ||
        "Unknown Artist";
    const albumName = track.album?.name || "Unknown Album";
    const imageUrl = track.album?.images?.[0]?.url;

    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`${track.name}`)
        .setURL(track.external_urls?.spotify)
        .addFields(
            { name: "🎤 Artis", value: `\`${artists}\``, inline: true },
            { name: "💿 Album", value: `\`${albumName}\``, inline: true },
            { name: "⏳ Durasi", value: `\`${duration}\``, inline: true },
            { name: "🎭 Genre", value: `\`${genres}\``, inline: true },
            {
                name: "🔗 Link",
                value: `[Dengarkan di Spotify](${
                    track.external_urls?.spotify || "N/A"
                })`,
                inline: true,
            }
        )
        .setFooter({
            text: `Spotify ID: ${track.id}`,
            iconURL:
                "https://cdn.discordapp.com/emojis/1375425559680647238.png",
        })
        .setTimestamp();

    if (imageUrl) {
        embed.setThumbnail(imageUrl);
    }

    return embed;
}

function formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

async function getSpotifyToken() {
    const now = Date.now();

    if (cachedToken && now < tokenExpiry - 300000) {
        return cachedToken;
    }

    const SPOTIFY_CLIENT_ID = interaction.client.config.api.spotifyClientId;
    const SPOTIFY_CLIENT_SECRET =
        interaction.client.config.api.spotifyClientSecret;

    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
        throw new Error(
            "Spotify credentials not configured in environment variables!"
        );
    }

    const creds = Buffer.from(
        `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
    ).toString("base64");

    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            Authorization: `Basic ${creds}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
            `Spotify Token request failed: ${response.status} - ${
                errorData.error_description || "Unknown error"
            }`
        );
    }

    const data = await response.json();

    cachedToken = data.access_token;
    tokenExpiry = now + data.expires_in * 1000;

    return cachedToken;
}
