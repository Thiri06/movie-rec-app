const mongoose = require("mongoose");

const recommendationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie" },
    tmdbId: { type: Number, required: true, index: true },
    score: { type: Number, required: true },
    algorithm: {
      type: String,
      enum: ["content_based", "collaborative", "hybrid"],
      default: "hybrid",
    },
    reason: { type: String, required: true },
    explanationTags: [{ type: String }],
    signals: {
      matchedGenres: [{ type: Number }],
      basedOnMovieIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Movie" }],
      favoriteBoost: { type: Number, default: 0 },
      historyBoost: { type: Number, default: 0 },
      popularityBoost: { type: Number, default: 0 },
    },
    generatedAt: { type: Date, default: Date.now, index: true },
    expiresAt: { type: Date, index: true },
  },
  { timestamps: true }
);

recommendationSchema.index({ userId: 1, score: -1 });
recommendationSchema.index({ userId: 1, tmdbId: 1 });

module.exports = mongoose.model("Recommendation", recommendationSchema);
