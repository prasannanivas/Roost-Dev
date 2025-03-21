// controllers/clientDocumentUploadController.js
const mongoose = require("mongoose");
const fs = require("fs");
const ClientUser = require("../models/ClientUser");
const { getGridFsBucket } = require("../config/gridfs");

// We'll assume Multer is storing the file in memory or on disk,
// but here we only need a readable stream to pipe into GridFS.
exports.uploadClientDocument = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { docType } = req.body; // e.g. "letterOfEmployment"

    console.log(
      "Received upload request for client:",
      clientId,
      "docType:",
      docType
    );

    // 1) Check for file
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // 2) Find the client
    const client = await ClientUser.findById(clientId);
    if (!client) {
      // Clean up the temp file if needed
      fs.unlink(req.file.path, (err) => {
        if (err) console.warn("Temp file remove error:", err);
      });
      return res.status(404).json({ error: "Client not found" });
    }

    // 3) Validate docType if needed (optional, but good practice)
    if (!docType) {
      // Remove the temp file from disk
      fs.unlink(req.file.path, (err) => {
        if (err) console.warn("Temp file remove error:", err);
      });
      return res.status(400).json({ error: "docType is required" });
    }

    // 4) Prepare to upload to GridFS
    const tempFilePath = req.file.path; // e.g. "D:\Roost-Realestate\Server\tempUploads\XYZ-file.pdf"
    const fileName = req.file.originalname;
    const bucket = getGridFsBucket();

    // Create an ObjectId for the new file in GridFS
    const fileId = new mongoose.Types.ObjectId();

    console.log("Uploading file to GridFS: ", fileName, "with fileId:", fileId);

    // 5) Stream the local file into GridFS
    const uploadStream = bucket.openUploadStreamWithId(fileId, fileName, {
      contentType: req.file.mimetype || "application/pdf",
    });

    fs.createReadStream(tempFilePath)
      .pipe(uploadStream)
      .on("error", (err) => {
        console.error("GridFS upload error:", err);

        // Remove temp file
        fs.unlink(tempFilePath, (unlinkErr) => {
          if (unlinkErr) console.warn("Temp file remove error:", unlinkErr);
        });

        return res
          .status(500)
          .json({ error: "Error uploading file to GridFS" });
      })
      .on("finish", async () => {
        console.log("File fully uploaded to GridFS, fileId:", fileId);

        // 6) Add a record to the client's documents array
        const existingIndex = client.documents.findIndex(
          (d) => d.docType === docType
        );
        if (existingIndex === -1) {
          client.documents.push({
            docType,
            fileName,
            fileId, // the ObjectId in GridFS
            status: "Submitted",
          });
        } else {
          client.documents[existingIndex] = {
            docType,
            fileName,
            fileId, // the ObjectId in GridFS
            status: "Submitted",
          };
        }

        try {
          await client.save();
        } catch (err) {
          console.error("Error saving client doc data:", err);

          // Remove temp file
          fs.unlink(tempFilePath, (unlinkErr) => {
            if (unlinkErr) console.warn("Temp file remove error:", unlinkErr);
          });

          return res
            .status(500)
            .json({ error: "Could not save document record to client." });
        }

        // 7) Optionally remove the temp file from disk
        fs.unlink(tempFilePath, (err) => {
          if (err) console.warn("Temp file remove error:", err);
        });

        // 8) Send success response
        return res.status(200).json({
          message: "Document uploaded successfully",
          document: {
            docType,
            fileName,
            status: "Submitted",
            fileId,
          },
        });
      });
  } catch (error) {
    console.error("uploadClientDocument error:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.approveClientDocument = async (req, res) => {
  try {
    const { clientId, docId } = req.params;

    const client = await ClientUser.findById(clientId);
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    // find subdoc by _id
    const doc = client.documents.id(docId);
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    doc.status = "Approved";
    await client.save();

    return res.status(200).json({
      message: "Document approved",
      document: {
        _id: doc._id,
        docType: doc.docType,
        fileId: doc.fileId,
        status: doc.status,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getClientDocument = async (req, res) => {
  try {
    const { clientId, docId } = req.params;

    // 1) Find client
    const client = await ClientUser.findById(clientId);
    if (!client) {
      return res.status(404).send("Client not found");
    }

    // 2) Locate the subdocument by docId
    const doc = client.documents.find((d) => d._id.toString() === docId);

    if (!doc) {
      return res.status(404).send("Document not found");
    }

    // 3) Ensure there's a fileId in the doc
    if (!doc.fileId) {
      return res
        .status(400)
        .send("No GridFS file associated with this document");
    }

    // 4) Stream the file from GridFS
    const bucket = getGridFsBucket();
    const downloadStream = bucket.openDownloadStream(doc.fileId);

    // Optional: If we had stored the file content type in doc, we could set it:
    // res.set("Content-Type", doc.contentType || "application/pdf");
    // For now, we’ll assume PDF:
    res.set("Content-Type", "application/pdf");
    // Suggest a download filename
    res.setHeader("Content-Disposition", "inline");

    // 5) Pipe the file to the response
    downloadStream
      .on("error", (err) => {
        // If the file isn't found in GridFS, you might see an error like
        // "FileNotFound" or similar. We'll handle generically here:
        console.error("Download stream error:", err.message);

        // If you want a 404 if file not in GridFS, do:
        if (
          err.message &&
          err.message.toLowerCase().includes("no file found")
        ) {
          return res.status(404).send("File not found in GridFS");
        }
        return res.status(500).send("Error downloading file");
      })
      .pipe(res)
      .on("finish", () => {
        console.log("File download completed successfully");
      });
  } catch (error) {
    console.error("Get document error:", error);
    return res.status(500).send("Server error");
  }
};

exports.getClientDocuments = async (req, res) => {
  if (!req.params.clientId) {
    return res.status(400).json({ error: "Client ID is required" });
  }
  try {
    const client = await ClientUser.findById(req.params.clientId);
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }
    return res.status(200).json(client.documents);
  } catch (error) {
    console.error("Get client documents error:", error);
    return res.status(500).json({ error: error.message });
  }
};
