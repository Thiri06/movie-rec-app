const getFirebaseAdmin = require("../config/firebaseAdmin");

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Missing authorization token." });
    }

    const admin = getFirebaseAdmin();
    if (!admin && process.env.NODE_ENV !== "production") {
      req.auth = {
        firebaseUid: req.headers["x-dev-firebase-uid"] || "dev-user",
        email: req.headers["x-dev-email"] || "dev@example.com",
        name: req.headers["x-dev-name"] || "Development User",
        picture: "",
      };
      return next();
    }

    const decoded = await admin.auth().verifyIdToken(token);
    req.auth = {
      firebaseUid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
    };

    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid authorization token.", detail: error.message });
  }
};

module.exports = requireAuth;
