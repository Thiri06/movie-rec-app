const cors = require("cors");
const express = require("express");
require("dotenv").config();

const connectDb = require("./src/config/db");
const { errorHandler, notFound } = require("./src/middleware/errorHandler");
const favoriteRoutes = require("./src/routes/favoriteRoutes");
const historyRoutes = require("./src/routes/historyRoutes");
const interactionRoutes = require("./src/routes/interactionRoutes");
const movieRoutes = require("./src/routes/movieRoutes");
const recommendationRoutes = require("./src/routes/recommendationRoutes");
const userRoutes = require("./src/routes/userRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  })
);
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    name: "YOKO Movie Intelligence API",
    status: "running",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/users", userRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/interactions", interactionRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/recommendations", recommendationRoutes);

app.use(notFound);
app.use(errorHandler);

connectDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend listening on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start backend:", error);
    process.exit(1);
  });
