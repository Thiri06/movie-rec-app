const TmdbCache = require("../models/TmdbCache");

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const getCacheKey = (endpoint, params) => {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((accumulator, key) => {
      accumulator[key] = params[key];
      return accumulator;
    }, {});

  return `${endpoint}:${JSON.stringify(sortedParams)}`;
};

const requestTmdb = async (endpoint, params = {}, options = {}) => {
  if (!process.env.TMDB_API_KEY) {
    throw new Error("TMDB_API_KEY is not configured.");
  }

  const ttlSeconds = options.ttlSeconds || 60 * 30;
  const cacheKey = getCacheKey(endpoint, params);
  const cached = await TmdbCache.findOne({ cacheKey });

  if (cached && cached.expiresAt > new Date()) {
    return cached.data;
  }

  const queryParams = new URLSearchParams({
    api_key: process.env.TMDB_API_KEY,
    language: "en-US",
    ...params,
  });

  const response = await fetch(`${TMDB_BASE_URL}${endpoint}?${queryParams.toString()}`);

  if (!response.ok) {
    throw new Error(`TMDB request failed with status ${response.status}`);
  }

  const data = await response.json();
  await TmdbCache.findOneAndUpdate(
    { cacheKey },
    {
      endpoint,
      params,
      data,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return data;
};

module.exports = {
  requestTmdb,
};
