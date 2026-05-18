const mongoose = require("mongoose");

const channelKnowledgeSchema = new mongoose.Schema(
    {
        channelId: { type: String, required: true },
        channelName: { type: String, required: true },
        summary: { type: String, required: true },
    },
    { _id: false },
);

const manualKnowledgeSchema = new mongoose.Schema(
    {
        text: { type: String, required: true },
    },
    { _id: false },
);

const knowledgeSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true, index: true },
    manual: { type: [manualKnowledgeSchema], default: [] },
    channels: { type: [channelKnowledgeSchema], default: [] },
});

module.exports = mongoose.model("Knowledge", knowledgeSchema);
