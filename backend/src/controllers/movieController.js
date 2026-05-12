const { requestTmdb } = require("../services/tmdbService");
const { upsertMovieFromTmdb } = require("../services/movieService");
const AiInsight = require("../models/AiInsight");
const { INSIGHT_VERSION, generateMovieInsight } = require("../services/geminiService");

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
      append_to_response: "videos,credits,recommendations,similar,release_dates",
    });
    let watchProviders = null;

    try {
      watchProviders = await requestTmdb(`/movie/${req.params.tmdbId}/watch/providers`);
    } catch (watchProviderError) {
      console.warn("TMDb watch provider fetch failed:", watchProviderError.message);
    }

    const enrichedData = {
      ...data,
      watchProviders,
    };
    const movie = await upsertMovieFromTmdb(data);
    const cachedAiInsight = await AiInsight.findOne({ tmdbId: movie.tmdbId });
    let aiInsight = cachedAiInsight?.insightVersion === INSIGHT_VERSION ? cachedAiInsight : null;
    let aiInsightError = null;

    if (!aiInsight) {
      try {
        const generatedInsight = await generateMovieInsight(movie);
        if (generatedInsight) {
          aiInsight = await AiInsight.findOneAndUpdate(
            { tmdbId: movie.tmdbId },
            {
              movieId: movie._id,
              tmdbId: movie.tmdbId,
              summary: generatedInsight.summary,
              reasons: generatedInsight.reasons,
              bestFor: generatedInsight.bestFor,
              moodTags: generatedInsight.moodTags,
              generatedBy: generatedInsight.generatedBy,
              insightVersion: generatedInsight.insightVersion,
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
          );
        }
      } catch (insightError) {
        aiInsightError = insightError.message;
        console.error("Gemini insight generation failed:", insightError.message);
      }
    }

    res.json({
      tmdb: enrichedData,
      movie,
      aiInsight,
      aiInsightAvailable: Boolean(aiInsight),
      aiInsightConfigured: Boolean(process.env.GEMINI_API_KEY),
      aiInsightError,
      aiInsightVersion: INSIGHT_VERSION,
    });
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
