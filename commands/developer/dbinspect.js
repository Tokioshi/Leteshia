// dbinspect.js
const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName("dbinspect")
        .setDescription("Inspect values in quick.db")
        .addStringOption((opt) =>
            opt
                .setName("key")
                .setDescription(
                    "Key yang mau dilihat (kosongkan untuk lihat semua key)"
                )
                .setRequired(false)
        ),

    async execute(interaction) {
        if (
            interaction.user.id !== interaction.client.config.developer.tokioshy
        ) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Gagal")
                        .setColor(interaction.client.config.embed.fail)
                        .setDescription(
                            "This command is only available for developer."
                        ),
                ],
                flags: MessageFlags.Ephemeral,
            });
        }

        const key = interaction.options.getString("key");

        try {
            if (key) {
                const value = await db.get(key);
                if (value === null || value === undefined) {
                    return interaction.reply({
                        content: `❌ Tidak ada data dengan key \`${key}\``,
                        flags: [MessageFlags.Ephemeral],
                    });
                }
                return interaction.reply({
                    content: `\`\`\`json\n${JSON.stringify(
                        value,
                        null,
                        2
                    ).slice(0, 1900)}\n\`\`\``,
                    flags: [MessageFlags.Ephemeral],
                });
            } else {
                const all = await db.all();
                if (!all || all.length === 0) {
                    return interaction.reply({
                        content: "❌ Database kosong.",
                        flags: [MessageFlags.Ephemeral],
                    });
                }

                const preview = all.slice(0, 10);
                return interaction.reply({
                    content: `\`\`\`json\n${JSON.stringify(
                        preview,
                        null,
                        2
                    ).slice(0, 1900)}\n\`\`\`\n🔍 Menampilkan ${
                        preview.length
                    } dari ${all.length} key.`,
                    flags: [MessageFlags.Ephemeral],
                });
            }
        } catch (err) {
            console.error(err);
            return interaction.reply({
                content: `❌ Error: ${err.message}`,
                flags: [MessageFlags.Ephemeral],
            });
        }
    },
};
