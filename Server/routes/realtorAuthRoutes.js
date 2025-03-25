// routes/realtorAuthRoutes.js
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const {
  realtorSignup,
  realtorLogin,
  inviteClient,
  inviteRealtor,
  getInvitees,
  getRealtorInfo,
  updateRealtorInfo,
  updateRealtorPassword,
  updateProfilePicture,
  getProfilePicture,
  requestDocument,
  getRequestedDocuments,
} = require("../controllers/realtorAuthController");

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
    // e.g., attach a timestamp to avoid collisions
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// POST /realtor/signup
router.post("/signup", realtorSignup);

// POST /realtor/login
router.post("/login", realtorLogin);

// POST /realtor/:realtorId/invite-client
router.post("/:realtorId/invite-client", inviteClient);

// POST /realtor/:realtorId/invite-realtor
router.post("/:realtorId/invite-realtor", inviteRealtor);

router.get("/invited/:realtorId", getInvitees);

router.get("/:realtorId", getRealtorInfo);

router.put("/:realtorId", updateRealtorInfo);

router.post("/:realtorId/updatepassword", updateRealtorPassword);

router.post(
  "/profilepic/:realtorId",
  upload.single("profilePicture"),
  updateProfilePicture
);

router.get("/profilepic/:realtorId", getProfilePicture);

router.post("/requestdocument/:realtorId", requestDocument);

router.post("/requesteddocument/:realtorId", getRequestedDocuments);

module.exports = router;
