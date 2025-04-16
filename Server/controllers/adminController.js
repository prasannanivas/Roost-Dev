// controllers/adminDocumentController.js

const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");
const { Readable } = require("stream");
const ClientUser = require("../models/ClientUser");
const { Reward, RewardsClaims } = require("../models/Reward");
const DocumentRequest = require("../models/schemas/DocumentRequest");
const Activity = require("../models/schemas/Activity");

let bucket;
const conn = mongoose.connection;
conn.once("open", () => {
  bucket = new GridFSBucket(conn.db, {
    bucketName: "uploads",
  });
});

exports.getAllClients = async (req, res) => {
  try {
    const clients = await ClientUser.find().lean();
    return res.status(200).json({ clients });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return res.status(500).json({ error: error.message });
  }
};
/**
 * GET /admin/documents/pending
 * Retrieves all documents with status="Submitted" across all clients
 */
exports.getPendingDocuments = async (req, res) => {
  try {
    // Find all clients who have at least one "Submitted" document
    // We'll select only the fields we need: name, documents
    const clients = await ClientUser.find({ "documents.status": "Submitted" })
      .select("name email documents")
      .lean();
    // .lean() returns plain JS objects instead of Mongoose docs (optional but faster)

    // We'll flatten out the "submitted" docs into an array
    const pending = [];

    for (const client of clients) {
      // each client has multiple docs in client.documents
      for (const doc of client.documents) {
        if (doc.status === "Submitted") {
          pending.push({
            clientId: client._id,
            clientName: client.name,
            clientEmail: client.email,
            docId: doc._id,
            docType: doc.docType,
            fileName: doc.fileName,
            status: doc.status,
          });
        }
      }
    }

    return res.status(200).json({ pending });
  } catch (error) {
    console.error("Error fetching pending docs:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * PATCH /admin/documents/:clientId/:docId/review
 * Update a document's status to "Approved" or "Rejected"
 */
exports.reviewDocument = async (req, res) => {
  try {
    const { clientId, docId } = req.params;
    const { newStatus } = req.body; // e.g. { newStatus: "Approved" } or "Rejected"

    // Validate newStatus
    if (!["Approved", "Rejected"].includes(newStatus)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // Find the client
    const client = await ClientUser.findById(clientId);
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    // Find the subdocument
    const doc = client.documents.id(docId);
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Update status
    doc.status = newStatus;
    await client.save();

    return res.status(200).json({
      message: "Document status updated",
      document: {
        _id: doc._id,
        docType: doc.docType,
        fileName: doc.fileName,
        status: doc.status,
      },
    });
  } catch (error) {
    console.error("Error reviewing document:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.addNewReward = async (req, res) => {
  console.log(req);
  try {
    const { rewardName, rewardAmount, rewardFor } = req.body;
    const rewardData = {
      rewardName,
      rewardAmount,
      rewardFor,
      isVisible: true,
    };

    if (req.file) {
      const readStream = Readable.from(req.file.buffer);
      const uploadStream = bucket.openUploadStream(req.file.originalname, {
        contentType: req.file.mimetype,
      });

      const fileId = uploadStream.id;

      await new Promise((resolve, reject) => {
        readStream.pipe(uploadStream).on("error", reject).on("finish", resolve);
      });

      rewardData.image = {
        fileId: fileId,
        filename: req.file.originalname,
      };
    }

    const newReward = new Reward(rewardData);
    await newReward.save();
    return res
      .status(201)
      .json({ message: "Reward added successfully", reward: newReward });
  } catch (error) {
    console.error("Error adding reward:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.getRewards = async (req, res) => {
  try {
    const rewards = await Reward.find().lean();

    // Add image URLs to each reward
    const rewardsWithImages = rewards.map((reward) => ({
      ...reward,
      imageUrl: reward.image
        ? `/admin/api/images/${reward.image.fileId}`
        : null,
    }));

    return res.status(200).json(rewardsWithImages);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.deleteReward = async (req, res) => {
  try {
    const { rewardId } = req.params;
    const reward = await Reward.findById(rewardId);

    // Delete image from GridFS if exists
    if (reward.image?.fileId) {
      await bucket.delete(new mongoose.Types.ObjectId(reward.image.fileId));
    }

    await Reward.findByIdAndDelete(rewardId);
    return res.status(200).json({ message: "Reward deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.updateReward = async (req, res) => {
  try {
    const { rewardId } = req.params;
    const updateData = {};

    // Only add fields that are present in the request
    if (req.body.rewardName !== undefined)
      updateData.rewardName = req.body.rewardName;
    if (req.body.rewardAmount !== undefined)
      updateData.rewardAmount = req.body.rewardAmount;
    if (req.body.rewardFor !== undefined)
      updateData.rewardFor = req.body.rewardFor;
    if (req.body.isVisible !== undefined)
      updateData.isVisible = req.body.isVisible;

    if (req.file) {
      // Delete old file if exists
      const oldReward = await Reward.findById(rewardId);
      if (oldReward?.image?.fileId) {
        await bucket.delete(
          new mongoose.Types.ObjectId(oldReward.image.fileId)
        );
      }

      const readStream = Readable.from(req.file.buffer);
      const uploadStream = bucket.openUploadStream(req.file.originalname, {
        contentType: req.file.mimetype,
      });

      const fileId = uploadStream.id;

      await new Promise((resolve, reject) => {
        readStream.pipe(uploadStream).on("error", reject).on("finish", resolve);
      });

      updateData.image = {
        fileId: fileId,
        filename: req.file.originalname,
      };
    }

    const updatedReward = await Reward.findByIdAndUpdate(rewardId, updateData, {
      new: true,
    });
    return res
      .status(200)
      .json({ message: "Reward updated successfully", reward: updatedReward });
  } catch (error) {
    console.error("Error updating reward:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.toggleRewardVisibility = async (req, res) => {
  try {
    const { rewardId } = req.params; // Get the reward ID from the request parameters
    const reward = await Reward.findById(rewardId); // Find the reward by its ID
    if (!reward) {
      return res.status(404).json({ error: "Reward not found" });
    }
    reward.isVisible = !reward.isVisible; // Toggle the isVisible field
    await reward.save(); // Save the updated reward
    return res
      .status(200)
      .json({ message: "Reward visibility toggled successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getClaimedRewards = async (req, res) => {
  try {
    const rewards = await RewardsClaims.find();
    return res.status(200).json(rewards); // Return the array of rewards
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.updateClaimedRewards = async (req, res) => {
  try {
    const { rewardId } = req.params;
    const { status, trackingId } = req.body;
    const reward = await RewardsClaims.findById(rewardId);
    if (!reward) {
      return res.status(404).json({ error: "Reward not found" });
    }
    reward.status = status; // Update the status field
    if (trackingId) {
      reward.deliveryDetails.trackingId = trackingId; // Update the tracking number if provided
    }

    console.log("Updated reward:", reward); // Log the updated reward object
    await reward.save(); // Save the updated reward
    return res
      .status(200)
      .json({ message: "Reward status updated successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.requestDocument = async (req, res) => {
  try {
    const { clientId, docType, type, displayName } = req.body;
    const client = await ClientUser.findById(clientId);
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }
    const newRequest = new DocumentRequest({
      client: clientId,
      docType,
      type,
      displayName: displayName || docType,
    });
    await newRequest.save();
    return res.status(201).json({
      message: "Document request created successfully",
      request: newRequest,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// Add a new endpoint to serve images
exports.getImage = async (req, res) => {
  try {
    const { fileId } = req.params;
    const downloadStream = bucket.openDownloadStream(
      new mongoose.Types.ObjectId(fileId)
    );
    downloadStream.pipe(res);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getActivity = async (req, res) => {
  try {
    const activities = await Activity.find();

    return res.status(200).json(activities);
  } catch (error) {
    console.error("Error fetching activity:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.deleteActivity = async (req, res) => {
  try {
    const { activityId } = req.params;
    await Activity.findByIdAndDelete(activityId);
    return res.status(200).json({ message: "Activity deleted successfully" });
  } catch (error) {
    console.error("Error deleting activity:", error);
    return res.status(500).json({ error: "Server error" });
  }
};
exports.updateActivityStatus = async (req, res) => {
  try {
    const { activityId } = req.params;
    const { status } = req.body;
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ error: "Activity not found" });
    }
    activity.activity_status = status; // Update the status field
    await activity.save(); // Save the updated activity
    return res
      .status(200)
      .json({ message: "Activity status updated successfully" });
  } catch (error) {
    console.error("Error updating activity status:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.createActivity = async (activityData) => {
  const { type } = activityData;

  const submissionData = {};

  if (!type) {
    console.error("Activity type is required");
    return;
  }
  if (
    type !== "Reward_Claimed" &&
    type !== "Updated_Files" &&
    type !== "New_Client"
  ) {
    console.error("Invalid activity type:", type);
    return;
  }

  submissionData.type = type;

  if (type === "Reward_Claimed") {
    submissionData.realtor_who_claimed = activityData.realtor_who_claimed;
    submissionData.realtorName_who_claimed =
      activityData.realtorName_who_claimed;
    submissionData.reward_claimed_for = activityData.reward_claimed_for;
    submissionData.reward = activityData.reward;
    submissionData.rewardName = activityData.rewardName;
  } else if (type === "Updated_Files") {
    submissionData.client = activityData.client;
    submissionData.document_submitted = activityData.document_submitted;
    submissionData.clientName = activityData.clientName;
  } else if (type === "New_Client") {
    submissionData.client = activityData.client;
    submissionData.clientName = activityData.clientName;
  } else {
    console.error("Invalid activity type:", type);
    return;
  }

  try {
    const activity = new Activity(submissionData);
    await activity.save();
  } catch (error) {
    console.error("Error creating activity:", error);
  }
};
