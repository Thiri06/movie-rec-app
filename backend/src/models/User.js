const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    name: { type: String, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    photoURL: { type: String },
    preferences: {
      favoriteGenres: [{ type: Number }],
      dislikedGenres: [{ type: Number }],
      preferredLanguages: [{ type: String }],
      minRating: { type: Number, default: 0 },
      birthDate: { type: Date },
      maturityLimit: {
        type: String,
        enum: ["auto", "pg13", "adult"],
        default: "auto",
      },
    },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
