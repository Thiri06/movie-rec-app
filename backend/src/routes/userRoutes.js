const express = require("express");
const { getMe, syncUser, updatePreferences } = require("../controllers/userController");
const requireAuth = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/sync", requireAuth, syncUser);
router.get("/me", requireAuth, getMe);
router.patch("/preferences", requireAuth, updatePreferences);

module.exports = router;
