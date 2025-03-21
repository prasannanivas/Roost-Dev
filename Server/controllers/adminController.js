// controllers/adminDocumentController.js

const ClientUser = require("../models/ClientUser");

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
