import { auth } from "../firebase";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

const getAuthHeaders = async () => {
  const user = auth.currentUser;
  const headers = {
    "Content-Type": "application/json",
  };

  if (!user) {
    return headers;
  }

  const token = await user.getIdToken();
  headers.Authorization = `Bearer ${token}`;

  // Development fallback for the backend before Firebase Admin credentials are configured.
  headers["x-dev-firebase-uid"] = user.uid;
  headers["x-dev-email"] = user.email || "";
  headers["x-dev-name"] = user.displayName || user.email || "Movie Lover";

  return headers;
};

export const apiRequest = async (path, options = {}) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `API request failed with status ${response.status}`);
  }

  return data;
};

export const syncCurrentUser = async (user) => {
  if (!user) {
    return null;
  }

  return apiRequest("/users/sync", {
    method: "POST",
    body: JSON.stringify({
      name: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
    }),
  });
};

export const recordMovieDetailView = async (tmdbId, source = "details") => {
  return apiRequest("/interactions", {
    method: "POST",
    body: JSON.stringify({
      tmdbId: Number(tmdbId),
      eventType: "view_details",
      source,
    }),
  });
};

export const addFavoriteMovie = async (tmdbId, source = "details") => {
  return apiRequest("/favorites", {
    method: "POST",
    body: JSON.stringify({
      tmdbId: Number(tmdbId),
      source,
    }),
  });
};

export const getWatchHistory = async () => {
  return apiRequest("/history");
};

export const getFavoriteMovies = async () => {
  return apiRequest("/favorites");
};

export const removeFavoriteMovie = async (tmdbId) => {
  return apiRequest(`/favorites/${tmdbId}`, {
    method: "DELETE",
  });
};

export const getRecommendations = async (refresh = false) => {
  return apiRequest(`/recommendations${refresh ? "?refresh=true" : ""}`);
};

export const normalizeBackendMovie = (movie) => {
  if (!movie) {
    return null;
  }

  return {
    id: movie.tmdbId || movie.id,
    title: movie.title,
    overview: movie.overview,
    poster_path: movie.posterPath || movie.poster_path,
    backdrop_path: movie.backdropPath || movie.backdrop_path,
    vote_average: movie.voteAverage ?? movie.vote_average,
    vote_count: movie.voteCount ?? movie.vote_count,
    release_date: movie.releaseDate || movie.release_date,
    genre_ids: movie.genreIds || movie.genre_ids || [],
  };
};

export const normalizeSavedMovieRecord = (record) => {
  if (!record) {
    return null;
  }

  return normalizeBackendMovie(record.movieId || record.movie || record);
};

export const normalizeRecommendationRecord = (record) => {
  const movie = normalizeSavedMovieRecord(record);
  if (!movie) {
    return null;
  }

  return {
    ...movie,
    recommendationMeta: {
      reason: record.reason,
      humanExplanation: record.humanExplanation,
      explanationDetails: record.explanationDetails || [],
      score: record.score,
      algorithm: record.algorithm,
      explanationTags: record.explanationTags || [],
      signals: record.signals,
    },
  };
};
