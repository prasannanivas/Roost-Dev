// routes/clientAuthRoutes.js
const express = require("express");
const router = express.Router();
const {
  clientSignup,
  clientLogin,
  checkInvitedBy,
  clientInfo,
  updateClientInfo,
  updateClientPassword,
} = require("../controllers/clientAuthController");

// POST /client/signup
router.post("/signup", clientSignup);

// POST /client/login
router.post("/login", clientLogin);

// GET /client/invitedby?phone=... or ?email=...
router.get("/invitedby", checkInvitedBy);

router.get("/:clientId", clientInfo);

router.put("/:clientId", updateClientInfo);

router.post("/:clientId/updatepassword", updateClientPassword);

module.exports = router;
