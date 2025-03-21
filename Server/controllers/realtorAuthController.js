// controllers/realtorAuthController.js
const RealtorUser = require("../models/RealtorUser");
const ClientUser = require("../models/ClientUser");
const Invite = require("../models/Invite");
const { hashPassword, comparePassword } = require("../utils/hash");
const { sendInviteNotification } = require("../utils/notifications.js");
const jwt = require("jsonwebtoken");

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
      invite.inviteeId = newRealtor._id;
      invite.status = "ACCEPTED";
      await invite.save();

      // Optionally award points to the inviting realtor
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
