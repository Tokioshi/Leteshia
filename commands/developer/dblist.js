// dblist.js
const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
} = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName("dblist")
        .setDescription("List all keys in quick.db (max 20 untuk preview)"),

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

        try {
            const all = await db.all();

            if (!all || all.length === 0) {
                return interaction.reply({
                    content: "❌ Database kosong.",
                    flags: [MessageFlags.Ephemeral],
                });
            }

            const keys = all.map((entry) => entry.id);
            const preview = keys.slice(0, 20);

            let replyMsg = `📂 Ada total **${keys.length}** key di database.\n`;
            replyMsg += "```yaml\n" + preview.join("\n") + "\n```";

            if (keys.length > preview.length) {
                replyMsg += `\n… dan ${keys.length - preview.length} key lain.`;
            }

            return interaction.reply({
                content: replyMsg,
                flags: [MessageFlags.Ephemeral],
            });
        } catch (err) {
            console.error(err);
            return interaction.reply({
                content: `❌ Error: ${err.message}`,
                flags: [MessageFlags.Ephemeral],
            });
        }
    },
};
