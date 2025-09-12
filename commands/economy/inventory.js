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
        .setName("inventory")
        .setDescription("Melihat atau mengelola item yang Anda miliki")
        .addStringOption((option) =>
            option
                .setName("action")
                .setDescription("Aksi yang ingin dilakukan")
                .setRequired(true)
                .addChoices(
                    { name: "View", value: "view" },
                    { name: "Discard", value: "discard" }
                )
        )
        .addStringOption((option) =>
            option
                .setName("item")
                .setDescription(
                    "Item yang ingin dibuang (hanya untuk aksi discard)"
                )
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
                .setDescription(
                    "Jumlah item yang ingin dibuang (hanya untuk aksi discard)"
                )
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
        const username = interaction.user.username;
        const action = interaction.options.getString("action");
        const selectedItem = interaction.options.getString("item");
        const jumlah = interaction.options.getInteger("jumlah") || 1;

        const itemNames = {
            bread: "<:roti:1376087462157226075> Roti",
            coffee: "<:kopi:1376089294933983233> Kopi",
            sword: "<:pedang:1376088535810969651> Pedang",
            lottery_ticket: "<:lotre:1376089946418315344> Tiket Lotre",
        };

        const items = {
            bread: (await db.get(`items_${userId}_bread`)) || 0,
            coffee: (await db.get(`items_${userId}_coffee`)) || 0,
            sword: (await db.get(`items_${userId}_sword`)) || 0,
            lottery_ticket:
                (await db.get(`items_${userId}_lottery_ticket`)) || 0,
        };

        if (action === "view") {
            const ownedItems = Object.keys(items).filter(
                (key) => items[key] > 0
            );

            const embed = new EmbedBuilder()
                .setTitle(`Inventory ${username}`)
                .setColor(interaction.client.config.embed.default);

            if (ownedItems.length === 0) {
                embed
                    .setDescription("Anda tidak memiliki apapun!")
                    .setThumbnail(
                        "https://media.discordapp.net/attachments/1251432839543525406/1376092615543488552/inven.png?ex=6834119e&is=6832c01e&hm=37994ad89875f0811c16342d6e8371d51891c0395e57478c5ff39db7fba4ed8f&=&format=webp&quality=lossless"
                    );
            } else {
                const itemDescriptions = ownedItems
                    .filter((key) => key !== "house")
                    .map((key) => {
                        return `• ${itemNames[key]} x **${items[key]}**`;
                    })
                    .join("\n");
                embed
                    .setDescription(itemDescriptions)
                    .setThumbnail(
                        "https://media.discordapp.net/attachments/1251432839543525406/1376064298501279847/inventory_1.png?ex=6833f73e&is=6832a5be&hm=bd7c7d626b8f927c5649e7c74564ab1508ca259094ff6feb5534ba6211bf2fef&=&format=webp&quality=lossless"
                    );
            }

            embed.setFooter({ text: "Harmony Hub" }).setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } else if (action === "discard") {
            if (!selectedItem) {
                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(interaction.client.config.embed.fail)
                            .setTitle("Pilih Item untuk Dibuang")
                            .setDescription(
                                "Silakan pilih item yang ingin Anda buang dengan menggunakan opsi yang tersedia!"
                            )
                            .setFooter({
                                text: "Gunakan /inventory discard <item> <jumlah>",
                            })
                            .setTimestamp(),
                    ],
                });
                return;
            }

            if (!items[selectedItem] && items[selectedItem] !== 0) {
                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(interaction.client.config.embed.fail)
                            .setTitle("Item Tidak Valid")
                            .setDescription(
                                "Item yang Anda pilih tidak valid atau tidak tersedia di inventori Anda!"
                            )
                            .setFooter({
                                text: "Gunakan /inventory view untuk melihat item yang Anda miliki",
                            })
                            .setTimestamp(),
                    ],
                });
                return;
            }

            const currentCount = items[selectedItem];
            if (currentCount === 0) {
                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(interaction.client.config.embed.fail)
                            .setTitle("Item Tidak Tersedia")
                            .setDescription(
                                `Anda tidak memiliki ${itemNames[selectedItem]} untuk dibuang!`
                            )
                            .setFooter({
                                text: "Gunakan /inventory view untuk melihat item yang Anda miliki",
                            })
                            .setTimestamp(),
                    ],
                });
                return;
            }

            if (jumlah > currentCount) {
                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(interaction.client.config.embed.fail)
                            .setTitle("Jumlah Tidak Valid")
                            .setDescription(
                                `Anda hanya memiliki ${itemNames[selectedItem]} [${currentCount}], tidak cukup untuk membuang [${jumlah}]!`
                            )
                            .setFooter({
                                text: "Silakan masukkan jumlah yang valid",
                            })
                            .setTimestamp(),
                    ],
                });
                return;
            }

            await db.sub(`items_${userId}_${selectedItem}`, jumlah);

            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(interaction.client.config.embed.success)
                        .setTitle("Item Dibuang!")
                        .setDescription(
                            `Berhasil membuang ${itemNames[selectedItem]} [${jumlah}]!`
                        )
                        .setFooter({ text: "Membuang item" })
                        .setTimestamp(),
                ],
            });
        }
    },
};
