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
  updateClientQuestionaire,
  neededDocument,
} = require("../controllers/clientAuthController");

// POST /client/signup
router.post("/signup", clientSignup);

// POST /client/login
router.post("/login", clientLogin);

// GET /client/invitedby?phone=... or ?email=...
router.get("/invitedby", checkInvitedBy);

router.get("/:clientId", clientInfo);

router.put("/:clientId", updateClientInfo);

router.put("/questionaire/:clientId", updateClientQuestionaire);
// This route now expects:
// {
//   applyingbehalf: 'just me' | 'me and someone else',
//   employmentStatus: 'Employed at a company' | 'self employed',
//   ownAnotherProperty: 'yes - with a mortgage' | 'Yes - All payed off' | 'No'
// }

router.post("/:clientId/updatepassword", updateClientPassword);

router.get("/neededdocument/:clientId", neededDocument);

module.exports = router;
