const User = require("../models/User");
const UserInteraction = require("../models/UserInteraction");
const WatchHistory = require("../models/WatchHistory");
const { requestTmdb } = require("../services/tmdbService");
const { upsertMovieFromTmdb } = require("../services/movieService");

const getCurrentUser = async (firebaseUid) => User.findOne({ firebaseUid });

const recordInteraction = async (req, res, next) => {
  try {
    const user = await getCurrentUser(req.auth.firebaseUid);
    if (!user) {
      return res.status(404).json({ message: "User profile not found. Call /api/users/sync first." });
    }

    const { tmdbId, eventType = "view_details", source = "unknown", metadata = {} } = req.body;
    if (!tmdbId) {
      return res.status(400).json({ message: "tmdbId is required." });
    }

    const data = await requestTmdb(`/movie/${tmdbId}`);
    const movie = await upsertMovieFromTmdb(data);
    const interaction = await UserInteraction.create({
      userId: user._id,
      movieId: movie._id,
      tmdbId: movie.tmdbId,
      eventType,
      source,
      metadata: {
        ...metadata,
        genreIds: metadata.genreIds || movie.genreIds,
      },
    });

    if (eventType === "view_details") {
      await WatchHistory.findOneAndUpdate(
        { userId: user._id, tmdbId: movie.tmdbId },
        {
          userId: user._id,
          movieId: movie._id,
          tmdbId: movie.tmdbId,
          status: "viewed_details",
          source,
          watchedAt: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    return res.status(201).json(interaction);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  recordInteraction,
};
