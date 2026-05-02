const express = require("express");
const { addFavorite, getFavorites, removeFavorite } = require("../controllers/favoriteController");
const requireAuth = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", requireAuth, getFavorites);
router.post("/", requireAuth, addFavorite);
router.delete("/:tmdbId", requireAuth, removeFavorite);

module.exports = router;
