// models/RealtorUser.js
const mongoose = require("mongoose");

const documentRequestSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ClientUser",
    required: true,
  },
  realtor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RealtorUser",
    required: true,
  },
  docType: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: "PENDING",
  },
});

module.exports = mongoose.model("DocumentRequest", documentRequestSchema);
