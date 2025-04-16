// models/RealtorUser.js
const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["Reward_Claimed", "Updated_Files", "New_Client"],
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },

  //if type is Reward_Claimed
  reward: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Reward",
  },

  rewardName: {
    type: String,
  },

  //if type is Reward_Claimed, we need to add realtor ID
  realtor_who_claimed: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RealtorUser",
  },

  realtorName_who_claimed: {
    type: String,
  },

  //it can be either realtor or client or charity
  reward_claimed_for: {
    type: String,
  },

  //if type is Updated_Files
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ClientUser",
  },

  clientName: {
    type: String,
  },

  document_submitted: {
    type: String,
  },

  activity_status: {
    type: String,
    enum: ["Pending", "Completed"],
    default: "Pending",
  },
});

module.exports = mongoose.model("Activity", activitySchema);
