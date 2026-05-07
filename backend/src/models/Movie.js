const mongoose = require("mongoose");

const genreSchema = new mongoose.Schema(
  {
    id: Number,
    name: String,
  },
  { _id: false }
);

const creditPersonSchema = new mongoose.Schema(
  {
    id: Number,
    name: String,
  },
  { _id: false }
);

const castMemberSchema = new mongoose.Schema(
  {
    id: Number,
    name: String,
    character: String,
    order: Number,
  },
  { _id: false }
);

const movieSchema = new mongoose.Schema(
  {
    tmdbId: { type: Number, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    originalTitle: { type: String, trim: true },
    overview: { type: String },
    genres: [genreSchema],
    genreIds: [{ type: Number, index: true }],
    cast: [castMemberSchema],
    castIds: [{ type: Number, index: true }],
    directors: [creditPersonSchema],
    directorIds: [{ type: Number, index: true }],
    releaseDate: { type: String },
    releaseYear: { type: Number, index: true },
    voteAverage: { type: Number },
    voteCount: { type: Number },
    popularity: { type: Number },
    posterPath: { type: String },
    backdropPath: { type: String },
    trailerKey: { type: String },
    runtime: { type: Number },
    language: { type: String },
    cachedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Movie", movieSchema);
