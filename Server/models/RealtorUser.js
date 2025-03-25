// models/RealtorUser.js
const mongoose = require("mongoose");

const pointsHistorySchema = new mongoose.Schema(
  {
    points: Number,
    reason: String,
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

const realtorUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    location: { type: String },
    passwordHash: { type: String, required: true },

    brokerageInfo: {
      // You can store dynamic fields here:
      brokerageName: String,
      brokerageAddress: String,
      brokerageCity: String,
      brokeragePostalCode: String,
      brokeragePhone: String,
      brokerageEmail: String,
      licenseNumber: String,
      // Or just keep it as a "Mixed" type if needed
    },

    profilePicture: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    invites: [
      {
        _id: false, // Prevents MongoDB from creating an automatic _id for each subdocument
        referenceName: String,
        inviteId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Invite",
          required: true,
        },
      },
    ],

    points: { type: Number, default: 0 },
    pointsHistory: [pointsHistorySchema],

    // Add this field to your schema
    refreshToken: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RealtorUser", realtorUserSchema);
