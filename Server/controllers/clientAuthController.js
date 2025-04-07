// controllers/clientAuthController.js
const ClientUser = require("../models/ClientUser");
const RealtorUser = require("../models/RealtorUser");
const Invite = require("../models/Invite");
const { hashPassword, comparePassword } = require("../utils/hash");
const jwt = require("jsonwebtoken");
const DocumentRequest = require("../models/schemas/DocumentRequest");

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
        ownAnotherProperty: client.ownAnotherProperty,
        employmentStatus: client.employmentStatus,
        applyingbehalf: client.applyingbehalf,
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
      documents: client.documents,
      brokerageInfo: client.brokerageInfo,
      employmentStatus: client.employmentStatus,
      applyingbehalf: client.applyingbehalf,
      ownAnotherProperty: client.ownAnotherProperty,
      otherDetails: client.otherDetails,
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

exports.updateClientQuestionaire = async (req, res) => {
  try {
    const { clientId } = req.params;
    const {
      employmentStatus,
      applyingbehalf,
      ownAnotherProperty,
      otherDetails,
    } = req.body;

    if (
      employmentStatus !== "Employed" &&
      employmentStatus !== "Selfemployed" &&
      employmentStatus !== "Unemployed"
    ) {
      return res.status(400).json({ error: "Invalid employment status" });
    }
    if (applyingbehalf !== "self" && applyingbehalf !== "other") {
      return res.status(400).json({ error: "Invalid applyingbehalf" });
    }
    if (
      ownAnotherProperty !== "Yes - with a mortgage" &&
      ownAnotherProperty !== "Yes - All paid off" &&
      ownAnotherProperty !== "No"
    ) {
      return res.status(400).json({ error: "Invalid ownAnotherProperty" });
    }

    // Validate otherDetails if applying on behalf of someone else
    if (applyingbehalf === "other") {
      if (
        !otherDetails ||
        !otherDetails.name ||
        !otherDetails.email ||
        !otherDetails.phone ||
        !otherDetails.relationship ||
        !otherDetails.employmentStatus ||
        !otherDetails.ownAnotherProperty
      ) {
        return res.status(400).json({
          error:
            "Other person's complete details including employment status and property ownership are required",
        });
      }

      // Validate other person's employment status
      if (
        otherDetails.employmentStatus !== "Employed" &&
        otherDetails.employmentStatus !== "Selfemployed" &&
        otherDetails.employmentStatus !== "Unemployed"
      ) {
        return res
          .status(400)
          .json({ error: "Invalid employment status for other person" });
      }

      // Validate other person's property ownership
      if (
        otherDetails.ownAnotherProperty !== "Yes - with a mortgage" &&
        otherDetails.ownAnotherProperty !== "Yes - All paid off" &&
        otherDetails.ownAnotherProperty !== "No"
      ) {
        return res.status(400).json({
          error: "Invalid property ownership status for other person",
        });
      }
    }

    const client = await ClientUser.findById(clientId);
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    client.employmentStatus = employmentStatus || client.employmentStatus;
    client.applyingbehalf = applyingbehalf || client.applyingbehalf;
    client.ownAnotherProperty = ownAnotherProperty || client.ownAnotherProperty;

    // Update otherDetails if applying on behalf of someone else
    if (applyingbehalf === "other") {
      client.otherDetails = {
        name: otherDetails.name,
        email: otherDetails.email,
        phone: otherDetails.phone,
        relationship: otherDetails.relationship,
        employmentStatus: otherDetails.employmentStatus,
        ownAnotherProperty: otherDetails.ownAnotherProperty,
      };
    } else {
      client.otherDetails = null; // Clear otherDetails if not applying for someone else
    }

    await client.save();
    return res
      .status(200)
      .json({ message: "Client questionnaire updated successfully" });
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

exports.neededDocument = async (req, res) => {
  try {
    const { clientId } = req.params;
    const client = await ClientUser.findById(clientId);
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    if (
      !client.employmentStatus ||
      !client.applyingbehalf ||
      !client.ownAnotherProperty
    ) {
      return res
        .status(400)
        .json({ error: "Please complete the questionaire first" });
    }
    const documents_needed = [];
    if (client.employmentStatus === "Employed") {
      documents_needed.push(
        {
          displayName: "Letter of Employment " + client.name,
          docType: "letterOfEmployment",
          status: "Pending",
          type: "Needed",
        },
        {
          displayName: "Paystub " + client.name,
          docType: "paystub",
          status: "Pending",
          type: "Needed",
        },
        {
          displayName: "T4 2023 " + client.name,
          docType: "T4_2023",
          status: "Pending",
          type: "Needed",
        },
        {
          displayName: "T4 2024 " + client.name,
          docType: "T4_2024",
          status: "Pending",
          type: "Needed",
        }
      );
    } else if (client.employmentStatus === "Selfemployed") {
      documents_needed.push(
        {
          displayName: "2024 T1 " + client.name,
          docType: "2024_T1",
          status: "Pending",
          type: "Needed",
        },
        {
          displayName: "2023 T1 " + client.name,
          docType: "2023_T1",
          status: "Pending",
          type: "Needed",
        },
        {
          displayName: "Articles of Incorporation " + client.name,
          docType: "Articles of Incorporation",
          status: "Pending",
          type: "Needed",
        }
      );
    }

    if (client.ownAnotherProperty === "Yes - with a mortgage") {
      documents_needed.push({
        displayName: "Mortgage Statement " + client.name,
        docType: "Mortgage Statement",
        status: "Pending",
        type: "Needed",
      });
    }

    if (client.applyingbehalf === "other") {
      if (client?.otherDetails?.employmentStatus === "Employed") {
        documents_needed.push(
          {
            displayName: "Letter of Employment " + client?.otherDetails?.name,
            docType: "letterOfEmployment_p1",
            status: "Pending",
            type: "Needed-other",
          },
          {
            displayName: "Paystub " + client?.otherDetails?.name,
            docType: "paystub_p1",
            status: "Pending",
            type: "Needed-other",
          },
          {
            displayName: "T4 2023 " + client?.otherDetails?.name,
            docType: "T4_2023_p1",
            status: "Pending",
            type: "Needed-other",
          },
          {
            displayName: "T4 2024 " + client?.otherDetails?.name,
            docType: "T4_2024_p1",
            status: "Pending",
            type: "Needed-other",
          }
        );
      } else if (client?.otherDetails?.employmentStatus === "Selfemployed") {
        documents_needed.push(
          {
            displayName: "2024 T1 " + client?.otherDetails?.name,
            docType: "2024_T1_p1",
            status: "Pending",
            type: "Needed-other",
          },
          {
            displayName: "2023 T1 " + client?.otherDetails?.name,
            docType: "2023_T1_p1",
            status: "Pending",
            type: "Needed-other",
          },
          {
            displayName:
              "Articles of Incorporation " + client?.otherDetails?.name,
            docType: "Articles of Incorporation_p1",
            status: "Pending",
            type: "Needed-other",
          }
        );
      }

      if (
        client?.otherDetails?.ownAnotherProperty === "Yes - with a mortgage"
      ) {
        documents_needed.push({
          displayName: "Mortgage Statement " + client?.otherDetails?.name,
          docType: "Mortgage Statement_p1",
          status: "Pending",
          type: "Needed-other",
        });
      }
    }

    return res.status(200).json({
      documents_needed: documents_needed,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
