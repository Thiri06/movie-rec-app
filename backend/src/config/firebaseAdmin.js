const admin = require("firebase-admin");

const getFirebaseAdmin = () => {
  if (admin.apps.length > 0) {
    return admin;
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
    });
    return admin;
  }

  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
    return admin;
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn("Firebase Admin credentials are not configured. Auth middleware will accept dev headers only.");
    return null;
  }

  throw new Error("Firebase Admin credentials are required in production.");
};

module.exports = getFirebaseAdmin;
