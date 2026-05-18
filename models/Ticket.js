const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
    channelId: { type: String, required: true, unique: true, index: true },
    ownerId: { type: String, required: true },
});

module.exports = mongoose.model("Ticket", ticketSchema);
