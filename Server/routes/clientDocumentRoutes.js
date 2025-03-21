// routes/clientDocumentRoutes.js
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const {
  uploadClientDocument,
  approveClientDocument,
  getClientDocument,
  getClientDocuments,
} = require("../controllers/clientDocumentUploadController");

// 1) Ensure the folder actually exists (create if not)
const uploadFolder = path.join(__dirname, "../tempUploads");
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

// 2) Configure Multer disk storage to use that folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadFolder);
  },
  filename: (req, file, cb) => {
    // e.g. attach a timestamp to avoid name collisions
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// 3) Create the Multer middleware
const upload = multer({ storage });

/**
 * ROUTES:
 *
 * 1. POST /:clientId/documents
 *    - Upload a single PDF file field named "pdfFile"
 *    - The controller will stream it into GridFS (or whichever logic you have)
 *
 * 2. PATCH /:clientId/documents/:docId/approve
 *    - Approve the existing doc by setting status="Approved"
 *
 * 3. GET /:clientId/documents/:docId
 *    - Download (stream) the PDF from GridFS
 */

// 1) Upload PDF => store in tempUploads => pass to controller
router.post(
  "/:clientId/documents",
  upload.single("pdfFile"),
  uploadClientDocument
);

// 2) Approve doc => set doc.status="Approved"
router.patch("/:clientId/documents/:docId/approve", approveClientDocument);

// 3) Retrieve (download) doc => read from GridFS
router.get("/:clientId/documents/:docId", getClientDocument);

router.get("/:clientId/documents", getClientDocuments);

module.exports = router;
