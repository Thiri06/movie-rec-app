const express = require("express");
const { getRecommendations } = require("../controllers/recommendationController");
const requireAuth = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", requireAuth, getRecommendations);

module.exports = router;
