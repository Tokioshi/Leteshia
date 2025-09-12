const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    InteractionContextType,
} = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName("work")
        .setDescription("Bekerja untuk mendapatkan koin setiap 1 jam")
        .setContexts(InteractionContextType.Guild),
    async execute(interaction) {
        if (
            interaction.channel.id !== interaction.client.config.channel.economy
        ) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Channel Tidak Diizinkan")
                        .setColor(interaction.client.config.embed.fail)
                        .setDescription(
                            `Maaf, perintah ini hanya dapat digunakan di channel yang ditentukan <#${interaction.client.config.channel.economy}>.`
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

        const userId = interaction.user.id;
        const lastWork = (await db.get(`work_${userId}`)) || 0;
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;

        if (lastWork && now - lastWork < oneHour) {
            const nextWorkTime = Math.floor((lastWork + oneHour) / 1000);
            const cooldownEmbed = new EmbedBuilder()
                .setColor(interaction.client.config.embed.default || "#FFA500")
                .setTitle("Waktu Istirahat!")
                .setDescription(
                    `Wah, Anda masih lelah! Anda bisa bekerja lagi pada <t:${nextWorkTime}:t> (<t:${nextWorkTime}:R>). Istirahat dulu ya! 😴`
                )
                .setFooter({ text: "Kembali lagi nanti!" })
                .setTimestamp();
            return interaction.reply({
                embeds: [cooldownEmbed],
                flags: MessageFlags.Ephemeral,
            });
        }

        const items = {
            bread: (await db.get(`items_${userId}_bread`)) || 0,
            coffee: (await db.get(`items_${userId}_coffee`)) || 0,
            sword: (await db.get(`items_${userId}_sword`)) || 0,
        };

        let usedItem = null;
        let boostMessage = "";
        let totalCoins = 0;
        let itemSurvived = false;

        if (items.sword > 0) {
            usedItem = "sword";
            totalCoins = Math.floor(Math.random() * (15 - 8 + 1)) + 8;
            const breakChance = Math.random();
            if (breakChance < 0.25) {
                const messages = [
                    "Anda bekerja dengan pedang dan pedang itu patah berkilau! 💥",
                    "Dengan pedang di tangan, Anda mengalahkan tugas dan pedangnya hancur! ⚔️",
                    "Pedang Anda berkorban untuk kerja keras, kini jadi debu emas! ✨",
                ];
                boostMessage =
                    messages[Math.floor(Math.random() * messages.length)];
                await db.sub(`items_${userId}_sword`, 1);
            } else {
                const surviveMessages = [
                    "Anda bekerja, dan sepertinya pedang Anda masih utuh! 🗡️",
                    "Pedang Anda ternyata kuat, masih bisa dipakai lagi! 💪",
                    "Kerja keras selesai, pedang Anda masih berkilau! ✨",
                ];
                boostMessage =
                    surviveMessages[
                        Math.floor(Math.random() * surviveMessages.length)
                    ];
                itemSurvived = true;
            }
        } else if (items.coffee > 0) {
            usedItem = "coffee";
            totalCoins = Math.floor(Math.random() * (8 - 4 + 1)) + 4;
            const breakChance = Math.random();
            if (breakChance < 0.25) {
                const messages = [
                    "Anda menyeruput kopi dan menjadi super produktif! ☕",
                    "Kopi Anda memberikan energi dahsyat, tapi cangkirnya pecah! 🔥",
                    "Dengan kopi hangat, Anda bekerja lincah dan kopinya habis! 😄",
                ];
                boostMessage =
                    messages[Math.floor(Math.random() * messages.length)];
                await db.sub(`items_${userId}_coffee`, 1);
            } else {
                const surviveMessages = [
                    "Anda meminum kopi dan masih tersisa sedikit di cangkir! ☕",
                    "Kopi Anda masih ada sisa, bisa dipakai lagi nanti! 😊",
                    "Setelah bekerja, ternyata kopi Anda belum habis! 🔥",
                ];
                boostMessage =
                    surviveMessages[
                        Math.floor(Math.random() * surviveMessages.length)
                    ];
                itemSurvived = true;
            }
        } else if (items.bread > 0) {
            usedItem = "bread";
            const zonkChance = Math.random();
            if (zonkChance < 0.2) {
                totalCoins = 0;
                const zonkMessages = [
                    "Anda memakan roti, tapi ternyata roti itu hangus! Tidak ada koin untukmu. 😞",
                    "Roti Anda terjatuh ke lumpur saat bekerja, zonk deh! 🍞💦",
                    "Sayang sekali, roti Anda dimakan burung, kerja sia-sia! 🐦",
                ];
                boostMessage =
                    zonkMessages[
                        Math.floor(Math.random() * zonkMessages.length)
                    ];
                await db.sub(`items_${userId}_bread`, 1);
            } else {
                totalCoins = Math.floor(Math.random() * (5 - 2 + 1)) + 2;
                const breakChance = Math.random();
                if (breakChance < 0.25) {
                    const messages = [
                        "Anda memakan roti dan menjadi lebih semangat! 🍞",
                        "Roti lezat memberi tenaga, tapi kini roti itu tinggal kenangan! 😋",
                        "Dengan roti di perut, Anda bekerja giat dan roti habis! 🌟",
                    ];
                    boostMessage =
                        messages[Math.floor(Math.random() * messages.length)];
                    await db.sub(`items_${userId}_bread`, 1);
                } else {
                    const surviveMessages = [
                        "Anda tidak memakai semua roti, roti Anda masih ada! 🍞",
                        "Roti Anda ternyata masih sisa separuh, bisa dipakai lagi! 😊",
                        "Setelah bekerja, roti Anda masih utuh di saku! 🌟",
                    ];
                    boostMessage =
                        surviveMessages[
                            Math.floor(Math.random() * surviveMessages.length)
                        ];
                    itemSurvived = true;
                }
            }
        } else {
            const zonkChance = Math.random();
            if (zonkChance < 0.3) {
                totalCoins = 0;
                const zonkMessages = [
                    "Anda bekerja keras, tapi malah jatuh ke lumpur. Zonk! 😓",
                    "Pekerjaan Anda sia-sia, tidak ada koin hari ini. 💨",
                    "Sayang sekali, kerja keras Anda tidak membuahkan hasil! 😢",
                ];
                boostMessage =
                    zonkMessages[
                        Math.floor(Math.random() * zonkMessages.length)
                    ];
            } else {
                totalCoins = Math.floor(Math.random() * (3 - 1 + 1)) + 1;
                const messages = [
                    "Anda bekerja dengan tangan kosong, semangat saja yang jadi modal! 💪",
                    "Tanpa item, Anda tetap berusaha keras! 🌟",
                    "Kerja keras tanpa boost, tapi tetap ada hasil! 😅",
                ];
                boostMessage =
                    messages[Math.floor(Math.random() * messages.length)];
            }
        }

        if (totalCoins > 0) {
            await db.add(`coins_${userId}`, totalCoins);
        }
        await db.set(`work_${userId}`, now);

        const resultEmbed = new EmbedBuilder()
            .setColor(
                totalCoins === 0
                    ? "#FF0000"
                    : itemSurvived
                    ? interaction.client.config.embed.default
                    : "#FFFF00"
            )
            .setTitle(
                totalCoins > 0 ? "Kerja Keras Terbayar!" : "Sayang Sekali!"
            )
            .setDescription(
                `${boostMessage} ${
                    totalCoins > 0
                        ? `Anda mendapatkan **${totalCoins} koin**! Keren banget!`
                        : ""
                }\nKembali bekerja dalam 1 jam lagi ya!`
            )
            .setFooter({ text: "Beli item di /shop untuk peluang lebih baik!" })
            .setTimestamp();

        await interaction.reply({ embeds: [resultEmbed] });
    },
};
