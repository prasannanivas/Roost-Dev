// controllers/realtorAuthController.js
const RealtorUser = require("../models/RealtorUser");
const ClientUser = require("../models/ClientUser");
const Invite = require("../models/Invite");
const fs = require("fs");
const csv = require("csv-parser");
const { hashPassword, comparePassword } = require("../utils/hash");
const { sendInviteNotification } = require("../utils/notifications.js");
const { getGridFsBucket } = require("../config/gridfs.js"); // Adjust the path as needed
const jwt = require("jsonwebtoken");
const DocumentRequest = require("../models/schemas/DocumentRequest.js");
const { RewardsClaims, Reward } = require("../models/Reward");
const { createActivity } = require("./adminController.js");

// 1. Realtor Signup
exports.realtorSignup = async (req, res) => {
  try {
    const { name, phone, email, location, password, brokerageInfo } = req.body;

    const passwordHash = await hashPassword(password);

    // Generate refresh token
    const refreshToken = jwt.sign(
      { email, phone },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    const newRealtor = await RealtorUser.create({
      name,
      phone,
      email,
      location,
      passwordHash,
      brokerageInfo,
      refreshToken, // Store refresh token in DB
    });

    // Generate access token
    const accessToken = jwt.sign(
      {
        id: newRealtor._id,
        email: newRealtor.email,
        phone: newRealtor.phone,
        role: "realtor",
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" }
    );

    // Handle invite if exists
    let invite = await Invite.findOne({
      inviteType: "realtor",
      status: "PENDING",
      $or: [{ phone }, { email }],
    });
    if (invite) {
      // Mark invite as accepted
      invite.inviteeId = newRealtor._id;
      invite.status = "ACCEPTED";
      await invite.save();

      // Award points to the realtor who invited
      const realtor = await RealtorUser.findById(invite.inviterId);
      if (realtor) {
        // Suppose +5 points for a new client signup, or +1 as your logic dictates
        const pointsToAdd = 2;
        realtor.points += pointsToAdd;
        realtor.pointsHistory.push({
          points: pointsToAdd,
          reason: "Realtor Signed Up via Invite" + newRealtor._id,
        });
        await realtor.save();
      }
    }

    return res.status(201).json({
      message: "Realtor signup successful",
      realtor: {
        id: newRealtor._id,
        name: newRealtor.name,
        phone: newRealtor.phone,
        email: newRealtor.email,
        brokerageInfo: newRealtor.brokerageInfo,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// 2. Realtor Login
exports.realtorLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // figure out if identifier is phone or email
    let realtor = await RealtorUser.findOne({ phone: identifier });
    if (!realtor) {
      realtor = await RealtorUser.findOne({ email: identifier });
    }
    if (!realtor) {
      return res.status(404).json({ error: "Realtor not found" });
    }

    // Compare password
    const isMatch = await comparePassword(password, realtor.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Generate new refresh token
    const refreshToken = jwt.sign(
      { email: realtor.email, phone: realtor.phone },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    // Update refresh token in database
    realtor.refreshToken = refreshToken;
    await realtor.save();

    // Generate access token
    const accessToken = jwt.sign(
      {
        id: realtor._id,
        email: realtor.email,
        phone: realtor.phone,
        role: "realtor",
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      message: "Realtor login successful",
      realtor: {
        id: realtor._id,
        name: realtor.name,
        email: realtor.email,
        phone: realtor.phone,
        brokerageInfo: realtor.brokerageInfo,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
// 3. Invite a Client
exports.inviteClient = async (req, res) => {
  try {
    const { realtorId } = req.params;
    const { phone, email, referenceName } = req.body; // Contact for the invited client

    const realtor = await RealtorUser.findById(realtorId);
    if (!realtor) {
      return res.status(404).json({ error: "Realtor not found" });
    }

    // Create invite
    const invite = await Invite.create({
      inviterId: realtor._id,
      inviteType: "client",
      phone,
      email,
      status: "PENDING",
    });

    // Append to RealtorUser.invites
    realtor.invites.push({ referenceName, inviteId: invite._id });
    await realtor.save();

    await sendInviteNotification(realtor, email, phone, referenceName);

    return res.status(201).json({
      message: "Client invite created successfully",
      invite,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

exports.inviteBulkClient = async (req, res) => {
  try {
    const { realtorId } = req.params;
    const realtor = await RealtorUser.findById(realtorId);
    if (!realtor) {
      return res.status(404).json({ error: "Realtor not found" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "CSV file is required" });
    }

    const results = [];
    // Parse the CSV file
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        const invites = [];
        const errors = [];

        // Process each row from the CSV file
        for (const row of results) {
          // Extract fields using the new header names
          const fullName = row["Full Name"];
          const email = row["email"];
          const phone = row["phone"];

          // Validate that all required fields are present
          if (!fullName || !email || !phone) {
            errors.push({ row, error: "Missing required fields" });
            continue;
          }

          try {
            // Create invite using the extracted values
            const invite = await Invite.create({
              inviterId: realtor._id,
              inviteType: "client",
              phone,
              email,
              status: "PENDING",
            });

            // Append invite to RealtorUser using fullName as the reference name
            realtor.invites.push({
              referenceName: fullName,
              inviteId: invite._id,
            });

            // Send invite notification
            await sendInviteNotification(realtor, email, phone, fullName);

            invites.push(invite);
          } catch (error) {
            // If there's an error with this row, record the error along with the row data
            errors.push({ row, error: error.message });
          }
        }

        // Save the updated realtor with all new invites
        await realtor.save();

        return res.status(201).json({
          message: "Bulk client invites created successfully",
          invites,
          errors,
        });
      });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// 4. Invite Another Realtor
exports.inviteRealtor = async (req, res) => {
  try {
    const { realtorId } = req.params;
    const { phone, email, referenceName } = req.body;

    const realtor = await RealtorUser.findById(realtorId);
    if (!realtor) {
      return res.status(404).json({ error: "Realtor not found" });
    }

    const invite = await Invite.create({
      inviterId: realtor._id,
      inviteType: "realtor",
      phone,
      email,
      status: "PENDING",
    });

    realtor.invites.push({ referenceName, inviteId: invite._id });
    await realtor.save();

    await sendInviteNotification(email, phone, referenceName);

    return res.status(201).json({
      message: "Realtor invite created successfully",
      invite,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

exports.getInvitees = async (req, res) => {
  const { realtorId } = req.params;

  try {
    const realtor = await RealtorUser.findById(realtorId);

    if (!realtor) {
      throw new Error("Realtor not found");
    }
    const invitedClients = await Invite.find({
      _id: { $in: realtor.invites.map(({ inviteId }) => inviteId) },
    }).populate("inviteeId", "name phone email");

    const invitedClientsWithReferenceName = await Promise.all(
      invitedClients.map(async (invite) => {
        const referenceName = realtor.invites.find(
          (realtorInvite) =>
            realtorInvite.inviteId.toString() === invite._id.toString()
        ).referenceName;

        const client = await ClientUser.findById(invite.inviteeId);

        return {
          ...invite.toObject(),
          referenceName,
          documents: client ? client.documents : [],
        };
      })
    );

    res.status(200).json(invitedClientsWithReferenceName);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getRealtorInfo = async (req, res) => {
  try {
    const realtor = await RealtorUser.findById(req.params.realtorId);
    if (!realtor) {
      return res.status(404).json({ error: "Realtor not found" });
    }
    return res.status(200).json(realtor);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

exports.updateRealtorInfo = async (req, res) => {
  try {
    const { realtorId } = req.params;
    const { name, phone, email, location, brokerageInfo } = req.body;
    const realtor = await RealtorUser.findById(realtorId);
    if (!realtor) {
      return res.status(404).json({ error: "Realtor not found" });
    }
    realtor.name = name || realtor.name;
    realtor.phone = phone || realtor.phone;
    realtor.email = email || realtor.email;
    realtor.location = location || realtor.location;
    realtor.brokerageInfo = { ...realtor.brokerageInfo, ...brokerageInfo };
    await realtor.save();
    return res
      .status(200)
      .json({ message: "Realtor info updated successfully" });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

exports.updateRealtorPassword = async (req, res) => {
  try {
    const { realtorId } = req.params;
    const { oldPassword, newPassword } = req.body;

    const realtor = await RealtorUser.findById(realtorId);
    if (!realtor) {
      return res.status(404).json({ error: "Realtor not found" });
    }

    const isMatch = await comparePassword(oldPassword, realtor.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    realtor.passwordHash = await hashPassword(newPassword);
    await realtor.save();

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

exports.updateProfilePicture = async (req, res) => {
  const realtorId = req.params.realtorId;

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const bucket = getGridFsBucket();

  // Create a read stream from the temporarily stored file
  const readStream = fs.createReadStream(req.file.path);

  // Open an upload stream to GridFS using the file's original name or a custom name
  const uploadStream = bucket.openUploadStream(req.file.filename, {
    contentType: req.file.mimetype,
  });

  // Pipe the file into GridFS
  readStream
    .pipe(uploadStream)
    .on("error", (err) => {
      console.error("Error uploading to GridFS:", err);
      return res.status(500).json({
        message: "Error uploading file to GridFS",
        error: err.message,
      });
    })
    .on("finish", async () => {
      // The file is now stored in GridFS. Get its ObjectId from uploadStream.id.
      const fileId = uploadStream.id;

      try {
        // Update the RealtorUser document with the GridFS file id
        const realtor = await RealtorUser.findByIdAndUpdate(
          realtorId,
          { profilePicture: fileId },
          { new: true }
        );

        if (!realtor) {
          return res.status(404).json({
            message: "Realtor not found or error updating profile picture",
          });
        }

        // Optionally, delete the temporary file after successful upload
        fs.unlink(req.file.path, (unlinkErr) => {
          if (unlinkErr) {
            console.error("Error deleting temporary file:", unlinkErr);
          }
        });

        res.json({ message: "Profile picture added successfully", realtor });
      } catch (err) {
        res.status(500).json({
          message: "Error updating profile picture",
          error: err.message,
        });
      }
    });
};

exports.getProfilePicture = async (req, res) => {
  const realtorId = req.params.realtorId;

  try {
    const realtor = await RealtorUser.findById(realtorId);
    if (!realtor || !realtor.profilePicture) {
      return res.status(404).json({ message: "Profile picture not found" });
    }

    const bucket = getGridFsBucket();
    // Directly open a download stream using the stored ObjectId
    const downloadStream = bucket.openDownloadStream(realtor.profilePicture);

    downloadStream.on("file", (file) => {
      // Optionally validate content type here
      if (
        file.contentType !== "image/jpeg" &&
        file.contentType !== "image/png" &&
        file.contentType !== "image/webp" &&
        file.contentType !== "image/heic" &&
        file.contentType !== "image/heif"
      ) {
        return res.status(400).json({ message: "File is not an image" });
      }
      res.set("Content-Type", file.contentType);
    });

    downloadStream.on("error", (err) => {
      return res.status(404).json({
        message: "Profile picture file not found",
        error: err.message,
      });
    });

    // Pipe the file stream directly to the response
    downloadStream.pipe(res);
  } catch (err) {
    res.status(500).json({
      message: "Error retrieving profile picture",
      error: err.message,
    });
  }
};

// exports.requestDocument = async (req, res) => {
//   try {
//     const { realtorId } = req.params;
//     const { clientId, docType } = req.body;
//     const realtor = await RealtorUser.findById(realtorId);
//     if (!realtor) {
//       return res.status(404).json({ error: "Realtor not found" });
//     }
//     const client = await ClientUser.findById(clientId);
//     if (!client) {
//       return res.status(404).json({ error: "Client not found" });
//     }
//     const newRequest = new DocumentRequest({
//       client: clientId,
//       realtor: realtorId,
//       docType,
//     });
//     await newRequest.save();
//     return res.status(201).json({
//       message: "Document request created successfully",
//       request: newRequest,
//     });
//   } catch (error) {
//     return res.status(400).json({ error: error.message });
//   }
// };

// exports.getRequestedDocuments = async (req, res) => {
//   try {
//     const { realtorId } = req.params;
//     const { clientId } = req.body;

//     if (!clientId || !realtorId) {
//       return res.status(400).json({
//         error: "Invalid request - Both clientId and realtorId are required",
//       });
//     }

//     const requests = await DocumentRequest.find({
//       realtor: realtorId,
//       client: clientId,
//     });
//     return res.status(200).json(requests);
//   } catch (error) {
//     return res.status(400).json({ error: error.message });
//   }
// };

exports.claimRewards = async (req, res) => {
  try {
    const { rewardId, realtorId, to, toAddress, clientId, targetRealtorId } =
      req.body;

    const claimData = {
      rewardId,
      realtorId,
      to,
      toAddress,
      status: "PENDING",
    };

    const realtor = await RealtorUser.findById(realtorId);
    const reward = await Reward.findById(rewardId);
    claimData.realtorName = realtor.name;
    claimData.rewardName = reward.rewardName;

    if (!realtor) {
      return res.status(404).json({ error: "Realtor not found" });
    }
    if (!reward) {
      return res.status(404).json({ error: "Reward not found" });
    }

    if (realtor.points < reward.rewardAmount / 3.14) {
      console.log(
        `Realtor has only ${realtor.points} Points/s but this required ${
          reward.rewardAmount / 3.14
        } Point/s`
      );
      return res.status(400).json({
        message: `Realtor has only ${
          realtor.points
        } Amount/s but this required ${reward.rewardAmount / 3.14} Amount/s`,
        error: "Not enough points to claim this reward",
      });
    }

    // Add clientId or targetRealtorId based on 'to' type
    if (to === "Client" && clientId) {
      const client = await ClientUser.findById(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      claimData.clientId = clientId;
    } else if (to === "Realtor" && targetRealtorId) {
      const targetRealtor = await RealtorUser.findById(targetRealtorId);
      if (!targetRealtor) {
        return res.status(404).json({ error: "Target realtor not found" });
      }
      claimData.targetRealtorId = targetRealtorId;
    }

    let newClaim;
    try {
      newClaim = await RewardsClaims.create(claimData);
      console.log(newClaim);

      // Deduct points from realtor
      const pointsToDeduct = Math.ceil(reward.rewardAmount / 3.14);
      realtor.points -= pointsToDeduct;
      realtor.pointsHistory.push({
        points: -pointsToDeduct,
        reason: `Claimed reward: ${reward.rewardName || reward._id}`,
      });
      await realtor.save();

      reward.rewardClaimed += 1;
      await reward.save();

      try {
        // Create activity log for the claim
        const activity = {
          type: "Reward_Claimed",
          reward: reward._id,
          rewardName: reward.rewardName,
          realtor_who_claimed: realtor._id,
          realtorName_who_claimed: realtor.name,
          reward_claimed_for: to,
          client: clientId || targetRealtorId,
        };

        await createActivity(activity);
      } catch (error) {
        console.error("Error saving activity:", error);
      }

      return res.status(200).json({
        success: true,
        message: "Rewards claimed successfully",
        claim: newClaim,
        pointsDeducted: pointsToDeduct,
        remainingPoints: realtor.points,
      });
    } catch (saveError) {
      // If there was an error saving, try to rollback any changes
      if (newClaim?._id) {
        await RewardsClaims.findByIdAndDelete(newClaim._id);
      }
      throw saveError;
    }
  } catch (error) {
    console.error("Error in claimRewards:", error);
    return res.status(500).json({
      message: "Error claiming reward",
      error: error.message,
    });
  }
};
