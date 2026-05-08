const mongoose = require("mongoose");

const aiInsightSchema = new mongoose.Schema(
  {
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie" },
    tmdbId: { type: Number, required: true, unique: true, index: true },
    summary: { type: String },
    reasons: [{ type: String }],
    bestFor: { type: String },
    moodTags: [{ type: String }],
    generatedBy: { type: String, default: "gemini" },
    insightVersion: { type: Number, default: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AiInsight", aiInsightSchema);
