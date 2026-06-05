const { ActivityType, EmbedBuilder } = require("discord.js");
const axios = require("axios");

const EXCHANGE_API_URL = "https://open.er-api.com/v6/latest/USD";

const api = axios.create({
    timeout: 10_000,
    headers: {
        "User-Agent": "DiscordBot-ExchangeRateReporter/1.0",
    },
});

let lastRate = null;
let lastUpdatedAt = null;

function formatIDR(value) {
    return new Intl.NumberFormat("id-ID", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

function formatDateTime(date = new Date()) {
    return new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Jakarta",
    }).format(date);
}

function getDateString(date) {
    return date.toISOString().split("T")[0];
}

function subtractDays(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
}

async function getExchangeRate() {
    try {
        const { data } = await api.get(EXCHANGE_API_URL);

        if (data?.result !== "success") {
            throw new Error(`API returned invalid result: ${data?.result ?? "unknown"}`);
        }

        const idrRate = data?.rates?.IDR;

        if (typeof idrRate !== "number") {
            throw new Error("IDR rate is missing or invalid.");
        }

        return {
            rate: idrRate,
            base: data.base_code ?? "USD",
            target: "IDR",
            timeLastUpdateUnix: data.time_last_update_unix ?? null,
            timeNextUpdateUnix: data.time_next_update_unix ?? null,
        };
    } catch (error) {
        console.error("[ExchangeRate] Failed to get API data:", error.message);
        return null;
    }
}

async function getHistoricalRates(days = 30) {
    try {
        const from = getDateString(subtractDays(days));
        const to = getDateString(new Date());

        const url = `https://api.frankfurter.app/${from}..${to}?from=USD&to=IDR`;

        const { data } = await api.get(url);

        const rates = Object.entries(data.rates ?? {})
            .map(([date, value]) => ({
                date,
                rate: value.IDR,
            }))
            .filter((item) => typeof item.rate === "number");

        return rates;
    } catch (error) {
        console.error("[ExchangeRate] Failed to get historical data:", error.message);
        return [];
    }
}

function buildChartUrl(rates, rangeLabel = "1M") {
    const labels = rates.map((item) => item.date.slice(5));
    const data = rates.map((item) => Number(item.rate.toFixed(2)));

    const chartConfig = {
        type: "line",
        data: {
            labels,
            datasets: [
                {
                    label: `USD/IDR ${rangeLabel}`,
                    data,
                    borderColor: "#2ecc71",
                    backgroundColor: "rgba(46, 204, 113, 0.15)",
                    fill: true,
                    tension: 0.35,
                    pointRadius: 2,
                    pointHoverRadius: 4,
                },
            ],
        },
        options: {
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: "#ffffff",
                    },
                },
                title: {
                    display: true,
                    text: `USD to IDR Exchange Rate - ${rangeLabel}`,
                    color: "#ffffff",
                    font: {
                        size: 18,
                    },
                },
            },
            scales: {
                x: {
                    ticks: {
                        color: "#ffffff",
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 8,
                    },
                    grid: {
                        color: "rgba(255,255,255,0.08)",
                    },
                },
                y: {
                    ticks: {
                        color: "#ffffff",
                        callback: function (value) {
                            return "Rp " + value.toLocaleString("id-ID");
                        },
                    },
                    grid: {
                        color: "rgba(255,255,255,0.08)",
                    },
                },
            },
        },
    };

    return `https://quickchart.io/chart?width=900&height=420&backgroundColor=%231f2937&c=${encodeURIComponent(
        JSON.stringify(chartConfig),
    )}`;
}

function buildExchangeRateEmbed({
    rate,
    base,
    target,
    timeLastUpdateUnix,
    timeNextUpdateUnix,
    chartUrl,
}) {
    const formattedRate = formatIDR(rate);
    const lastApiUpdate = timeLastUpdateUnix ? `<t:${timeLastUpdateUnix}:F>` : "Unknown";
    const nextApiUpdate = timeNextUpdateUnix ? `<t:${timeNextUpdateUnix}:R>` : "Unknown";
    const localUpdateTime = formatDateTime();

    const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setAuthor({
            name: "Exchange Rate Monitor",
            iconURL: "https://cdn-icons-png.flaticon.com/512/3135/3135706.png",
        })
        .setTitle("USD → IDR Exchange Rate")
        .setDescription(
            [
                "Live exchange-rate panel for the current U.S. Dollar to Indonesian Rupiah reference rate.",
                "",
                `## **$1 = Rp ${formattedRate}**`,
            ].join("\n"),
        )
        .addFields(
            { name: "Base Currency", value: `\`${base}\``, inline: true },
            { name: "Target Currency", value: `\`${target}\``, inline: true },
            { name: "Local Refresh", value: localUpdateTime, inline: true },
            { name: "API Last Update", value: lastApiUpdate, inline: true },
            { name: "API Next Update", value: nextApiUpdate, inline: true },
            { name: "Chart Range", value: "1 Month", inline: true },
        )
        .setTimestamp()
        .setFooter({
            text: "Automatic exchange-rate report • Updates every 30 minutes",
        });

    if (chartUrl) {
        embed.setImage(chartUrl);
    }

    return embed;
}

async function updatePresence(client, rate) {
    const formattedRate = formatIDR(rate);

    client.user.setPresence({
        activities: [
            {
                type: ActivityType.Custom,
                name: "custom",
                state: `USD/IDR: Rp ${formattedRate}`,
            },
        ],
        status: "online",
    });
}

async function updateExchangeRateMessage(client, embed) {
    const channelId = client.config.channel.exchangeRate;

    try {
        const channel = await client.channels.fetch(channelId);

        if (!channel || !channel.isTextBased()) {
            throw new Error("Exchange rate channel is not a text-based channel.");
        }

        let message = null;

        try {
            message = await channel.messages.fetch(client.config.channel.exchangeID);
        } catch {
            message = null;
        }

        if (message) {
            await message.edit({ embeds: [embed] });
            return message;
        }

        const newMessage = await channel.send({ embeds: [embed] });

        console.warn(
            `[ExchangeRate] Old message not found. New report message created: ${newMessage.id}`,
        );

        return newMessage;
    } catch (error) {
        console.error("[ExchangeRate] Failed to update exchange rate message:", error.message);
        return null;
    }
}

async function updateLiveReport(client) {
    const exchangeData = await getExchangeRate();

    if (!exchangeData) {
        return;
    }

    const { rate } = exchangeData;

    lastRate = rate;
    lastUpdatedAt = new Date();

    await updatePresence(client, rate);

    const historicalRates = await getHistoricalRates(30);
    const chartUrl = historicalRates.length > 0 ? buildChartUrl(historicalRates, "1M") : null;

    const embed = buildExchangeRateEmbed({ ...exchangeData, chartUrl });

    await updateExchangeRateMessage(client, embed);
}

module.exports = {
    getExchangeRate,
    updateLiveReport,
};
