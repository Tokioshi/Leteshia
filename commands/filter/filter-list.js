const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    InteractionContextType,
} = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName("filter-list")
        .setDescription("Menampilkan daftar kata yang terfilter")
        .setContexts(InteractionContextType.Guild),
    async execute(interaction) {
        if (
            interaction.channel.id !== interaction.client.config.channel.filter
        ) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Channel Tidak Diizinkan")
                        .setColor(interaction.client.config.embed.fail)
                        .setDescription(
                            `Maaf, perintah ini hanya dapat digunakan di channel yang ditentukan <#${interaction.client.config.channel.filter}>.`
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

        let filter = (await db.get("filter_")) || [];
        if (filter.length === 0) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Daftar Filter Kosong")
                        .setColor(
                            interaction.client.config.embed.info || 0xadd8e6
                        )
                        .setDescription(
                            "Saat ini tidak ada kata yang terdaftar dalam filter kata."
                        )
                        .setFooter({
                            text: "Filter Kata",
                            iconURL: interaction.client.user.avatarURL(),
                        }),
                ],
                flags: MessageFlags.Ephemeral,
            });
        }

        const itemsPerPage = 5;
        let currentPage = 1;
        const maxPages = Math.ceil(filter.length / itemsPerPage);

        let lastUpdated = (await db.get("filter_last_updated")) || Date.now();

        function generateEmbed(page) {
            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const pageItems = filter.slice(startIndex, endIndex);

            return new EmbedBuilder()
                .setTitle("Daftar Kata yang Difilter")
                .setColor(interaction.client.config.embed.default)
                .setDescription(
                    pageItems.length > 0
                        ? pageItems
                              .map(
                                  (word, index) =>
                                      `**${startIndex + index + 1}.** ${word}`
                              )
                              .join("\n")
                        : "Tidak ada kata yang terfilter."
                )
                .addFields(
                    {
                        name: "Halaman",
                        value: `**${page} / ${maxPages}**`,
                        inline: true,
                    },
                    {
                        name: "Jumlah Kata",
                        value: `**${filter.length}** kata`,
                        inline: true,
                    }
                )
                .setFooter({
                    text: `Filter Kata | Terakhir diperbarui`,
                    iconURL: interaction.client.user.avatarURL(),
                })
                .setTimestamp(lastUpdated);
        }

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("prev")
                .setLabel("Sebelumnya")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === 1),
            new ButtonBuilder()
                .setCustomId("next")
                .setLabel("Selanjutnya")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === maxPages)
        );

        const message = await interaction.reply({
            embeds: [generateEmbed(currentPage)],
            components: [row],
            fetchReply: true, // Penting untuk mengumpulkan pesan
        });

        const collector = message.createMessageComponentCollector({
            time: 60000,
        });

        collector.on("collect", async (i) => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({
                    content: "Anda tidak bisa menggunakan tombol ini.",
                    ephemeral: true,
                });
            }

            if (i.customId === "prev" && currentPage > 1) {
                currentPage--;
            } else if (i.customId === "next" && currentPage < maxPages) {
                currentPage++;
            }

            row.components[0].setDisabled(currentPage === 1);
            row.components[1].setDisabled(currentPage === maxPages);

            await i.update({
                embeds: [generateEmbed(currentPage)],
                components: [row],
            });
        });

        collector.on("end", () => {
            interaction.editReply({ components: [] }).catch(console.error);
        });
    },
};
