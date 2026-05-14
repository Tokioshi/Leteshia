const { QuickDB } = require("quick.db");
const Groq = require("groq-sdk");
const { MODEL } = require("./ai");

const db = new QuickDB();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MAX_KNOWLEDGE_MSGS = 200;

async function buildChannelKnowledge(channel) {
    const msgs = [];
    let lastId;

    while (msgs.length < MAX_KNOWLEDGE_MSGS) {
        const batch = await channel.messages.fetch({ limit: 100, before: lastId });
        if (!batch.size) break;

        batch.forEach((m) => {
            if (!m.author.bot && m.content.trim()) {
                msgs.push(m.content);
            }
        });

        lastId = batch.last().id;
        if (batch.size < 100) break;
    }

    if (!msgs.length) return null;

    const res = await groq.chat.completions.create({
        model: MODEL,
        max_tokens: 1024,
        messages: [
            {
                role: "user",
                content: `Summarize factual info only:\n${msgs.join("\n")}`,
            },
        ],
    });

    return res.choices[0].message.content;
}

async function addChannelKnowledge(guildId, channel, summary) {
    const key = `knowledge_channel_${guildId}`;
    const data = (await db.get(key)) || [];

    const entry = {
        channelId: channel.id,
        channelName: channel.name,
        summary,
    };

    const i = data.findIndex((e) => e.channelId === entry.channelId);
    if (i >= 0) data[i] = entry;
    else data.push(entry);

    await db.set(key, data);
}

async function addManualKnowledge(guildId, text) {
    const key = `knowledge_manual_${guildId}`;
    const data = (await db.get(key)) || [];
    data.push({ text });
    await db.set(key, data);
}

async function getKnowledge(guildId) {
    const [manual, channel] = await Promise.all([
        db.get(`knowledge_manual_${guildId}`).then((v) => v || []),
        db.get(`knowledge_channel_${guildId}`).then((v) => v || []),
    ]);
    return { manual, channel };
}

async function clearKnowledge(guildId) {
    await Promise.all([
        db.delete(`knowledge_manual_${guildId}`),
        db.delete(`knowledge_channel_${guildId}`),
    ]);
}

async function resetHistory(guildId, userId) {
    const { QuickDB } = require("quick.db");
    const db = new QuickDB();
    await db.delete(`history_${guildId}_${userId}`);
}

module.exports = {
    buildChannelKnowledge,
    addChannelKnowledge,
    addManualKnowledge,
    getKnowledge,
    clearKnowledge,
    resetHistory,
};
