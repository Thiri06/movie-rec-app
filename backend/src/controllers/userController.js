const User = require("../models/User");

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
    const user = await User.findOneAndUpdate(
      { firebaseUid: req.auth.firebaseUid },
      { $set: { preferences: req.body.preferences || {} } },
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
