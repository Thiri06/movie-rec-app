const User = require("../models/User");

const getAgeFromBirthDate = (birthDate) => {
  if (!birthDate) {
    return null;
  }

  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age;
};

const sanitizePreferences = (preferences = {}) => {
  const birthDate = preferences.birthDate ? new Date(preferences.birthDate) : undefined;
  const age = getAgeFromBirthDate(birthDate);
  const allowedMaturityLimits = new Set(["auto", "pg13", "adult"]);
  const requestedMaturityLimit = allowedMaturityLimits.has(preferences.maturityLimit)
    ? preferences.maturityLimit
    : "auto";

  return {
    favoriteGenres: Array.isArray(preferences.favoriteGenres) ? preferences.favoriteGenres.map(Number).filter(Boolean) : [],
    dislikedGenres: Array.isArray(preferences.dislikedGenres) ? preferences.dislikedGenres.map(Number).filter(Boolean) : [],
    preferredLanguages: Array.isArray(preferences.preferredLanguages) ? preferences.preferredLanguages.filter(Boolean) : [],
    minRating: Math.min(Math.max(Number(preferences.minRating || 0), 0), 9),
    birthDate,
    maturityLimit: typeof age === "number" && age < 18 && requestedMaturityLimit === "adult"
      ? "auto"
      : requestedMaturityLimit,
  };
};

const syncUser = async (req, res, next) => {
  try {
    const user = await User.findOneAndUpdate(
      { firebaseUid: req.auth.firebaseUid },
      {
        $set: {
          name: req.body.name || req.auth.name,
          email: req.body.email || req.auth.email,
          photoURL: req.body.photoURL || req.auth.picture,
          lastLoginAt: new Date(),
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json(user);
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findOne({ firebaseUid: req.auth.firebaseUid });
    if (!user) {
      return res.status(404).json({ message: "User profile not found." });
    }

    return res.json(user);
  } catch (error) {
    return next(error);
  }
};

const updatePreferences = async (req, res, next) => {
  try {
    const preferences = sanitizePreferences(req.body.preferences || {});
    const user = await User.findOneAndUpdate(
      { firebaseUid: req.auth.firebaseUid },
      { $set: { preferences } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User profile not found." });
    }

    return res.json(user);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getMe,
  syncUser,
  updatePreferences,
};
