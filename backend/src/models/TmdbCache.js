const mongoose = require("mongoose");

const tmdbCacheSchema = new mongoose.Schema(
  {
    cacheKey: { type: String, required: true, unique: true, index: true },
    endpoint: { type: String, required: true },
    params: { type: Object, default: {} },
    data: { type: Object, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TmdbCache", tmdbCacheSchema);
