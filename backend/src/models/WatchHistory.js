const mongoose = require("mongoose");

const watchHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie" },
    tmdbId: { type: Number, required: true, index: true },
    status: {
      type: String,
      enum: ["viewed_details", "marked_watched"],
      default: "viewed_details",
    },
    source: {
      type: String,
      enum: ["discover", "dashboard", "recommendation", "trending", "details", "unknown"],
      default: "details",
    },
    watchedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

watchHistorySchema.index({ userId: 1, tmdbId: 1 }, { unique: true });
watchHistorySchema.index({ userId: 1, watchedAt: -1 });

module.exports = mongoose.model("WatchHistory", watchHistorySchema);
