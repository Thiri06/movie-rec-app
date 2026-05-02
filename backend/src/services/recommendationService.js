const Favorite = require("../models/Favorite");
const Recommendation = require("../models/Recommendation");
const UserInteraction = require("../models/UserInteraction");
const WatchHistory = require("../models/WatchHistory");
const { requestTmdb } = require("./tmdbService");
const { upsertMovieFromTmdb } = require("./movieService");

const countGenres = (items) => {
  const counter = {};

  items.forEach((item) => {
    const genreIds = item.movieId?.genreIds || item.metadata?.genreIds || [];
    genreIds.forEach((genreId) => {
      counter[genreId] = (counter[genreId] || 0) + 1;
    });
  });

  return Object.entries(counter)
    .map(([genreId, count]) => ({ genreId: Number(genreId), count }))
    .sort((a, b) => b.count - a.count);
};

const generateRecommendations = async (userId) => {
  const [history, favorites, interactions] = await Promise.all([
    WatchHistory.find({ userId }).sort({ watchedAt: -1 }).limit(30).populate("movieId"),
    Favorite.find({ userId }).sort({ createdAt: -1 }).limit(30).populate("movieId"),
    UserInteraction.find({ userId }).sort({ createdAt: -1 }).limit(50),
  ]);

  const topGenre = countGenres([...history, ...favorites, ...interactions])[0];
  const genreId = topGenre?.genreId;

  if (!genreId) {
    return [];
  }

  const alreadySeenTmdbIds = new Set([
    ...history.map((item) => item.tmdbId),
    ...favorites.map((item) => item.tmdbId),
  ]);

  const data = await requestTmdb("/discover/movie", {
    with_genres: String(genreId),
    sort_by: "vote_average.desc",
    "vote_count.gte": "180",
  });

  const candidates = (data.results || []).filter((movie) => !alreadySeenTmdbIds.has(movie.id)).slice(0, 10);
  await Recommendation.deleteMany({ userId });

  const recommendationDocs = [];
  for (const [index, candidate] of candidates.entries()) {
    const movie = await upsertMovieFromTmdb(candidate);
    const score = Math.max(0.1, 0.95 - index * 0.05);
    recommendationDocs.push({
      userId,
      movieId: movie._id,
      tmdbId: movie.tmdbId,
      score,
      algorithm: "hybrid",
      reason: "Matched your strongest recent genre signal.",
      explanationTags: [
        "Based on watch history",
        "Boosted by favourites",
        `Matched genre ${genreId}`,
      ],
      signals: {
        matchedGenres: [genreId],
        basedOnMovieIds: history.map((item) => item.movieId?._id).filter(Boolean).slice(0, 5),
        favoriteBoost: favorites.length > 0 ? 0.2 : 0,
        historyBoost: history.length > 0 ? 0.4 : 0,
        popularityBoost: candidate.popularity ? Math.min(candidate.popularity / 1000, 0.2) : 0,
      },
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 12),
    });
  }

  if (recommendationDocs.length === 0) {
    return [];
  }

  return Recommendation.insertMany(recommendationDocs);
};

module.exports = {
  generateRecommendations,
};
