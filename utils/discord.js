const { PermissionsBitField, ContainerBuilder, MessageFlags } = require("discord.js");

const isAdmin = (member) => member.permissions.has(PermissionsBitField.Flags.Administrator);

async function sendLong(msg, text) {
    const chunks = splitText(text);

    for (let i = 0; i < chunks.length; i++) {
        const isLast = i === chunks.length - 1;

        const container = new ContainerBuilder().addTextDisplayComponents((td) =>
            td.setContent(chunks[i]),
        );

        if (isLast) {
            container
                .addSeparatorComponents((s) => s)
                .addTextDisplayComponents((td) =>
                    td.setContent("*AI can make mistakes, so please double-check...*"),
                );
        }

        const sendOptions = {
            components: [container],
            flags: MessageFlags.IsComponentsV2,
            allowedMentions: { repliedUser: false },
        };

        if (i === 0) {
            await msg.reply(sendOptions);
        } else {
            await msg.channel.send(sendOptions);
        }
    }
}

function splitText(text, limit = 3900) {
    const chunks = [];
    let current = "";

    for (const line of text.split("\n")) {
        if ((current + "\n" + line).length > limit) {
            if (current) chunks.push(current.trim());
            current = line;
        } else {
            current += (current ? "\n" : "") + line;
        }
    }

    if (current) chunks.push(current.trim());
    return chunks;
}

module.exports = { isAdmin, sendLong };
