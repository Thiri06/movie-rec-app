const Favorite = require("../models/Favorite");
const User = require("../models/User");
const UserInteraction = require("../models/UserInteraction");
const { requestTmdb } = require("../services/tmdbService");
const { upsertMovieFromTmdb } = require("../services/movieService");

const getFavorites = async (req, res, next) => {
  try {
    const user = await User.findOne({ firebaseUid: req.auth.firebaseUid });
    if (!user) {
      return res.status(404).json({ message: "User profile not found." });
    }

    const favorites = await Favorite.find({ userId: user._id }).sort({ createdAt: -1 }).populate("movieId");
    return res.json(favorites);
  } catch (error) {
    return next(error);
  }
};

const addFavorite = async (req, res, next) => {
  try {
    const user = await User.findOne({ firebaseUid: req.auth.firebaseUid });
    if (!user) {
      return res.status(404).json({ message: "User profile not found. Call /api/users/sync first." });
    }

    const { tmdbId } = req.body;
    if (!tmdbId) {
      return res.status(400).json({ message: "tmdbId is required." });
    }

    const data = await requestTmdb(`/movie/${tmdbId}`, {
      append_to_response: "credits",
    });
    const movie = await upsertMovieFromTmdb(data);
    const favorite = await Favorite.findOneAndUpdate(
      { userId: user._id, tmdbId: movie.tmdbId },
      { userId: user._id, movieId: movie._id, tmdbId: movie.tmdbId },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await UserInteraction.create({
      userId: user._id,
      movieId: movie._id,
      tmdbId: movie.tmdbId,
      eventType: "favorite_add",
      source: req.body.source || "unknown",
      metadata: { genreIds: movie.genreIds },
    });

    return res.status(201).json(favorite);
  } catch (error) {
    return next(error);
  }
};

const removeFavorite = async (req, res, next) => {
  try {
    const user = await User.findOne({ firebaseUid: req.auth.firebaseUid });
    if (!user) {
      return res.status(404).json({ message: "User profile not found." });
    }

    await Favorite.deleteOne({ userId: user._id, tmdbId: Number(req.params.tmdbId) });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  addFavorite,
  getFavorites,
  removeFavorite,
};
