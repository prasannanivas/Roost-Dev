// controllers/clientAuthController.js
const ClientUser = require("../models/ClientUser");
const RealtorUser = require("../models/RealtorUser");
const Invite = require("../models/Invite");
const { hashPassword, comparePassword } = require("../utils/hash");
const jwt = require("jsonwebtoken");

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
  return { accessToken, refreshToken };
};

// 1. Client Signup
exports.clientSignup = async (req, res) => {
  try {
    const { name, phone, email, location, password } = req.body;

    // Hash the password
    const passwordHash = await hashPassword(password);

    // Create the client user
    const newClient = await ClientUser.create({
      name,
      phone,
      email,
      location,
      passwordHash,
    });

    // Check if there's a matching Invite (inviteType="client", status="PENDING")
    // that uses this phone or email
    let invite = await Invite.findOne({
      inviteType: "client",
      status: "PENDING",
      $or: [{ phone }, { email }],
    });

    if (invite) {
      // Mark invite as accepted
      invite.inviteeId = newClient._id;
      invite.status = "ACCEPTED";
      await invite.save();

      // Award points to the realtor who invited
      const realtor = await RealtorUser.findById(invite.inviterId);
      if (realtor) {
        // Suppose +5 points for a new client signup, or +1 as your logic dictates
        const pointsToAdd = 1;
        realtor.points += pointsToAdd;
        realtor.pointsHistory.push({
          points: pointsToAdd,
          reason: "Client Signed Up via Invite" + newClient._id,
        });
        await realtor.save();
      }
    }

    const { accessToken, refreshToken } = generateTokens(newClient._id);

    return res.status(201).json({
      message: "Client signup successful",
      client: {
        id: newClient._id,
        name: newClient.name,
        phone: newClient.phone,
        email: newClient.email,
        location: newClient.location,
        documents: newClient.documents,
      },
      invitedBy: invite ? invite.inviterId : null, // Possibly return the ID or let the frontend fetch more details
      accessToken,
      refreshToken,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// 2. Client Login
exports.clientLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // figure out if identifier is phone or email
    let client = await ClientUser.findOne({ phone: identifier });
    if (!client) {
      client = await ClientUser.findOne({ email: identifier });
    }
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    // Compare password
    const isMatch = await comparePassword(password, client.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const { accessToken, refreshToken } = generateTokens(client._id);

    return res.status(200).json({
      message: "Client login successful",
      client: {
        id: client._id,
        name: client.name,
        phone: client.phone,
        email: client.email,
        location: client.location,
        documents: client.documents,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }
};

// 3. "Who invited me?" (the /invitedby route)
exports.checkInvitedBy = async (req, res) => {
  try {
    const { phone, email } = req.query; // or req.body

    const invite = await Invite.findOne({
      inviteType: "client",
      status: "PENDING",
      $or: [{ phone }, { email }],
    }).populate("inviterId"); // so we can see the Realtor's data

    if (!invite) {
      return res.json({ invitedBy: null });
    }

    // We have an invite, let's get the realtor's name:
    const realtor = invite.inviterId; // a RealtorUser doc
    return res.json({
      invitedBy: realtor.name,
      realtorId: realtor._id,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

exports.clientInfo = async (req, res) => {
  try {
    const { clientId } = req.params;
    console.log(clientId);
    const client = await ClientUser.findById(clientId);
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }
    return res.status(200).json({
      id: client._id,
      name: client.name,
      phone: client.phone,
      email: client.email,
      location: client.location,
      address: client.address,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

exports.updateClientInfo = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { name, phone, email, location, address } = req.body;
    const client = await ClientUser.findById(clientId);
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }
    client.name = name || client.name;
    client.phone = phone || client.phone;
    client.email = email || client.email;
    client.location = location || client.location;
    client.address.address = address?.address || client?.address?.address || "";
    client.address.city = address?.city || client?.address?.city || "";
    client.address.postalCode =
      address?.postalCode || client?.address?.postalCode || "";
    await client.save();
    return res
      .status(200)
      .json({ message: "Client info updated successfully" });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

exports.updateClientPassword = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { oldPassword, newPassword } = req.body;
    const client = await ClientUser.findById(clientId);
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }
    const isMatch = await comparePassword(oldPassword, client.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }
    client.passwordHash = await hashPassword(newPassword);
    await client.save();
    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
