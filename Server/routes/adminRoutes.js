const express = require("express");
const router = express.Router();

const {
  getPendingDocuments,
  reviewDocument,
} = require("../controllers/adminController");

// GET /admin/documents/pending
router.get("/documents/pending", getPendingDocuments);

// PATCH /admin/documents/:clientId/:docId/review
router.patch("/documents/:clientId/:docId/review", reviewDocument);

module.exports = router;
