import React, { useEffect, useMemo, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

const getPosterUrl = (posterPath) => {
  if (!posterPath) {
    return "https://via.placeholder.com/500x750?text=No+Poster";
  }
  return `${IMAGE_BASE_URL}${posterPath}`;
};

const formatRating = (rating) => {
  if (typeof rating !== "number") {
    return "N/A";
  }
  return rating.toFixed(1);
};

const getMovieYear = (movie) => {
  if (!movie?.release_date) {
    return null;
  }
  return Number(movie.release_date.slice(0, 4));
};

const pickTrailer = (videos) => {
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

const MovieCard = ({ movie, colors, onSelect, index }) => {
  return (
    <article
      className="yoko-fade-up group overflow-hidden rounded-2xl"
      style={{
        backgroundColor: `${colors.background}dd`,
        border: `1px solid ${colors.secondary}`,
        animationDelay: `${index * 65}ms`,
      }}
    >
      <button onClick={() => onSelect(movie)} className="block w-full text-left" type="button">
        <div className="relative aspect-[2/3] overflow-hidden">
          <img
            src={getPosterUrl(movie.poster_path)}
            alt={movie.title || "Movie poster"}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div
            className="absolute right-2 top-2 rounded-lg px-2 py-1 text-xs font-bold"
            style={{
              backgroundColor: `${colors.background}d9`,
              color: colors.primary,
            }}
          >
            {formatRating(movie.vote_average)}
          </div>
        </div>
        <div className="space-y-2 p-3">
          <h4
            className="text-sm font-bold md:text-base"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {movie.title}
          </h4>
          <p
            className="text-xs leading-relaxed md:text-sm"
            style={{
              color: `${colors.text}bf`,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {movie.overview || "No overview available."}
          </p>
        </div>
      </button>
    </article>
  );
};

const DashboardPage = ({ colors, themeMode, onToggleTheme, ThemeSwitch, user }) => {
  const navigate = useNavigate();
  const trailerScrollRef = useRef(null);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [activeGenreId, setActiveGenreId] = useState(null);
  const [genreMovies, setGenreMovies] = useState([]);
  const [popularTrailers, setPopularTrailers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [searchResults, setSearchResults] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState({
    trending: false,
    genres: false,
    genreMovies: false,
    search: false,
    recommendations: false,
    popularTrailers: false,
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [watchSignals, setWatchSignals] = useState([]);

  const tmdbApiKey = process.env.REACT_APP_TMDB_API_KEY;
  const yearOptions = useMemo(() => {
    const now = new Date().getFullYear();
    return ["all", ...Array.from({ length: 40 }, (_, index) => String(now - index))];
  }, []);

  const tmdbRequest = async (path, params = {}) => {
    if (!tmdbApiKey) {
      throw new Error("Missing REACT_APP_TMDB_API_KEY in your frontend .env file.");
    }

    const queryParams = new URLSearchParams({
      api_key: tmdbApiKey,
      language: "en-US",
      ...params,
    });

    const response = await fetch(`${TMDB_BASE_URL}${path}?${queryParams.toString()}`);

    if (!response.ok) {
      throw new Error(`TMDB request failed with status ${response.status}`);
    }

    return response.json();
  };

  const getTopGenreId = useMemo(() => {
    const counter = {};
    watchSignals.forEach((genreId) => {
      counter[genreId] = (counter[genreId] || 0) + 1;
    });

    const sorted = Object.entries(counter).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      return Number(sorted[0][0]);
    }

    return activeGenreId;
  }, [activeGenreId, watchSignals]);

  const captureInteraction = (movie) => {
    if (!movie || !Array.isArray(movie.genre_ids)) {
      return;
    }

    setWatchSignals((previous) => [...previous, ...movie.genre_ids].slice(-60));
  };

  const fetchTrendingMovies = async () => {
    setLoading((previous) => ({ ...previous, trending: true }));
    try {
      const data = await tmdbRequest("/trending/movie/week");
      const baseResults = data.results || [];
      const filteredResults =
        selectedYear === "all"
          ? baseResults
          : baseResults.filter((movie) => String(getMovieYear(movie)) === selectedYear);
      setTrendingMovies(filteredResults.slice(0, 10));
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading((previous) => ({ ...previous, trending: false }));
    }
  };

  const fetchGenres = async () => {
    setLoading((previous) => ({ ...previous, genres: true }));
    try {
      const data = await tmdbRequest("/genre/movie/list");
      const incomingGenres = data.genres || [];
      setGenres(incomingGenres);
      if (!activeGenreId && incomingGenres.length > 0) {
        setActiveGenreId(incomingGenres[0].id);
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading((previous) => ({ ...previous, genres: false }));
    }
  };

  const fetchGenreMovies = async (genreId) => {
    if (!genreId) {
      return;
    }

    setLoading((previous) => ({ ...previous, genreMovies: true }));
    try {
      const params = {
        with_genres: String(genreId),
        sort_by: "popularity.desc",
      };
      if (selectedYear !== "all") {
        params.primary_release_year = selectedYear;
      }
      const data = await tmdbRequest("/discover/movie", params);
      setGenreMovies((data.results || []).slice(0, 20));
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading((previous) => ({ ...previous, genreMovies: false }));
    }
  };

  const fetchRecommendations = async (genreId) => {
    if (!genreId) {
      setRecommendations([]);
      return;
    }

    setLoading((previous) => ({ ...previous, recommendations: true }));
    try {
      const params = {
        with_genres: String(genreId),
        sort_by: "vote_average.desc",
        "vote_count.gte": "150",
      };
      if (selectedYear !== "all") {
        params.primary_release_year = selectedYear;
      }
      const data = await tmdbRequest("/discover/movie", params);
      setRecommendations((data.results || []).slice(0, 6));
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading((previous) => ({ ...previous, recommendations: false }));
    }
  };

  const fetchPopularTrailers = async () => {
    setLoading((previous) => ({ ...previous, popularTrailers: true }));
    try {
      const popularData = await tmdbRequest("/movie/popular");
      const candidates = (popularData.results || []).slice(0, 8);

      const videosByMovie = await Promise.all(
        candidates.map(async (movie) => {
          try {
            const videoData = await tmdbRequest(`/movie/${movie.id}/videos`);
            const trailer = pickTrailer(videoData.results || []);
            if (!trailer) {
              return null;
            }

            return {
              id: movie.id,
              title: movie.title,
              posterPath: movie.poster_path,
              trailerKey: trailer.key,
              trailerName: trailer.name || `${movie.title} Trailer`,
            };
          } catch (_error) {
            return null;
          }
        })
      );

      setPopularTrailers(videosByMovie.filter(Boolean).slice(0, 4));
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading((previous) => ({ ...previous, popularTrailers: false }));
    }
  };

  useEffect(() => {
    fetchGenres();
    fetchPopularTrailers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchTrendingMovies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  useEffect(() => {
    if (activeGenreId) {
      fetchGenreMovies(activeGenreId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGenreId, selectedYear]);

  useEffect(() => {
    fetchRecommendations(getTopGenreId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getTopGenreId, selectedYear]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timerId = setTimeout(async () => {
      setLoading((previous) => ({ ...previous, search: true }));
      try {
        const data = await tmdbRequest("/search/movie", {
          query: searchQuery,
          include_adult: "false",
          ...(selectedYear === "all" ? {} : { primary_release_year: selectedYear }),
        });
        setSearchResults((data.results || []).slice(0, 8));
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setLoading((previous) => ({ ...previous, search: false }));
      }
    }, 450);

    return () => clearTimeout(timerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedYear]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      setErrorMessage(error.message || "Logout failed.");
    }
  };

  const scrollTrailers = (direction) => {
    if (!trailerScrollRef.current) {
      return;
    }

    const amount = 280;
    trailerScrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  const activeGenreName = genres.find((genre) => genre.id === getTopGenreId)?.name || "your taste";

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: colors.background,
        color: colors.text,
        fontFamily: "Andika, sans-serif",
      }}
    >
      <div
        className="pointer-events-none fixed -left-28 top-32 h-72 w-72 rounded-full blur-3xl"
        style={{ backgroundColor: `${colors.primary}30` }}
      />
      <div
        className="pointer-events-none fixed right-0 top-0 h-80 w-80 rounded-full blur-3xl"
        style={{ backgroundColor: `${colors.accent}2d` }}
      />

      <header className="sticky top-0 z-20 border-b backdrop-blur"
        style={{
          borderColor: `${colors.secondary}`,
          backgroundColor: `${colors.background}df`,
        }}>
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              <span style={{ color: colors.primary }}>YO</span>
              <span style={{ color: colors.text }}>K</span>
              <span style={{ color: colors.accent }}>O</span>
            </h1>
            <p className="text-xs" style={{ color: `${colors.text}b3` }}>
              Welcome, {user?.displayName || user?.email || "Movie Lover"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ThemeSwitch themeMode={themeMode} onToggleTheme={onToggleTheme} colors={colors} />
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-full px-4 py-2 text-sm font-semibold transition hover:opacity-90"
              style={{
                backgroundColor: colors.secondary,
                color: colors.text,
                border: `1px solid ${colors.accent}`,
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl gap-7 px-4 pb-10 pt-6 md:px-8">
        {errorMessage ? (
          <div
            className="rounded-2xl px-4 py-3 text-sm font-semibold"
            style={{
              border: `1px solid #d9534f`,
              backgroundColor: "#d9534f1a",
              color: "#d9534f",
            }}
          >
            {errorMessage}
          </div>
        ) : null}

        <section
          className="yoko-fade-up rounded-3xl p-5 md:p-6"
          style={{
            border: `1px solid ${colors.secondary}`,
            background: `linear-gradient(120deg, ${colors.secondary}90, ${colors.background})`,
          }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold md:text-3xl">Discover movies instantly</h2>
              <p className="mt-1 text-sm md:text-base" style={{ color: `${colors.text}c4` }}>
                Search any movie and click cards to personalize recommendation signals.
              </p>
            </div>
            <div className="w-full md:max-w-lg">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_130px]">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search movies, actors, or keywords"
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none md:text-base"
                  style={{
                    backgroundColor: colors.background,
                    color: colors.text,
                    border: `1px solid ${colors.accent}`,
                  }}
                />
                <select
                  value={selectedYear}
                  onChange={(event) => setSelectedYear(event.target.value)}
                  className="w-full rounded-2xl px-3 py-3 text-sm font-semibold outline-none md:text-base"
                  style={{
                    backgroundColor: colors.background,
                    color: colors.text,
                    border: `1px solid ${colors.accent}`,
                  }}
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year === "all" ? "All Years" : year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
            {(loading.search ? new Array(4).fill(null) : searchResults.slice(0, 4)).map((movie, index) =>
              movie ? (
                <MovieCard
                  key={`search-${movie.id}`}
                  movie={movie}
                  colors={colors}
                  onSelect={captureInteraction}
                  index={index}
                />
              ) : (
                <div
                  key={`search-skeleton-${index}`}
                  className="yoko-shimmer h-56 rounded-2xl"
                  style={{ backgroundColor: `${colors.secondary}` }}
                />
              )
            )}
            {!loading.search && searchQuery.trim() && searchResults.length === 0 ? (
              <p className="col-span-2 text-sm md:col-span-4" style={{ color: `${colors.text}b3` }}>
                No matching results found. Try another title.
              </p>
            ) : null}
          </div>
        </section>

        <section
          className="yoko-fade-up rounded-3xl p-5 md:p-6"
          style={{
            border: `1px solid ${colors.secondary}`,
            background: `linear-gradient(120deg, ${colors.background}, ${colors.secondary}55)`,
          }}
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold md:text-2xl">Popular Movie Trailers</h3>
              <p className="mt-1 text-sm md:text-base" style={{ color: `${colors.text}bc` }}>
                Watch official trailers from TMDB popular picks.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchPopularTrailers}
              className="rounded-full px-3 py-1.5 text-xs font-semibold md:text-sm"
              style={{
                backgroundColor: colors.secondary,
                color: colors.text,
                border: `1px solid ${colors.accent}`,
              }}
            >
              Refresh Trailers
            </button>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => scrollTrailers("left")}
              aria-label="Scroll trailers left"
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full p-2"
              style={{
                backgroundColor: `${colors.background}db`,
                color: colors.text,
                border: `1px solid ${colors.accent}`,
              }}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => scrollTrailers("right")}
              aria-label="Scroll trailers right"
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full p-2"
              style={{
                backgroundColor: `${colors.background}db`,
                color: colors.text,
                border: `1px solid ${colors.accent}`,
              }}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                <path d="m8.59 16.59 1.41 1.41 6-6-6-6-1.41 1.41L13.17 12z" />
              </svg>
            </button>

            <div
              ref={trailerScrollRef}
              className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 pr-10 pt-1"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              <style>{`.no-scrollbar::-webkit-scrollbar{display:none;}`}</style>
            </div>

            <div
              ref={trailerScrollRef}
              className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 pr-10 pt-1"
            >
              {(loading.popularTrailers ? new Array(6).fill(null) : popularTrailers).map((item, index) =>
                item ? (
                  <article
                    key={item.id}
                    className="yoko-fade-up w-[220px] shrink-0 snap-start overflow-hidden rounded-2xl"
                    style={{
                      border: `1px solid ${colors.secondary}`,
                      backgroundColor: `${colors.background}e0`,
                      animationDelay: `${index * 70}ms`,
                    }}
                  >
                    <a
                      href={`https://www.youtube.com/watch?v=${item.trailerKey}`}
                      target="_blank"
                      rel="noreferrer"
                      className="block"
                    >
                      <div className="relative aspect-video w-full overflow-hidden">
                        <img
                          src={`https://img.youtube.com/vi/${item.trailerKey}/hqdefault.jpg`}
                          alt={`${item.title} trailer thumbnail`}
                          className="h-full w-full object-cover transition duration-500 hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span
                            className="rounded-full p-2"
                            style={{
                              backgroundColor: `${colors.background}d8`,
                              border: `1px solid ${colors.accent}`,
                            }}
                          >
                            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" style={{ color: colors.primary }}>
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1 p-3">
                        <h4
                          className="text-sm font-bold"
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {item.title}
                        </h4>
                        <p
                          className="text-xs"
                          style={{
                            color: `${colors.text}b5`,
                            display: "-webkit-box",
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {item.trailerName}
                        </p>
                      </div>
                    </a>
                  </article>
                ) : (
                  <div
                    key={`trailer-skeleton-${index}`}
                    className="yoko-shimmer aspect-video w-[220px] shrink-0 rounded-2xl"
                    style={{ backgroundColor: `${colors.secondary}` }}
                  />
                )
              )}
            </div>

            {(loading.popularTrailers ? new Array(4).fill(null) : popularTrailers).map((item, index) =>
              item ? (
                <React.Fragment key={`trailer-hidden-${item.id}-${index}`} />
              ) : (
                <React.Fragment key={`trailer-hidden-skeleton-${index}`} />
              )
            )}
            {!loading.popularTrailers && popularTrailers.length === 0 ? (
              <p className="text-sm" style={{ color: `${colors.text}b3` }}>
                No trailers available right now. Try refreshing.
              </p>
            ) : null}
          </div>
        </section>

        <section className="grid gap-7 lg:grid-cols-12">
          <div className="grid gap-7 lg:col-span-7">
            <div
              className="yoko-fade-up rounded-3xl p-5"
              style={{
                border: `1px solid ${colors.secondary}`,
                backgroundColor: `${colors.background}f2`,
              }}
            >
              <h3 className="text-xl font-bold md:text-2xl">Genres</h3>
              <p className="mt-1 text-sm" style={{ color: `${colors.text}ba` }}>
                Pick a genre and we will curate related titles for you.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(loading.genres ? [] : genres).map((genre) => {
                  const active = genre.id === activeGenreId;
                  return (
                    <button
                      key={genre.id}
                      type="button"
                      onClick={() => setActiveGenreId(genre.id)}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold transition md:text-sm"
                      style={{
                        backgroundColor: active ? colors.primary : colors.secondary,
                        color: active ? "#ffffff" : colors.text,
                        border: `1px solid ${colors.accent}`,
                      }}
                    >
                      {genre.name}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {(loading.genreMovies ? new Array(20).fill(null) : genreMovies.slice(0, 20)).map((movie, index) =>
                  movie ? (
                    <MovieCard
                      key={`genre-${movie.id}`}
                      movie={movie}
                      colors={colors}
                      onSelect={captureInteraction}
                      index={index}
                    />
                  ) : (
                    <div
                      key={`genre-skeleton-${index}`}
                      className="yoko-shimmer h-56 rounded-2xl"
                      style={{ backgroundColor: `${colors.secondary}` }}
                    />
                  )
                )}
              </div>
            </div>

            <div
              className="yoko-fade-up rounded-3xl p-5"
              style={{
                border: `1px solid ${colors.secondary}`,
                background: `linear-gradient(145deg, ${colors.background}, ${colors.secondary}7a)`,
              }}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xl font-bold md:text-2xl">Recommendations</h3>
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{
                    color: colors.primary,
                    border: `1px solid ${colors.primary}`,
                    backgroundColor: `${colors.primary}1f`,
                  }}
                >
                  Based on {activeGenreName}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {(loading.recommendations ? new Array(6).fill(null) : recommendations).map((movie, index) =>
                  movie ? (
                    <MovieCard
                      key={`rec-${movie.id}`}
                      movie={movie}
                      colors={colors}
                      onSelect={captureInteraction}
                      index={index}
                    />
                  ) : (
                    <div
                      key={`rec-skeleton-${index}`}
                      className="yoko-shimmer h-56 rounded-2xl"
                      style={{ backgroundColor: `${colors.secondary}` }}
                    />
                  )
                )}
              </div>
            </div>
          </div>

          <div
            className="yoko-fade-up rounded-3xl p-5 lg:col-span-5"
            style={{
              border: `1px solid ${colors.secondary}`,
              backgroundColor: `${colors.background}f2`,
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold md:text-2xl">Trending This Week</h3>
              <button
                type="button"
                onClick={fetchTrendingMovies}
                className="rounded-full px-3 py-1.5 text-xs font-semibold md:text-sm"
                style={{
                  backgroundColor: colors.secondary,
                  color: colors.text,
                  border: `1px solid ${colors.accent}`,
                }}
              >
                Refresh
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
              {(loading.trending ? new Array(7).fill(null) : trendingMovies.slice(0, 7)).map((movie, index) =>
                movie ? (
                  <MovieCard
                    key={`trend-${movie.id}`}
                    movie={movie}
                    colors={colors}
                    onSelect={captureInteraction}
                    index={index}
                  />
                ) : (
                  <div
                    key={`trend-skeleton-${index}`}
                    className="yoko-shimmer h-64 rounded-2xl"
                    style={{ backgroundColor: `${colors.secondary}` }}
                  />
                )
              )}
            </div>
          </div>
        </section>
      </main>

      <footer
        className="mx-auto mt-2 w-full max-w-7xl rounded-2xl px-4 py-5 md:px-8"
        style={{
          border: `1px solid ${colors.secondary}`,
          backgroundColor: `${colors.background}e8`,
        }}
      >
        <h4 className="text-sm font-bold uppercase tracking-[0.14em]" style={{ color: `${colors.text}b8` }}>
          Credits
        </h4>
        <div className="mt-3 flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <img
              src="/tmdb-logo.svg"
              alt="TMDB Logo"
              className="h-6 w-auto md:h-7"
              loading="lazy"
            />
            <p className="max-w-3xl text-xs leading-relaxed md:text-sm" style={{ color: `${colors.text}c7` }}>
              This product uses the TMDB API but is not endorsed or certified by TMDB.
            </p>
          </div>
          <a
            href="https://www.themoviedb.org"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold underline decoration-2 underline-offset-4 md:text-sm"
            style={{ color: colors.accent }}
          >
            View TMDB
          </a>
        </div>
      </footer>
    </div>
  );
};

export default DashboardPage;
