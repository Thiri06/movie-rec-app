const express = require("express");
const { recordInteraction } = require("../controllers/interactionController");
const requireAuth = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", requireAuth, recordInteraction);

module.exports = router;
