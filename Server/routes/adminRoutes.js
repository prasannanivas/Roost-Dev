const express = require("express");
const router = express.Router();
const upload = require("../config/multerConfig");
const {
  getPendingDocuments,
  reviewDocument,
  getRewards,
  addNewReward,
  deleteReward,
  getClaimedRewards,
  updateReward,
  toggleRewardVisibility,
  getImage,
  getAllClients,
} = require("../controllers/adminController");

// GET /admin/documents/pending
router.get("/documents/pending", getPendingDocuments);

// PATCH /admin/documents/:clientId/:docId/review
router.patch("/documents/:clientId/:docId/review", reviewDocument);

router.get("/rewards", getRewards);

router.get("/clients", getAllClients);
// Update file upload routes - make sure field name matches "image"
router.post("/rewards", upload.single("image"), addNewReward);
router.patch("/rewards/:rewardId", upload.single("image"), updateReward);
router.patch("/rewards/:rewardId/toggle", toggleRewardVisibility);

router.delete("/rewards/:rewardId", deleteReward);

router.get("/rewards/claimed", getClaimedRewards);

router.get("/api/images/:fileId", getImage);

module.exports = router;
