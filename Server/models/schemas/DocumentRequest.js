// models/RealtorUser.js
const mongoose = require("mongoose");

const documentRequestSchema = new mongoose.Schema({
  displayName: {
    type: String,
  },

  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ClientUser",
    required: true,
  },
  docType: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: "Pending",
  },
  type: {
    type: String,
    enum: ["Needed", "Needed-other"],
    default: "Needed",
  },
});

module.exports = mongoose.model("DocumentRequest", documentRequestSchema);
