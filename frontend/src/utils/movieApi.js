export const TMDB_BASE_URL = "https://api.themoviedb.org/3";
export const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
export const BACKDROP_BASE_URL = "https://image.tmdb.org/t/p/w1280";
export const PROFILE_BASE_URL = "https://image.tmdb.org/t/p/w185";
export const PROVIDER_LOGO_BASE_URL = "https://image.tmdb.org/t/p/w92";

export const WATCH_HISTORY_KEY = "yoko-watch-history";
export const FAVORITES_KEY = "yoko-favorites";

export const getPosterUrl = (posterPath) => {
  if (!posterPath) {
    return "https://via.placeholder.com/500x750?text=No+Poster";
  }

  return `${IMAGE_BASE_URL}${posterPath}`;
};

export const getBackdropUrl = (backdropPath) => {
  if (!backdropPath) {
    return null;
  }

  return `${BACKDROP_BASE_URL}${backdropPath}`;
};

export const getProfileUrl = (profilePath) => {
  if (!profilePath) {
    return null;
  }

  return `${PROFILE_BASE_URL}${profilePath}`;
};

export const getProviderLogoUrl = (logoPath) => {
  if (!logoPath) {
    return null;
  }

  return `${PROVIDER_LOGO_BASE_URL}${logoPath}`;
};

export const getPreferredWatchRegion = () => {
  if (typeof navigator === "undefined") {
    return "US";
  }

  const locale = navigator.language || navigator.languages?.[0] || "";
  const region = locale.split("-")[1];
  return region ? region.toUpperCase() : "US";
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

export const getAgeFromBirthDate = (birthDate) => {
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

export const isUnderageProfile = (profile) => {
  const age = getAgeFromBirthDate(profile?.preferences?.birthDate);
  return typeof age === "number" && age < 18;
};

export const getMaxCertificationForProfile = (profile) => {
  const age = getAgeFromBirthDate(profile?.preferences?.birthDate);
  const maturityLimit = profile?.preferences?.maturityLimit || "auto";

  if (typeof age === "number") {
    if (age < 13) return "PG";
    if (age < 18) return "PG-13";
  }

  if (maturityLimit === "pg13") {
    return "PG-13";
  }

  return null;
};

export const getContentLimitLabel = (profile) => {
  const maxCertification = getMaxCertificationForProfile(profile);
  if (maxCertification === "PG") {
    return "PG and below";
  }

  if (maxCertification === "PG-13") {
    return "PG-13 and below";
  }

  return "Standard catalog";
};

export const getMovieUsCertification = (releaseDates) => {
  const usRelease = releaseDates?.results?.find((item) => item.iso_3166_1 === "US");
  const releaseWithCertification =
    usRelease?.release_dates?.find((release) => release.certification) ||
    releaseDates?.results
      ?.flatMap((item) => item.release_dates || [])
      .find((release) => release.certification);

  return releaseWithCertification?.certification || "";
};

export const isCertificationAllowed = (certification, maxCertification) => {
  if (!maxCertification) {
    return true;
  }

  const ratingRank = {
    G: 1,
    PG: 2,
    "PG-13": 3,
    R: 4,
    "NC-17": 5,
  };

  const normalizedCertification = String(certification || "").trim().toUpperCase();
  if (!ratingRank[normalizedCertification]) {
    return false;
  }

  return ratingRank[normalizedCertification] <= ratingRank[maxCertification];
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
