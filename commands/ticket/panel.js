const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("panel")
        .setDescription("Kirim panel Tiket ke saluran saat ini")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setContexts(0),
    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });

        const embed = new EmbedBuilder()
            .setColor("#ce0200")
            .setTitle("Layanan Tiket Harmony")
            .setDescription(
                "Untuk membuat tiket (bertanya/pembelian), silakan klik tombol di bawah. Pilih kategori 'Membeli' atau 'Bertanya'. Mohon tidak membuat tiket ganda atau tanpa tujuan jelas!"
            )
            .setImage(
                "https://i.pinimg.com/1200x/5c/ff/be/5cffbe0205462492b0d7fae908db8929.jpg"
            );

        const buy = new ButtonBuilder()
            .setCustomId("buy")
            .setLabel("Membeli")
            .setEmoji("🏷️")
            .setStyle(ButtonStyle.Primary);

        const ask = new ButtonBuilder()
            .setCustomId("ask")
            .setLabel("Bertanya")
            .setEmoji("✋")
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(buy, ask);

        interaction.channel
            .send({
                embeds: [embed],
                components: [row],
            })
            .then(() => {
                interaction.editReply({ content: "Sent!" });
            });
    },
};
