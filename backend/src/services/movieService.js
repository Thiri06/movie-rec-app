const Movie = require("../models/Movie");

const normalizeMovie = (tmdbMovie) => {
  const genres = tmdbMovie.genres || [];
  const genreIds = tmdbMovie.genre_ids || genres.map((genre) => genre.id);

  return {
    tmdbId: tmdbMovie.id,
    title: tmdbMovie.title || tmdbMovie.name || "Untitled",
    originalTitle: tmdbMovie.original_title,
    overview: tmdbMovie.overview,
    genres,
    genreIds,
    releaseDate: tmdbMovie.release_date,
    releaseYear: tmdbMovie.release_date ? Number(tmdbMovie.release_date.slice(0, 4)) : undefined,
    voteAverage: tmdbMovie.vote_average,
    voteCount: tmdbMovie.vote_count,
    popularity: tmdbMovie.popularity,
    posterPath: tmdbMovie.poster_path,
    backdropPath: tmdbMovie.backdrop_path,
    runtime: tmdbMovie.runtime,
    language: tmdbMovie.original_language,
    cachedAt: new Date(),
  };
};

const upsertMovieFromTmdb = async (tmdbMovie) => {
  const normalized = normalizeMovie(tmdbMovie);
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
