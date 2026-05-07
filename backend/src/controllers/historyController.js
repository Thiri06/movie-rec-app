const User = require("../models/User");
const UserInteraction = require("../models/UserInteraction");
const WatchHistory = require("../models/WatchHistory");
const { requestTmdb } = require("../services/tmdbService");
const { upsertMovieFromTmdb } = require("../services/movieService");

const getWatchHistory = async (req, res, next) => {
  try {
    const user = await User.findOne({ firebaseUid: req.auth.firebaseUid });
    if (!user) {
      return res.status(404).json({ message: "User profile not found." });
    }

    const history = await WatchHistory.find({ userId: user._id })
      .sort({ watchedAt: -1 })
      .populate("movieId");

    return res.json(history);
  } catch (error) {
    return next(error);
  }
};

const markMovieWatched = async (req, res, next) => {
  try {
    const user = await User.findOne({ firebaseUid: req.auth.firebaseUid });
    if (!user) {
      return res.status(404).json({ message: "User profile not found." });
    }

    const { tmdbId, source = "details" } = req.body;
    if (!tmdbId) {
      return res.status(400).json({ message: "tmdbId is required." });
    }

    const data = await requestTmdb(`/movie/${tmdbId}`, {
      append_to_response: "credits",
    });
    const movie = await upsertMovieFromTmdb(data);
    const history = await WatchHistory.findOneAndUpdate(
      { userId: user._id, tmdbId: movie.tmdbId },
      {
        userId: user._id,
        movieId: movie._id,
        tmdbId: movie.tmdbId,
        status: "marked_watched",
        source,
        watchedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate("movieId");

    await UserInteraction.create({
      userId: user._id,
      movieId: movie._id,
      tmdbId: movie.tmdbId,
      eventType: "mark_watched",
      source,
      metadata: {
        genreIds: movie.genreIds,
        castIds: movie.castIds,
        directorIds: movie.directorIds,
      },
    });

    return res.status(201).json(history);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getWatchHistory,
  markMovieWatched,
};
