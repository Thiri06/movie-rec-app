const Favorite = require("../models/Favorite");
const Recommendation = require("../models/Recommendation");
const UserInteraction = require("../models/UserInteraction");
const WatchHistory = require("../models/WatchHistory");
const { requestTmdb } = require("./tmdbService");
const { upsertMovieFromTmdb } = require("./movieService");

const SOURCE_WEIGHTS = {
  favorite: 5,
  markedWatched: 4,
  watchHistory: 3,
  interaction: 1,
};

const SOURCE_LABELS = {
  favorite: "favorited",
  watchHistory: "watched",
  interaction: "viewed",
};

const SCORE_WEIGHTS = {
  content: 0.35,
  people: 0.25,
  collaborative: 0.3,
  quality: 0.1,
};

const addWeightedValue = (target, values = [], weight = 0) => {
  values.filter(Boolean).forEach((value) => {
    target[value] = (target[value] || 0) + weight;
  });
};

const getDaysOld = (date) => {
  if (!date) {
    return 30;
  }

  return Math.max(0, (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
};

const getRecencyMultiplier = (date) => {
  const daysOld = getDaysOld(date);
  if (daysOld <= 7) return 1.3;
  if (daysOld <= 30) return 1.1;
  if (daysOld <= 90) return 0.9;
  return 0.7;
};

const normalizeScore = (score, maxScore) => {
  if (!score || !maxScore) {
    return 0;
  }

  return Math.min(score / maxScore, 1);
};

const addVectorValue = (vector, key, weight = 0) => {
  if (!key || !weight) {
    return;
  }

  vector[key] = (vector[key] || 0) + weight;
};

const addMovieToVector = (vector, movie, weight = 0) => {
  if (!movie || !weight) {
    return;
  }

  addVectorValue(vector, `movie:${movie.tmdbId}`, weight * 1.25);
  (movie.genreIds || []).forEach((genreId) => addVectorValue(vector, `genre:${genreId}`, weight));
  (movie.castIds || []).slice(0, 8).forEach((castId) => addVectorValue(vector, `cast:${castId}`, weight * 0.45));
  (movie.directorIds || []).forEach((directorId) => addVectorValue(vector, `director:${directorId}`, weight * 0.75));
};

const getCosineSimilarity = (firstVector, secondVector) => {
  let dotProduct = 0;
  let firstMagnitude = 0;
  let secondMagnitude = 0;

  Object.entries(firstVector).forEach(([key, value]) => {
    firstMagnitude += value * value;
    dotProduct += value * (secondVector[key] || 0);
  });

  Object.values(secondVector).forEach((value) => {
    secondMagnitude += value * value;
  });

  if (!firstMagnitude || !secondMagnitude) {
    return 0;
  }

  return dotProduct / (Math.sqrt(firstMagnitude) * Math.sqrt(secondMagnitude));
};

const buildUserVector = ({ favorites = [], history = [], interactions = [] }) => {
  const vector = {};

  favorites.forEach((item) => {
    addMovieToVector(vector, item.movieId, SOURCE_WEIGHTS.favorite * getRecencyMultiplier(item.createdAt));
  });

  history.forEach((item) => {
    const weight = item.status === "marked_watched" ? SOURCE_WEIGHTS.markedWatched : SOURCE_WEIGHTS.watchHistory;
    addMovieToVector(vector, item.movieId, weight * getRecencyMultiplier(item.watchedAt));
  });

  interactions.forEach((item) => {
    const movieSignals = item.movieId || {
      tmdbId: item.tmdbId,
      genreIds: item.metadata?.genreIds || [],
      castIds: item.metadata?.castIds || [],
      directorIds: item.metadata?.directorIds || [],
    };
    const eventWeight = item.eventType === "favorite_add" ? 2 : item.eventType === "mark_watched" ? 3 : SOURCE_WEIGHTS.interaction;
    addMovieToVector(vector, movieSignals, eventWeight * getRecencyMultiplier(item.createdAt));
  });

  return vector;
};

const getTopEntries = (scoreMap, limit) =>
  Object.entries(scoreMap)
    .map(([id, score]) => ({ id: Number(id), score }))
    .sort((first, second) => second.score - first.score)
    .slice(0, limit);

const getMovieSignals = (movie = {}) => ({
  genreIds: movie.genreIds || [],
  castIds: movie.castIds || [],
  directorIds: movie.directorIds || [],
});

const getSharedCount = (firstValues = [], secondValues = []) => {
  const secondSet = new Set(secondValues);
  return firstValues.filter((value) => secondSet.has(value)).length;
};

const getPeopleNames = (people = [], matchedIds = [], limit = 2) => {
  const matchedIdSet = new Set(matchedIds);
  return people
    .filter((person) => matchedIdSet.has(person.id))
    .map((person) => person.name)
    .filter(Boolean)
    .slice(0, limit);
};

const pickSourceMovie = (profile, candidateSignals) => {
  const sourcePriority = {
    favorite: 3,
    watchHistory: 2,
    interaction: 1,
  };

  return profile.sourceMovies
    .map((sourceMovie) => ({
      ...sourceMovie,
      matchCount:
        getSharedCount(sourceMovie.genreIds, candidateSignals.genreIds) +
        getSharedCount(sourceMovie.castIds, candidateSignals.castIds) * 2 +
        getSharedCount(sourceMovie.directorIds, candidateSignals.directorIds) * 3,
    }))
    .filter((sourceMovie) => sourceMovie.title && sourceMovie.matchCount > 0)
    .sort((first, second) => {
      if (second.matchCount !== first.matchCount) return second.matchCount - first.matchCount;
      if (second.weight !== first.weight) return second.weight - first.weight;
      return (sourcePriority[second.sourceType] || 0) - (sourcePriority[first.sourceType] || 0);
    })[0];
};

const buildExplanationDetails = ({ movie, profile, scoreParts }) => {
  const candidateSignals = getMovieSignals(movie);
  const sourceMovie = pickSourceMovie(profile, candidateSignals);
  const details = [];

  if (sourceMovie) {
    details.push({
      type: sourceMovie.sourceType,
      text: `Because you ${SOURCE_LABELS[sourceMovie.sourceType] || "liked"} ${sourceMovie.title}.`,
    });
  }

  const actorNames = getPeopleNames(movie.cast, scoreParts.matchedCast);
  if (actorNames.length > 0) {
    details.push({
      type: "actor_match",
      text: `Shares actors you like: ${actorNames.join(", ")}.`,
    });
  }

  const directorNames = getPeopleNames(movie.directors, scoreParts.matchedDirectors);
  if (directorNames.length > 0) {
    details.push({
      type: "director_match",
      text: `Matches directors you like: ${directorNames.join(", ")}.`,
    });
  }

  if (scoreParts.collaborativeBoost > 0) {
    details.push({
      type: "collaborative",
      text: "Users with similar taste also saved or watched this movie.",
    });
  }

  if (details.length === 0 && scoreParts.matchedGenres.length > 0) {
    details.push({
      type: "genre_match",
      text: "Matches genres that appear often in your movie activity.",
    });
  }

  if (details.length === 0) {
    details.push({
      type: "quality",
      text: "Recommended for its rating, popularity, and fit with your taste profile.",
    });
  }

  return details;
};

const buildTasteProfile = ({ history, favorites, interactions }) => {
  const profile = {
    genres: {},
    cast: {},
    directors: {},
    sourceMovieIds: [],
    sourceMovies: [],
    topGenres: [],
    topCast: [],
    topDirectors: [],
    maxGenreScore: 0,
    maxCastScore: 0,
    maxDirectorScore: 0,
  };

  const addMovieToProfile = (movie, weight, sourceDate, sourceType) => {
    if (!movie) {
      return;
    }

    const finalWeight = weight * getRecencyMultiplier(sourceDate);
    addWeightedValue(profile.genres, movie.genreIds, finalWeight);
    addWeightedValue(profile.cast, movie.castIds, finalWeight * 0.75);
    addWeightedValue(profile.directors, movie.directorIds, finalWeight);
    if (movie._id) {
      profile.sourceMovieIds.push(movie._id);
    }
    profile.sourceMovies.push({
      movieId: movie._id,
      title: movie.title,
      sourceType,
      sourceDate,
      weight: finalWeight,
      genreIds: movie.genreIds || [],
      castIds: movie.castIds || [],
      directorIds: movie.directorIds || [],
    });
  };

  favorites.forEach((item) => addMovieToProfile(item.movieId, SOURCE_WEIGHTS.favorite, item.createdAt, "favorite"));
  history.forEach((item) => {
    const weight = item.status === "marked_watched" ? SOURCE_WEIGHTS.markedWatched : SOURCE_WEIGHTS.watchHistory;
    addMovieToProfile(item.movieId, weight, item.watchedAt, "watchHistory");
  });

  interactions.forEach((item) => {
    const movieSignals = item.movieId || {
      genreIds: item.metadata?.genreIds || [],
      castIds: item.metadata?.castIds || [],
      directorIds: item.metadata?.directorIds || [],
    };
    const eventWeight = item.eventType === "favorite_add" ? 2 : item.eventType === "mark_watched" ? 3 : SOURCE_WEIGHTS.interaction;
    addMovieToProfile(movieSignals, eventWeight, item.createdAt, "interaction");
  });

  profile.topGenres = getTopEntries(profile.genres, 5);
  profile.topCast = getTopEntries(profile.cast, 10);
  profile.topDirectors = getTopEntries(profile.directors, 5);
  profile.maxGenreScore = profile.topGenres[0]?.score || 0;
  profile.maxCastScore = profile.topCast[0]?.score || 0;
  profile.maxDirectorScore = profile.topDirectors[0]?.score || 0;

  return profile;
};

const fetchDetailedMovie = async (tmdbId, fallbackMovie = {}) => {
  try {
    return requestTmdb(`/movie/${tmdbId}`, {
      append_to_response: "credits",
    });
  } catch (_error) {
    return fallbackMovie;
  }
};

const hydrateMissingPeopleSignals = async (records) => {
  const recordsNeedingCredits = records
    .filter((item) => item.tmdbId && item.movieId && !item.movieId.castIds?.length && !item.movieId.directorIds?.length)
    .slice(0, 20);

  await Promise.all(
    recordsNeedingCredits.map(async (item) => {
      const detailedTmdbMovie = await fetchDetailedMovie(item.tmdbId, null);
      if (detailedTmdbMovie) {
        item.movieId = await upsertMovieFromTmdb(detailedTmdbMovie);
      }
    })
  );
};

const collectContentCandidates = async (profile, alreadySeenTmdbIds) => {
  const candidateMap = new Map();
  const genreSeeds = profile.topGenres.length > 0 ? profile.topGenres : [];

  for (const genre of genreSeeds.slice(0, 3)) {
    const data = await requestTmdb("/discover/movie", {
      with_genres: String(genre.id),
      sort_by: "vote_average.desc",
      "vote_count.gte": "180",
    });

    (data.results || []).slice(0, 15).forEach((movie) => {
      if (!alreadySeenTmdbIds.has(movie.id)) {
        candidateMap.set(movie.id, {
          ...candidateMap.get(movie.id),
          ...movie,
          candidateSources: [...(candidateMap.get(movie.id)?.candidateSources || []), "content"],
        });
      }
    });
  }

  return candidateMap;
};

const collectCollaborativeCandidates = async ({ userId, currentVector, userTmdbIds, alreadySeenTmdbIds }) => {
  if (userTmdbIds.length === 0) {
    return { candidateMap: new Map(), similarUsersById: new Map() };
  }

  const [matchingFavorites, matchingHistory, matchingInteractions] = await Promise.all([
    Favorite.find({ userId: { $ne: userId }, tmdbId: { $in: userTmdbIds } }).select("userId tmdbId"),
    WatchHistory.find({ userId: { $ne: userId }, tmdbId: { $in: userTmdbIds } }).select("userId tmdbId"),
    UserInteraction.find({ userId: { $ne: userId }, tmdbId: { $in: userTmdbIds } }).select("userId tmdbId"),
  ]);

  const overlapCountsByUserId = new Map();
  [...matchingFavorites, ...matchingHistory, ...matchingInteractions].forEach((item) => {
    const otherUserId = String(item.userId);
    overlapCountsByUserId.set(otherUserId, (overlapCountsByUserId.get(otherUserId) || 0) + 1);
  });

  const candidateUserIds = [...overlapCountsByUserId.entries()]
    .sort((first, second) => second[1] - first[1])
    .slice(0, 50)
    .map(([otherUserId]) => otherUserId);

  if (candidateUserIds.length === 0) {
    return { candidateMap: new Map(), similarUsersById: new Map() };
  }

  const [candidateFavorites, candidateHistory, candidateInteractions] = await Promise.all([
    Favorite.find({ userId: { $in: candidateUserIds } }).sort({ createdAt: -1 }).limit(300).populate("movieId"),
    WatchHistory.find({ userId: { $in: candidateUserIds } }).sort({ watchedAt: -1 }).limit(300).populate("movieId"),
    UserInteraction.find({ userId: { $in: candidateUserIds } }).sort({ createdAt: -1 }).limit(400).populate("movieId"),
  ]);

  const groupedSignalsByUserId = new Map();
  const addGroupedSignal = (collectionName, item) => {
    const otherUserId = String(item.userId);
    const grouped = groupedSignalsByUserId.get(otherUserId) || {
      favorites: [],
      history: [],
      interactions: [],
    };

    grouped[collectionName].push(item);
    groupedSignalsByUserId.set(otherUserId, grouped);
  };

  candidateFavorites.forEach((item) => addGroupedSignal("favorites", item));
  candidateHistory.forEach((item) => addGroupedSignal("history", item));
  candidateInteractions.forEach((item) => addGroupedSignal("interactions", item));

  const similarUsersById = new Map();
  groupedSignalsByUserId.forEach((grouped, otherUserId) => {
    const similarity = getCosineSimilarity(currentVector, buildUserVector(grouped));
    if (similarity > 0.05) {
      similarUsersById.set(otherUserId, similarity);
    }
  });

  const similarUserIds = [...similarUsersById.entries()]
    .sort((first, second) => second[1] - first[1])
    .slice(0, 20)
    .map(([otherUserId]) => otherUserId);

  if (similarUserIds.length === 0) {
    return { candidateMap: new Map(), similarUsersById };
  }

  const similarUserIdSet = new Set(similarUserIds);
  const otherFavorites = candidateFavorites.filter(
    (item) => similarUserIdSet.has(String(item.userId)) && !alreadySeenTmdbIds.has(item.tmdbId)
  );
  const otherHistory = candidateHistory.filter(
    (item) => similarUserIdSet.has(String(item.userId)) && !alreadySeenTmdbIds.has(item.tmdbId)
  );
  const otherInteractions = candidateInteractions.filter(
    (item) => similarUserIdSet.has(String(item.userId)) && !alreadySeenTmdbIds.has(item.tmdbId)
  );

  const candidateMap = new Map();
  const addCandidate = (item, sourceWeight) => {
    const movie = item.movieId;
    if (!movie || alreadySeenTmdbIds.has(movie.tmdbId)) {
      return;
    }

    const similarUserScore = similarUsersById.get(String(item.userId)) || 0;
    const current = candidateMap.get(movie.tmdbId) || {
      movie,
      collaborativeScore: 0,
      collaborativeUserIds: new Set(),
      candidateSources: [],
    };

    current.collaborativeScore += sourceWeight * similarUserScore * getRecencyMultiplier(item.watchedAt || item.createdAt);
    current.collaborativeUserIds.add(String(item.userId));
    current.candidateSources.push("collaborative");
    candidateMap.set(movie.tmdbId, current);
  };

  otherFavorites.forEach((item) => addCandidate(item, SOURCE_WEIGHTS.favorite));
  otherHistory.forEach((item) => addCandidate(item, SOURCE_WEIGHTS.watchHistory));
  otherInteractions.forEach((item) => addCandidate(item, SOURCE_WEIGHTS.interaction));

  return { candidateMap, similarUsersById };
};

const scoreCandidate = ({ movie, profile, collaborativeScore = 0, collaborativeUserIds = [] }) => {
  const signals = getMovieSignals(movie);
  const genreScore = signals.genreIds.reduce((score, id) => score + (profile.genres[id] || 0), 0);
  const castScore = signals.castIds.reduce((score, id) => score + (profile.cast[id] || 0), 0);
  const directorScore = signals.directorIds.reduce((score, id) => score + (profile.directors[id] || 0), 0);

  const normalizedGenreScore = normalizeScore(genreScore, profile.maxGenreScore * 2);
  const normalizedCastScore = normalizeScore(castScore, profile.maxCastScore * 2);
  const normalizedDirectorScore = normalizeScore(directorScore, profile.maxDirectorScore);
  const contentScore = normalizedGenreScore;
  const peopleScore = Math.min(normalizedCastScore * 0.45 + normalizedDirectorScore * 0.55, 1);
  const collaborativeBoost = Math.min(collaborativeScore / 8, 1);
  const qualityScore = Math.min(((movie.voteAverage || 0) / 10) * 0.7 + ((movie.popularity || 0) / 1000) * 0.3, 1);
  const finalScore =
    contentScore * SCORE_WEIGHTS.content +
    peopleScore * SCORE_WEIGHTS.people +
    collaborativeBoost * SCORE_WEIGHTS.collaborative +
    qualityScore * SCORE_WEIGHTS.quality;

  return {
    score: Math.max(0.1, Number(finalScore.toFixed(4))),
    matchedGenres: signals.genreIds.filter((id) => profile.genres[id]).slice(0, 5),
    matchedCast: signals.castIds.filter((id) => profile.cast[id]).slice(0, 5),
    matchedDirectors: signals.directorIds.filter((id) => profile.directors[id]).slice(0, 3),
    contentScore,
    peopleScore,
    collaborativeBoost,
    qualityScore,
    collaborativeUserIds: [...collaborativeUserIds].slice(0, 5),
  };
};

const generateRecommendations = async (userId) => {
  const [history, favorites, interactions] = await Promise.all([
    WatchHistory.find({ userId }).sort({ watchedAt: -1 }).limit(30).populate("movieId"),
    Favorite.find({ userId }).sort({ createdAt: -1 }).limit(30).populate("movieId"),
    UserInteraction.find({ userId }).sort({ createdAt: -1 }).limit(50).populate("movieId"),
  ]);

  await hydrateMissingPeopleSignals([...history, ...favorites, ...interactions]);

  const profile = buildTasteProfile({ history, favorites, interactions });
  if (profile.topGenres.length === 0 && profile.topCast.length === 0 && profile.topDirectors.length === 0) {
    return [];
  }

  const alreadySeenTmdbIds = new Set([
    ...history.map((item) => item.tmdbId),
    ...favorites.map((item) => item.tmdbId),
  ]);
  const userTmdbIds = [
    ...new Set([
      ...alreadySeenTmdbIds,
      ...interactions.map((item) => item.tmdbId).filter(Boolean),
    ]),
  ];
  const currentVector = buildUserVector({ history, favorites, interactions });

  const [contentCandidates, collaborativeCandidates] = await Promise.all([
    collectContentCandidates(profile, alreadySeenTmdbIds),
    collectCollaborativeCandidates({ userId, currentVector, userTmdbIds, alreadySeenTmdbIds }),
  ]);

  collaborativeCandidates.candidateMap.forEach((candidate, tmdbId) => {
    const current = contentCandidates.get(tmdbId) || {};
    contentCandidates.set(tmdbId, {
      ...current,
      ...candidate.movie.toObject(),
      candidateSources: [...(current.candidateSources || []), ...candidate.candidateSources],
      collaborativeScore: candidate.collaborativeScore,
      collaborativeUserIds: candidate.collaborativeUserIds,
    });
  });

  const scoredCandidates = [];
  for (const candidate of contentCandidates.values()) {
    const candidateTmdbId = candidate.tmdbId || candidate.id;
    if (!candidateTmdbId) {
      continue;
    }

    const detailedTmdbMovie = candidate.castIds?.length || candidate.directorIds?.length
      ? candidate
      : await fetchDetailedMovie(candidateTmdbId, candidate);
    const movie = await upsertMovieFromTmdb(detailedTmdbMovie);
    if (!movie?.tmdbId) {
      continue;
    }

    const scoreParts = scoreCandidate({
      movie,
      profile,
      collaborativeScore: candidate.collaborativeScore || 0,
      collaborativeUserIds: candidate.collaborativeUserIds || [],
    });

    scoredCandidates.push({ movie, scoreParts });
  }

  const topCandidates = scoredCandidates
    .sort((first, second) => second.scoreParts.score - first.scoreParts.score)
    .slice(0, 10);

  await Recommendation.deleteMany({ userId });

  const recommendationDocs = topCandidates.map(({ movie, scoreParts }) => {
    const explanationDetails = buildExplanationDetails({ movie, profile, scoreParts });

    return {
      userId,
      movieId: movie._id,
      tmdbId: movie.tmdbId,
      score: scoreParts.score,
      algorithm: "hybrid",
      reason: "Matched your weighted taste profile and similar-user signals.",
      humanExplanation: explanationDetails[0]?.text,
      explanationDetails,
      explanationTags: [
        scoreParts.matchedGenres.length > 0 ? "Matched preferred genres" : null,
        scoreParts.matchedCast.length > 0 ? "Matched familiar actors" : null,
        scoreParts.matchedDirectors.length > 0 ? "Matched preferred directors" : null,
        scoreParts.collaborativeBoost > 0 ? "Liked by users with similar taste" : null,
      ].filter(Boolean),
      signals: {
        matchedGenres: scoreParts.matchedGenres,
        matchedCast: scoreParts.matchedCast,
        matchedDirectors: scoreParts.matchedDirectors,
        basedOnMovieIds: [...new Set(profile.sourceMovieIds.map(String))].slice(0, 8),
        collaborativeUserIds: scoreParts.collaborativeUserIds,
        favoriteBoost: favorites.length > 0 ? SOURCE_WEIGHTS.favorite : 0,
        historyBoost: history.some((item) => item.status === "marked_watched")
          ? SOURCE_WEIGHTS.markedWatched
          : history.length > 0
            ? SOURCE_WEIGHTS.watchHistory
            : 0,
        interactionBoost: interactions.length > 0 ? SOURCE_WEIGHTS.interaction : 0,
        peopleBoost: scoreParts.peopleScore,
        collaborativeBoost: scoreParts.collaborativeBoost,
        popularityBoost: scoreParts.qualityScore,
      },
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 12),
    };
  });

  if (recommendationDocs.length === 0) {
    return [];
  }

  return Recommendation.insertMany(recommendationDocs);
};

module.exports = {
  generateRecommendations,
};
