const Recommendation = require("../models/Recommendation");
const User = require("../models/User");
const { generateRecommendations } = require("../services/recommendationService");

const getRecommendations = async (req, res, next) => {
  try {
    const user = await User.findOne({ firebaseUid: req.auth.firebaseUid });
    if (!user) {
      return res.status(404).json({ message: "User profile not found." });
    }

    let recommendations = await Recommendation.find({ userId: user._id })
      .sort({ score: -1 })
      .limit(12)
      .populate("movieId");

    if (recommendations.length === 0 || req.query.refresh === "true") {
      recommendations = await generateRecommendations(user._id);
      recommendations = await Recommendation.find({ userId: user._id })
        .sort({ score: -1 })
        .limit(12)
        .populate("movieId");
    }

    return res.json(recommendations);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getRecommendations,
};
