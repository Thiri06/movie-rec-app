const express = require("express");
const { getWatchHistory, markMovieWatched } = require("../controllers/historyController");
const requireAuth = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", requireAuth, getWatchHistory);
router.post("/mark-watched", requireAuth, markMovieWatched);

module.exports = router;
