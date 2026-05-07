const Movie = require("../models/Movie");

const normalizeMovie = (tmdbMovie) => {
  const genres = tmdbMovie.genres || [];
  const genreIds = tmdbMovie.genre_ids || tmdbMovie.genreIds || genres.map((genre) => genre.id);
  const credits = tmdbMovie.credits || {};
  const hasCredits = Array.isArray(credits.cast) || Array.isArray(credits.crew);
  const cast = (credits.cast || [])
    .filter((person) => person.id)
    .sort((first, second) => (first.order ?? 999) - (second.order ?? 999))
    .slice(0, 12)
    .map((person) => ({
      id: person.id,
      name: person.name,
      character: person.character,
      order: person.order,
    }));
  const directors = (credits.crew || [])
    .filter((person) => person.id && person.job === "Director")
    .map((person) => ({
      id: person.id,
      name: person.name,
    }));

  const normalized = {
    tmdbId: tmdbMovie.tmdbId || tmdbMovie.id,
    title: tmdbMovie.title || tmdbMovie.name || "Untitled",
    originalTitle: tmdbMovie.originalTitle || tmdbMovie.original_title,
    overview: tmdbMovie.overview,
    genres,
    genreIds,
    releaseDate: tmdbMovie.releaseDate || tmdbMovie.release_date,
    releaseYear: tmdbMovie.releaseYear || (tmdbMovie.release_date ? Number(tmdbMovie.release_date.slice(0, 4)) : undefined),
    voteAverage: tmdbMovie.voteAverage ?? tmdbMovie.vote_average,
    voteCount: tmdbMovie.voteCount ?? tmdbMovie.vote_count,
    popularity: tmdbMovie.popularity,
    posterPath: tmdbMovie.posterPath || tmdbMovie.poster_path,
    backdropPath: tmdbMovie.backdropPath || tmdbMovie.backdrop_path,
    runtime: tmdbMovie.runtime,
    language: tmdbMovie.language || tmdbMovie.original_language,
    cachedAt: new Date(),
  };

  if (hasCredits) {
    normalized.cast = cast;
    normalized.castIds = cast.map((person) => person.id);
    normalized.directors = directors;
    normalized.directorIds = directors.map((person) => person.id);
  } else {
    if (tmdbMovie.cast) normalized.cast = tmdbMovie.cast;
    if (tmdbMovie.castIds) normalized.castIds = tmdbMovie.castIds;
    if (tmdbMovie.directors) normalized.directors = tmdbMovie.directors;
    if (tmdbMovie.directorIds) normalized.directorIds = tmdbMovie.directorIds;
  }

  return normalized;
};

const upsertMovieFromTmdb = async (tmdbMovie) => {
  const normalized = normalizeMovie(tmdbMovie);
  if (!normalized.tmdbId) {
    throw new Error("Cannot upsert movie without a TMDB id.");
  }

  return Movie.findOneAndUpdate(
    { tmdbId: normalized.tmdbId },
    { $set: normalized },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

module.exports = {
  normalizeMovie,
  upsertMovieFromTmdb,
};
