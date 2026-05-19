const mongoose = require("mongoose");

const historyEntrySchema = new mongoose.Schema(
    {
        role: { type: String, required: true, enum: ["user", "assistant"] },
        text: { type: String, required: true },
    },
    { _id: false },
);

const aiSessionSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    history: { type: [historyEntrySchema], default: [] },
    lastTimestamp: { type: Number, default: null },
});

// Compound unique index — satu sesi per user per guild
aiSessionSchema.index({ guildId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("AISession", aiSessionSchema);
