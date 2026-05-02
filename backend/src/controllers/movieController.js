const { requestTmdb } = require("../services/tmdbService");
const { upsertMovieFromTmdb } = require("../services/movieService");

const searchMovies = async (req, res, next) => {
  try {
    const data = await requestTmdb("/search/movie", {
      query: req.query.query || "",
      include_adult: "false",
      ...(req.query.year ? { primary_release_year: req.query.year } : {}),
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
};

const discoverMovies = async (req, res, next) => {
  try {
    const params = {
      sort_by: req.query.sort_by || "popularity.desc",
      "vote_count.gte": req.query.vote_count_gte || "40",
    };

    if (req.query.genreId) params.with_genres = req.query.genreId;
    if (req.query.year) params.primary_release_year = req.query.year;
    if (req.query.minRating) params["vote_average.gte"] = req.query.minRating;

    const data = await requestTmdb("/discover/movie", params);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getTrendingMovies = async (_req, res, next) => {
  try {
    const data = await requestTmdb("/trending/movie/week");
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getMovieDetails = async (req, res, next) => {
  try {
    const data = await requestTmdb(`/movie/${req.params.tmdbId}`, {
      append_to_response: "videos",
    });
    const movie = await upsertMovieFromTmdb(data);

    res.json({ tmdb: data, movie });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  discoverMovies,
  getMovieDetails,
  getTrendingMovies,
  searchMovies,
};
