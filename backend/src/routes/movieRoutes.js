const express = require("express");
const {
  discoverMovies,
  getMovieDetails,
  getTrendingMovies,
  searchMovies,
} = require("../controllers/movieController");

const router = express.Router();

router.get("/search", searchMovies);
router.get("/discover", discoverMovies);
router.get("/trending", getTrendingMovies);
router.get("/:tmdbId", getMovieDetails);

module.exports = router;
