const mongoose = require("mongoose");

const explanationDetailSchema = new mongoose.Schema(
  {
    type: String,
    text: String,
  },
  { _id: false }
);

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
    humanExplanation: { type: String },
    explanationDetails: [explanationDetailSchema],
    explanationTags: [{ type: String }],
    signals: {
      matchedGenres: [{ type: Number }],
      matchedCast: [{ type: Number }],
      matchedDirectors: [{ type: Number }],
      basedOnMovieIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Movie" }],
      collaborativeUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      favoriteBoost: { type: Number, default: 0 },
      historyBoost: { type: Number, default: 0 },
      interactionBoost: { type: Number, default: 0 },
      peopleBoost: { type: Number, default: 0 },
      collaborativeBoost: { type: Number, default: 0 },
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
