// models/Invite.js
const mongoose = require("mongoose");

const rewardSchema = new mongoose.Schema(
  {
    rewardName: { type: String, required: true },
    rewardImage: { type: String, required: false },
    rewardAmount: { type: Number, required: true },
    rewardFor: { type: String, required: true },
    rewardClaimed: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
    image: {
      fileId: { type: mongoose.Schema.Types.ObjectId },
      filename: String,
    },
  },
  { timestamps: true }
);

const rewardsClaims = new mongoose.Schema({
  rewardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "reward",
    required: true,
  },
  realtorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RealtorUser",
    required: true,
  },
  to: {
    type: String,
    enum: ["Client", "Realtor", "Charity"],
    required: true,
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: function () {
      return this.to === "Client";
    },
  },
  targetRealtorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RealtorUser",
    required: function () {
      return this.to === "Realtor";
    },
  },
  toAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
  },
  status: { type: String, default: "PENDING" },
  claimedAt: { type: Date, default: Date.now },
});

const Reward = mongoose.model("Reward", rewardSchema);
const RewardsClaims = mongoose.model("RewardsClaims", rewardsClaims);

module.exports = { Reward, RewardsClaims };
