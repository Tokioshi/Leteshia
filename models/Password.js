const mongoose = require("mongoose");

const passwordEntrySchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        password: { type: String, required: true },
        createdAt: { type: Number, default: () => Date.now() },
    },
    { _id: false },
);

const passwordSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true, index: true },
    entries: { type: [passwordEntrySchema], default: [] },
});

module.exports = mongoose.model("Password", passwordSchema);
