const mongoose = require("mongoose");

const userInteractionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie" },
    tmdbId: { type: Number, required: true, index: true },
    eventType: {
      type: String,
      required: true,
      enum: ["view_details", "trailer_click", "search_click", "recommendation_click", "favorite_add"],
      index: true,
    },
    source: {
      type: String,
      enum: ["discover", "dashboard", "recommendation", "trending", "details", "unknown"],
      default: "unknown",
    },
    metadata: {
      genreIds: [{ type: Number }],
      searchQuery: String,
      recommendationId: String,
    },
  },
  { timestamps: true }
);

userInteractionSchema.index({ userId: 1, createdAt: -1 });
userInteractionSchema.index({ userId: 1, eventType: 1, createdAt: -1 });

module.exports = mongoose.model("UserInteraction", userInteractionSchema);
