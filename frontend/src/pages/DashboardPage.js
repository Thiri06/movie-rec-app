import React, { useEffect, useMemo, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import DashboardNav from "../components/DashboardNav";
import MovieCard from "../components/MovieCard";
import { auth } from "../firebase";
import {
  FAVORITES_KEY,
  WATCH_HISTORY_KEY,
  createTmdbRequest,
  getTopGenreIdFromMovies,
  pickTrailer,
  readStoredMovies,
} from "../utils/movieApi";

const DashboardPage = ({ colors, themeMode, onToggleTheme, ThemeSwitch, user }) => {
  const navigate = useNavigate();
  const trailerScrollRef = useRef(null);

  const [genres, setGenres] = useState([]);
  const [popularTrailers, setPopularTrailers] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [watchHistory, setWatchHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState({
    genres: false,
    popularTrailers: false,
    recommendations: false,
    trending: false,
  });
  const [errorMessage, setErrorMessage] = useState("");

  const tmdbRequest = useMemo(
    () => createTmdbRequest(process.env.REACT_APP_TMDB_API_KEY),
    []
  );

  const personalizationSeed = useMemo(() => {
    const historyTopGenreId = getTopGenreIdFromMovies(watchHistory);
    const favoriteTopGenreId = getTopGenreIdFromMovies(favorites);

    return historyTopGenreId || favoriteTopGenreId || genres[0]?.id || null;
  }, [favorites, genres, watchHistory]);

  const activeGenreName =
    genres.find((genre) => genre.id === personalizationSeed)?.name || "your recent activity";
  const explanationMovie = watchHistory[0]?.title || favorites[0]?.title || "your saved taste profile";

  const loadStoredPersonalization = () => {
    setWatchHistory(readStoredMovies(WATCH_HISTORY_KEY));
    setFavorites(readStoredMovies(FAVORITES_KEY));
  };

  const fetchGenres = async () => {
    setLoading((previous) => ({ ...previous, genres: true }));
    try {
      const data = await tmdbRequest("/genre/movie/list");
      setGenres(data.genres || []);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading((previous) => ({ ...previous, genres: false }));
    }
  };

  const fetchTrendingMovies = async () => {
    setLoading((previous) => ({ ...previous, trending: true }));
    try {
      const data = await tmdbRequest("/trending/movie/week");
      setTrendingMovies((data.results || []).slice(0, 8));
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading((previous) => ({ ...previous, trending: false }));
    }
  };

  const fetchRecommendations = async (genreId) => {
    if (!genreId) {
      setRecommendations([]);
      return;
    }

    setLoading((previous) => ({ ...previous, recommendations: true }));
    try {
      const data = await tmdbRequest("/discover/movie", {
        with_genres: String(genreId),
        sort_by: "vote_average.desc",
        "vote_count.gte": "180",
      });
      setRecommendations((data.results || []).slice(0, 8));
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading((previous) => ({ ...previous, recommendations: false }));
    }
  };

  const fetchPopularTrailers = async () => {
    setLoading((previous) => ({ ...previous, popularTrailers: true }));
    try {
      const popularPages = await Promise.all([
        tmdbRequest("/movie/popular", { page: "1" }),
        tmdbRequest("/movie/popular", { page: "2" }),
      ]);
      const candidates = popularPages.flatMap((page) => page.results || []).slice(0, 24);
      const trailerResults = [];

      for (const movie of candidates) {
        try {
          const videoData = await tmdbRequest(`/movie/${movie.id}/videos`);
          const trailer = pickTrailer(videoData.results || []);
          if (!trailer) {
            continue;
          }

          trailerResults.push({
            id: movie.id,
            title: movie.title,
            trailerKey: trailer.key,
            trailerName: trailer.name || `${movie.title} Trailer`,
          });

          if (trailerResults.length >= 12) {
            break;
          }
        } catch (_error) {
          continue;
        }
      }

      setPopularTrailers(trailerResults);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading((previous) => ({ ...previous, popularTrailers: false }));
    }
  };

  useEffect(() => {
    loadStoredPersonalization();
    fetchGenres();
    fetchPopularTrailers();
    fetchTrendingMovies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchRecommendations(personalizationSeed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personalizationSeed]);

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

    trailerScrollRef.current.scrollBy({
      left: direction === "left" ? -420 : 420,
      behavior: "smooth",
    });
  };

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

      <DashboardNav
        colors={colors}
        themeMode={themeMode}
        onToggleTheme={onToggleTheme}
        ThemeSwitch={ThemeSwitch}
        user={user}
        onLogout={handleSignOut}
      />

      <main className="relative z-10 mx-auto grid w-full max-w-7xl gap-7 px-4 pb-10 pt-6 md:px-8">
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
            background: `linear-gradient(120deg, ${colors.secondary}88, ${colors.background})`,
          }}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: colors.accent }}>
            Personalization Hub
          </p>
          <div className="mt-3 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h2 className="text-3xl font-bold md:text-5xl">Your movie intelligence center</h2>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed md:text-base" style={{ color: `${colors.text}c9` }}>
                Dashboard keeps recommendations separate from raw discovery so the project clearly demonstrates
                personalization, explanation, and system modularity.
              </p>
            </div>
            <button
              type="button"
              onClick={loadStoredPersonalization}
              className="rounded-full px-4 py-2 text-sm font-semibold"
              style={{
                backgroundColor: colors.secondary,
                color: colors.text,
                border: `1px solid ${colors.accent}`,
              }}
            >
              Sync Signals
            </button>
          </div>
        </section>

        <section
          className="yoko-fade-up min-w-0 overflow-hidden rounded-3xl p-4 md:p-5"
          style={{
            border: `1px solid ${colors.secondary}`,
            background: `linear-gradient(120deg, ${colors.background}, ${colors.secondary}55)`,
          }}
        >
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-bold md:text-2xl">Popular Movie Trailers</h3>
              <p className="mt-1 text-sm md:text-base" style={{ color: `${colors.text}bc` }}>
                Quick trailer previews keep the hub engaging without turning it into a search page.
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

          <div className="relative min-w-0">
            <button
              type="button"
              onClick={() => scrollTrailers("left")}
              aria-label="Scroll trailers left"
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-2xl px-3 py-2 shadow-lg"
              style={{ backgroundColor: colors.primary, color: "#ffffff" }}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scrollTrailers("right")}
              aria-label="Scroll trailers right"
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-2xl px-3 py-2 shadow-lg"
              style={{ backgroundColor: colors.primary, color: "#ffffff" }}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                <path d="m8.59 16.59 1.41 1.41 6-6-6-6-1.41 1.41L13.17 12z" />
              </svg>
            </button>

            <div
              ref={trailerScrollRef}
              className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 pr-10 pt-1"
              style={{ scrollbarWidth: "thin" }}
            >
              {(loading.popularTrailers ? new Array(10).fill(null) : popularTrailers).map((item, index) =>
                item ? (
                  <article
                    key={item.id}
                    className="yoko-fade-up w-[190px] shrink-0 snap-start overflow-hidden rounded-2xl"
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
                          <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: "#ff3b30" }}>
                            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" style={{ color: "#ffffff" }}>
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1 p-2.5">
                        <h4 className="truncate text-sm font-bold">{item.title}</h4>
                        <p className="truncate text-xs" style={{ color: `${colors.text}b5` }}>
                          {item.trailerName}
                        </p>
                      </div>
                    </a>
                  </article>
                ) : (
                  <div
                    key={`trailer-skeleton-${index}`}
                    className="yoko-shimmer aspect-video w-[190px] shrink-0 rounded-2xl"
                    style={{ backgroundColor: `${colors.secondary}` }}
                  />
                )
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-7 lg:grid-cols-12">
          <div
            className="yoko-fade-up rounded-3xl p-5 lg:col-span-7"
            style={{
              border: `1px solid ${colors.secondary}`,
              background: `linear-gradient(145deg, ${colors.background}, ${colors.secondary}7a)`,
            }}
          >
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xl font-bold md:text-2xl">Recommendations</h3>
                <p className="mt-1 text-sm" style={{ color: `${colors.text}ba` }}>
                  Transparent suggestions generated from saved history and favorites.
                </p>
              </div>
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

            <div className="mb-4 flex flex-wrap gap-2">
              {[
                `Because you watched ${explanationMovie}`,
                `${watchHistory.length} history signal${watchHistory.length === 1 ? "" : "s"}`,
                `${favorites.length} favorite signal${favorites.length === 1 ? "" : "s"}`,
              ].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ backgroundColor: `${colors.secondary}c9`, color: colors.text }}
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {(loading.recommendations ? new Array(8).fill(null) : recommendations).map((movie, index) =>
                movie ? (
                  <MovieCard
                    key={`rec-${movie.id}`}
                    movie={movie}
                    colors={colors}
                    index={index}
                    onSelect={(selectedMovie) => navigate(`/movies/${selectedMovie.id}`)}
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
            <div className="grid grid-cols-2 gap-4">
              {(loading.trending ? new Array(8).fill(null) : trendingMovies).map((movie, index) =>
                movie ? (
                  <MovieCard
                    key={`trend-${movie.id}`}
                    movie={movie}
                    colors={colors}
                    index={index}
                    onSelect={(selectedMovie) => navigate(`/movies/${selectedMovie.id}`)}
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
              src={`${process.env.PUBLIC_URL}/tmdb-logo.svg`}
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
