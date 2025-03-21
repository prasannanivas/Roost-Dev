// routes/realtorAuthRoutes.js
const express = require("express");
const router = express.Router();
const {
  realtorSignup,
  realtorLogin,
  inviteClient,
  inviteRealtor,
  getInvitees,
  getRealtorInfo,
  updateRealtorInfo,
  updateRealtorPassword,
} = require("../controllers/realtorAuthController");

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

module.exports = router;
