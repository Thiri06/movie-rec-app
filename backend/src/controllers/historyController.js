const User = require("../models/User");
const WatchHistory = require("../models/WatchHistory");

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

module.exports = {
  getWatchHistory,
};
