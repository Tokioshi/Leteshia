const { Events, EmbedBuilder, MessageFlags } = require("discord.js");

module.exports = {
    name: Events.MessageReactionAdd,
    async execute(reaction, user) {
        if (user.bot) return;

        const targetMessageId = "1372959468958257153";

        if (reaction.message.id !== targetMessageId) return;

        if (reaction.emoji.name === "✅") {
            try {
                if (reaction.partial) {
                    await reaction.fetch();
                }

                const guild = reaction.message.guild;
                const member = await guild.members.fetch(user.id);
                const roleId = "1373289393242112001";

                if (member.roles.cache.has("1373289393242112001")) {
                    await reaction.users
                        .remove(user.id)
                        .catch((error) =>
                            console.error(`Failed to remove reaction: ${error}`)
                        );

                    return reaction.message.channel
                        .send({
                            content: `<@${user.id}>`,
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle("Gagal")
                                    .setColor("#c92424")
                                    .setDescription(
                                        "Kamu sudah terverifikasi!"
                                    ),
                            ],
                            flags: MessageFlags.Ephemeral,
                        })
                        .then((msg) => {
                            setTimeout(() => {
                                msg.delete().catch((error) =>
                                    console.error(
                                        `Failed to delete message: ${error}`
                                    )
                                );
                            }, 7000);
                        });
                }

                await member.roles.add(roleId);

                await reaction.users
                    .remove(user.id)
                    .catch((error) =>
                        console.error(`Failed to remove reaction: ${error}`)
                    );

                await reaction.message.channel
                    .send({
                        content: `<@${user.id}>`,
                        embeds: [
                            new EmbedBuilder()
                                .setTitle("Berhasil Verifikasi!")
                                .setColor("White")
                                .setDescription(
                                    "Kamu berhasil mendapatkan role <@&1373289393242112001>!"
                                )
                                .setFooter({
                                    text: "Role akan menghilang dalam 10 detik...",
                                }),
                        ],
                    })
                    .then((msg) => {
                        setTimeout(() => {
                            msg.delete().catch((error) =>
                                console.error(
                                    `Failed to delete message: ${error}`
                                )
                            );
                        }, 10000);
                    });

                setTimeout(() => {
                    member.roles
                        .remove(roleId)
                        .catch((error) =>
                            console.error(`Failed to remove role: ${error}`)
                        );
                }, 10000);
            } catch (error) {
                console.error(`Error in reaction handler: ${error}`);
            }
        }
    },
};
