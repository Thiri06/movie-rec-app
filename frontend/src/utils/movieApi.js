export const TMDB_BASE_URL = "https://api.themoviedb.org/3";
export const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

export const WATCH_HISTORY_KEY = "yoko-watch-history";
export const FAVORITES_KEY = "yoko-favorites";

export const getPosterUrl = (posterPath) => {
  if (!posterPath) {
    return "https://via.placeholder.com/500x750?text=No+Poster";
  }

  return `${IMAGE_BASE_URL}${posterPath}`;
};

export const formatRating = (rating) => {
  if (typeof rating !== "number") {
    return "N/A";
  }

  return rating.toFixed(1);
};

export const getMovieYear = (movie) => {
  if (!movie?.release_date) {
    return null;
  }

  return Number(movie.release_date.slice(0, 4));
};

export const pickTrailer = (videos) => {
  if (!Array.isArray(videos)) {
    return null;
  }

  const youtubeTrailers = videos.filter(
    (video) =>
      video.site === "YouTube" &&
      (video.type === "Trailer" || video.type === "Teaser") &&
      typeof video.key === "string"
  );

  const officialTrailer = youtubeTrailers.find((video) => video.official && video.type === "Trailer");
  return officialTrailer || youtubeTrailers[0] || null;
};

export const createTmdbRequest = (apiKey) => async (path, params = {}) => {
  if (!apiKey) {
    throw new Error("Missing REACT_APP_TMDB_API_KEY in your frontend .env file.");
  }

  const queryParams = new URLSearchParams({
    api_key: apiKey,
    language: "en-US",
    ...params,
  });

  const response = await fetch(`${TMDB_BASE_URL}${path}?${queryParams.toString()}`);

  if (!response.ok) {
    throw new Error(`TMDB request failed with status ${response.status}`);
  }

  return response.json();
};

export const readStoredMovies = (key) => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
};

export const saveStoredMovies = (key, movies) => {
  window.localStorage.setItem(key, JSON.stringify(movies.slice(0, 40)));
};

export const addStoredMovie = (key, movie) => {
  if (!movie?.id) {
    return [];
  }

  const current = readStoredMovies(key);
  const compactMovie = {
    id: movie.id,
    title: movie.title,
    poster_path: movie.poster_path,
    overview: movie.overview,
    vote_average: movie.vote_average,
    release_date: movie.release_date,
    genre_ids: movie.genre_ids || (movie.genres || []).map((genre) => genre.id),
  };
  const next = [compactMovie, ...current.filter((item) => item.id !== movie.id)];
  saveStoredMovies(key, next);
  return next;
};

export const getTopGenreIdFromMovies = (movies) => {
  const counter = {};

  movies.forEach((movie) => {
    (movie.genre_ids || []).forEach((genreId) => {
      counter[genreId] = (counter[genreId] || 0) + 1;
    });
  });

  const sorted = Object.entries(counter).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? Number(sorted[0][0]) : null;
};
