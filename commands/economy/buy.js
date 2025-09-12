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
        .setName("buy")
        .setDescription("Membeli item dari toko")
        .addStringOption((option) =>
            option
                .setName("item")
                .setDescription("Item yang ingin dibeli")
                .setRequired(true)
                .addChoices(
                    { name: "Roti", value: "bread" },
                    { name: "Kopi", value: "coffee" },
                    { name: "Pedang", value: "sword" },
                    { name: "Tiket Lotre", value: "lottery_ticket" }
                )
        )
        .addIntegerOption((option) =>
            option
                .setName("jumlah")
                .setDescription("Jumlah item yang ingin dibeli")
                .setRequired(true)
                .setMinValue(1)
        )
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
        const item = interaction.options.getString("item");
        const jumlah = interaction.options.getInteger("jumlah");

        const prices = {
            bread: 5,
            coffee: 10,
            sword: 25,
            lottery_ticket: 20,
        };

        const itemNames = {
            bread: "<:roti:1376087462157226075> Roti",
            coffee: "<:kopi:1376089294933983233> Kopi",
            sword: "<:pedang:1376088535810969651> Pedang",
            lottery_ticket: "<:lotre:1376089946418315344> Tiket Lotre",
        };

        if (!prices[item]) {
            const errorEmbed = new EmbedBuilder()
                .setColor("#FF0000")
                .setTitle("Item Tidak Valid!")
                .setDescription(
                    "Item yang Anda masukkan tidak tersedia di toko. Gunakan /shop untuk melihat daftar item!"
                )
                .setFooter({ text: "Coba lagi ya!" })
                .setTimestamp();
            return interaction.reply({
                embeds: [errorEmbed],
                flags: MessageFlags.Ephemeral,
            });
        }

        if (item === "house") {
            const houseCount = (await db.get(`items_${userId}_house`)) || 0;
            if (houseCount >= 1) {
                const alreadyOwnEmbed = new EmbedBuilder()
                    .setColor("#FF0000")
                    .setTitle("Anda Sudah Memiliki Rumah!")
                    .setDescription(
                        "Maaf, Anda hanya bisa membeli rumah satu kali seumur hidup. Nikmati rumah Anda! 🏠"
                    )
                    .setFooter({ text: "Coba beli item lain di /shop!" })
                    .setTimestamp();
                return interaction.reply({
                    embeds: [alreadyOwnEmbed],
                    flags: MessageFlags.Ephemeral,
                });
            }
        } else if (item === "lottery_ticket") {
            const ticketCount =
                (await db.get(`items_${userId}_lottery_ticket`)) || 0;
            if (ticketCount >= 1) {
                const alreadyOwnEmbed = new EmbedBuilder()
                    .setColor("#FF0000")
                    .setTitle("Anda Sudah Memiliki Tiket Lotre!")
                    .setDescription(
                        "Maaf, Anda hanya bisa membeli tiket lotre satu kali seumur hidup. Semoga beruntung! 🎟️"
                    )
                    .setFooter({ text: "Coba beli item lain di /shop!" })
                    .setTimestamp();
                return interaction.reply({
                    embeds: [alreadyOwnEmbed],
                    flags: MessageFlags.Ephemeral,
                });
            }
        }

        const totalPrice = prices[item] * jumlah;

        const userCoins = (await db.get(`coins_${userId}`)) || 0;

        if (userCoins < totalPrice) {
            const insufficientEmbed = new EmbedBuilder()
                .setColor("#FF0000")
                .setTitle("Saldo Tidak Cukup!")
                .setDescription(
                    `Maaf, saldo Anda saat ini **${userCoins} koin**, tapi Anda membutuhkan **${totalPrice} koin** untuk membeli **${jumlah} ${itemNames[item]}**.\nKumpulkan lebih banyak koin dengan /work atau /daily!`
                )
                .setFooter({ text: "Ayo kerja keras!" })
                .setTimestamp();
            return interaction.reply({
                embeds: [insufficientEmbed],
                flags: MessageFlags.Ephemeral,
            });
        }

        await db.sub(`coins_${userId}`, totalPrice);

        await db.add(`items_${userId}_${item}`, jumlah);

        const newBalance = (await db.get(`coins_${userId}`)) || 0;

        const successEmbed = new EmbedBuilder()
            .setColor(interaction.client.config.embed.default || "#00FF00")
            .setTitle("Pembelian Berhasil!")
            .setDescription(
                `Selamat! Anda berhasil membeli **${jumlah} ${
                    itemNames[item]
                }** seharga **${totalPrice} koin**.\nSaldo Anda sekarang: **${newBalance} koin**.\n\nGunakan item Anda dengan bijak!${
                    item === "bread" || item === "coffee" || item === "sword"
                        ? " Item ini bisa dipakai untuk /work."
                        : ""
                }${
                    item === "lottery_ticket"
                        ? " Tiket Anda akan dihapus oleh sistem lain nanti."
                        : ""
                }`
            )
            .setFooter({ text: "Cek inventori Anda dengan /inventory!" })
            .setTimestamp();

        await interaction.reply({ embeds: [successEmbed] });
    },
};
