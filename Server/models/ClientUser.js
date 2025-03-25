// models/ClientUser.js
const mongoose = require("mongoose");

const documentSubSchema = new mongoose.Schema(
  {
    docType: { type: String, required: true }, // e.g. "letterOfEmployment"
    fileName: { type: String }, // e.g. "Letter_JohnSmith.pdf"
    fileId: { type: mongoose.Schema.Types.ObjectId }, // the _id of the file in GridFS
    status: { type: String, default: "Submitted" }, // "Submitted" | "Approved" etc.
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const clientUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    location: { type: String },
    address: {
      address: { type: String, default: "" },
      city: { type: String, default: "" },
      postalCode: { type: String, default: "" },
    },
    passwordHash: { type: String, required: true },
    usedMortgagePartner: { type: Boolean, default: false },
    documents: [documentSubSchema],
    employmentStatus: { type: String, default: "Employed" }, // "Employed" | "Self-employed" | "Unemployed"
    applyingbehalf: { type: String, default: "Self" }, // "Self" | "other"
    ownAnotherProperty: { type: String, default: "No" }, // "Yes - with a mortgage" | "Yes - All paid off" | "No"
  },
  { timestamps: true }
);

module.exports = mongoose.model("ClientUser", clientUserSchema);
