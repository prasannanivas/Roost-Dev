// models/Invite.js
const mongoose = require("mongoose");

const inviteSchema = new mongoose.Schema(
  {
    inviterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RealtorUser",
      required: true,
    },
    inviteType: { type: String, enum: ["client", "realtor"], required: true },
    phone: { type: String }, // If inviting via phone
    email: { type: String }, // If inviting via email
    inviteeId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      // could be ClientUser or RealtorUser
    },
    status: { type: String, default: "PENDING" }, // "PENDING" | "ACCEPTED" | "EXPIRED" ...
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invite", inviteSchema);
