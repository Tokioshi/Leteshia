const {
    SlashCommandBuilder,
    EmbedBuilder,
    LabelBuilder,
    ModalBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    UserSelectMenuBuilder,
    FileUploadBuilder,
    PermissionFlagsBits,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("testimoni")
        .setDescription("Membuat testimoni baru")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setContexts(0),
    async execute(interaction) {
        if (
            interaction.user.id !== interaction.client.config.developer.tokioshy
        ) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setTitle("Gagal")
                        .setDescription(
                            "Anda tidak berwenang untuk menjalankan perintah ini!"
                        ),
                ],
                flags: 64,
            });
        }

        interaction.showModal(
            new ModalBuilder()
                .setTitle("Testimoni Form")
                .setCustomId("testimoni")
                .addLabelComponents(
                    new LabelBuilder()
                        .setLabel("Sebutkan Pelanggan Yang Membeli")
                        .setUserSelectMenuComponent(
                            new UserSelectMenuBuilder()
                                .setCustomId("customer")
                                .setPlaceholder("Pilih Customer")
                        )
                )
                .addLabelComponents(
                    new LabelBuilder()
                        .setLabel("Sebutkan Produk Yang Dibeli")
                        .setStringSelectMenuComponent(
                            new StringSelectMenuBuilder()
                                .setCustomId("product")
                                .setPlaceholder("Pilih Paket")
                                .addOptions(
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel("Discord Bot - Basic 1")
                                        .setValue("Basic 1"),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel("Discord Bot - Basic 2")
                                        .setValue("Basic 2"),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel("Discord Bot - Basic 3")
                                        .setValue("Basic 3"),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel(
                                            "Discord Bot - Intermediate 1"
                                        )
                                        .setValue("Intermediate 1"),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel(
                                            "Discord Bot - Intermediate 2"
                                        )
                                        .setValue("Intermediate 2"),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel(
                                            "Discord Bot - Intermediate 3"
                                        )
                                        .setValue("Intermediate 3"),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel("Discord Bot - Advanced 1")
                                        .setValue("Advanced 1"),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel("Discord Bot - Advanced 2")
                                        .setValue("Advanced 2"),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel("Discord Bot - Advanced 3")
                                        .setValue("Advanced 3"),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel(
                                            "Discord Server - Paket Dasar"
                                        )
                                        .setValue("Basic"),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel(
                                            "Discord Server - Paket Reguler"
                                        )
                                        .setValue("Reguler"),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel("Discord Server - Paket Lite")
                                        .setValue("Lite"),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel(
                                            "Discord Server - Paket Enterprise"
                                        )
                                        .setValue("Enterprise")
                                )
                        )
                )
                .addLabelComponents(
                    new LabelBuilder()
                        .setLabel("Screenshot Dari Produk Akhir")
                        .setFileUploadComponent(
                            new FileUploadBuilder().setCustomId("screenshot")
                        )
                )
        );
    },
};
