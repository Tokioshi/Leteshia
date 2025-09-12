const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    InteractionContextType,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("weather")
        .setDescription("Menampilkan informasi cuaca terkini")
        .addStringOption((option) =>
            option
                .setName("city")
                .setDescription("Nama kota untuk menampilkan informasi cuaca")
                .setRequired(true)
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

        const city = interaction.options.getString("city");

        const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            city
        )}`;
        const geocodingResponse = await fetch(geocodingUrl);

        if (!geocodingResponse.ok) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Kota tiadk ditemukan!")
                        .setColor(interaction.client.config.embed.fail)
                        .setDescription(`Tidak dapat menemukan kota "${city}".`)
                        .setFooter({
                            text: `Perintah Gagal`,
                            iconURL: interaction.client.user.avatarURL(),
                        })
                        .setTimestamp(),
                ],
                flags: MessageFlags.Ephemeral,
            });
        }

        const geocodingData = await geocodingResponse.json();
        if (!geocodingData.results || geocodingData.results.length === 0) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Kota tiadk ditemukan!")
                        .setColor(interaction.client.config.embed.fail)
                        .setDescription(`Tidak dapat menemukan kota "${city}".`)
                        .setFooter({
                            text: `Perintah Gagal`,
                            iconURL: interaction.client.user.avatarURL(),
                        })
                        .setTimestamp(),
                ],
                flags: MessageFlags.Ephemeral,
            });
        }

        const { latitude, longitude } = geocodingData.results[0];

        const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weathercode`;
        const weatherResponse = await fetch(apiUrl);

        if (!weatherResponse.ok) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Data cuaca tidak ditemukan!")
                        .setColor(interaction.client.config.embed.fail)
                        .setDescription(
                            `Tidak dapat menemukan informasi cuaca untuk kota "${city}".`
                        )
                        .setFooter({
                            text: `Perintah Gagal`,
                            iconURL: interaction.client.user.avatarURL(),
                        })
                        .setTimestamp(),
                ],
                flags: MessageFlags.Ephemeral,
            });
        }

        const weatherData = await weatherResponse.json();
        const temperature = weatherData.current.temperature_2m;
        const humidity = weatherData.current.relative_humidity_2m;
        const windSpeed = weatherData.current.wind_speed_10m;
        const weatherCode = weatherData.current.weathercode;

        const weatherDescriptions = {
            0: "Cerah",
            1: "Sebagian besar cerah",
            2: "Sebagian berawan",
            3: "Berawan",
            45: "Kabut",
            48: "Kabut beku",
            51: "Gerimis ringan",
            53: "Gerimis sedang",
            55: "Gerimis lebat",
            61: "Hujan ringan",
            63: "Hujan sedang",
            65: "Hujan lebat",
            71: "Salju ringan",
            73: "Salju sedang",
            75: "Salju lebat",
            95: "Badai petir",
        };
        const weatherDescription =
            weatherDescriptions[weatherCode] || "Tidak diketahui";

        const weatherEmbed = new EmbedBuilder()
            .setColor("#2596be")
            .setTitle(`Cuaca di ${city}`)
            .setDescription(`**${weatherDescription}**`)
            .addFields(
                { name: "Suhu", value: `${temperature}°C`, inline: true },
                { name: "Kelembapan", value: `${humidity}%`, inline: true },
                {
                    name: "Kecepatan Angin",
                    value: `${windSpeed} km/h`,
                    inline: true,
                }
            )
            .setFooter({
                text: `Data dari Open-Meteo`,
                iconURL:
                    "https://cdn.discordapp.com/emojis/1375806979171422208.png",
            })
            .setTimestamp();

        return interaction.reply({
            embeds: [weatherEmbed],
        });
    },
};
