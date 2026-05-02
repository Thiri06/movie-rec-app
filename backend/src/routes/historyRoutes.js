const express = require("express");
const { getWatchHistory } = require("../controllers/historyController");
const requireAuth = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", requireAuth, getWatchHistory);

module.exports = router;
