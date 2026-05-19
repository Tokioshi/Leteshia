const Knowledge = require("../models/Knowledge");
const AISession = require("../models/AISession");
const { MODEL, getGroqClient } = require("./ai");

const groq = getGroqClient();

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
    try {
        const entry = {
            channelId: channel.id,
            channelName: channel.name,
            summary,
        };

        const result = await Knowledge.findOneAndUpdate(
            { guildId, "channels.channelId": channel.id },
            { $set: { "channels.$": entry } },
        );

        if (!result) {
            await Knowledge.findOneAndUpdate(
                { guildId },
                { $push: { channels: entry } },
                { upsert: true },
            );
        }
    } catch (error) {
        console.error("[Knowledge] addChannelKnowledge error:", error);
        throw error;
    }
}

async function addManualKnowledge(guildId, text) {
    try {
        await Knowledge.findOneAndUpdate(
            { guildId },
            { $push: { manual: { text } } },
            { upsert: true, returnDocument: "after" },
        );
    } catch (error) {
        console.error("[Knowledge] addManualKnowledge error:", error);
        throw error;
    }
}

async function getKnowledge(guildId) {
    try {
        const knowledge = await Knowledge.findOne({ guildId });
        return {
            manual: knowledge?.manual || [],
            channel: knowledge?.channels || [],
        };
    } catch (error) {
        console.error("[Knowledge] getKnowledge error:", error);
        return { manual: [], channel: [] };
    }
}

async function clearKnowledge(guildId) {
    try {
        await Knowledge.findOneAndUpdate(
            { guildId },
            { $set: { manual: [], channels: [] } },
            { upsert: true },
        );
    } catch (error) {
        console.error("[Knowledge] clearKnowledge error:", error);
        throw error;
    }
}

async function resetHistory(guildId, userId) {
    try {
        await AISession.deleteOne({ guildId, userId });
    } catch (error) {
        console.error("[Knowledge] resetHistory error:", error);
        throw error;
    }
}

module.exports = {
    buildChannelKnowledge,
    addChannelKnowledge,
    addManualKnowledge,
    getKnowledge,
    clearKnowledge,
    resetHistory,
};
