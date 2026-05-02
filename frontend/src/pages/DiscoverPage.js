import React, { useEffect, useMemo, useState } from "react";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import DashboardNav from "../components/DashboardNav";
import MovieCard from "../components/MovieCard";
import { auth } from "../firebase";
import {
  FAVORITES_KEY,
  addStoredMovie,
  createTmdbRequest,
} from "../utils/movieApi";

const DiscoverPage = ({ colors, themeMode, onToggleTheme, ThemeSwitch, user }) => {
  const navigate = useNavigate();
  const [genres, setGenres] = useState([]);
  const [activeGenreId, setActiveGenreId] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [minimumRating, setMinimumRating] = useState("0");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [discoverResults, setDiscoverResults] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState({
    genres: false,
    search: false,
    discover: false,
  });

  const tmdbRequest = useMemo(
    () => createTmdbRequest(process.env.REACT_APP_TMDB_API_KEY),
    []
  );

  const yearOptions = useMemo(() => {
    const now = new Date().getFullYear();
    return ["all", ...Array.from({ length: 40 }, (_, index) => String(now - index))];
  }, []);

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

  const fetchDiscoverResults = async () => {
    setLoading((previous) => ({ ...previous, discover: true }));
    try {
      const params = {
        sort_by: "popularity.desc",
        "vote_average.gte": minimumRating,
        "vote_count.gte": "40",
      };

      if (activeGenreId !== "all") {
        params.with_genres = String(activeGenreId);
      }

      if (selectedYear !== "all") {
        params.primary_release_year = selectedYear;
      }

      const data = await tmdbRequest("/discover/movie", params);
      setDiscoverResults((data.results || []).slice(0, 20));
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading((previous) => ({ ...previous, discover: false }));
    }
  };

  useEffect(() => {
    fetchGenres();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchDiscoverResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGenreId, selectedYear, minimumRating]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timerId = setTimeout(async () => {
      setLoading((previous) => ({ ...previous, search: true }));
      try {
        const data = await tmdbRequest("/search/multi", {
          query: searchQuery,
          include_adult: "false",
          ...(selectedYear === "all" ? {} : { primary_release_year: selectedYear }),
        });
        const moviesOnly = (data.results || [])
          .filter((item) => item.media_type === "movie" || item.title)
          .filter((movie) => Number(movie.vote_average || 0) >= Number(minimumRating))
          .slice(0, 12);
        setSearchResults(moviesOnly);
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setLoading((previous) => ({ ...previous, search: false }));
      }
    }, 450);

    return () => clearTimeout(timerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedYear, minimumRating]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      setErrorMessage(error.message || "Logout failed.");
    }
  };

  const viewDetails = (movie) => {
    navigate(`/movies/${movie.id}`);
  };

  const saveToFavorites = (movie) => {
    addStoredMovie(FAVORITES_KEY, movie);
    setStatusMessage(`Added "${movie.title}" to Favourites.`);
  };

  const renderMovieActions = (movie) => (
    <>
      <button
        type="button"
        onClick={() => viewDetails(movie)}
        className="rounded-xl px-2 py-2 text-xs font-semibold"
        style={{
          backgroundColor: colors.primary,
          color: "#ffffff",
        }}
      >
        View Details
      </button>
      <button
        type="button"
        onClick={() => saveToFavorites(movie)}
        className="rounded-xl px-2 py-2 text-xs font-semibold"
        style={{
          backgroundColor: colors.secondary,
          color: colors.text,
          border: `1px solid ${colors.accent}`,
        }}
      >
        Favourite
      </button>
    </>
  );

  const visibleResults = searchQuery.trim() ? searchResults : discoverResults;
  const isLoadingResults = searchQuery.trim() ? loading.search : loading.discover;

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: colors.background,
        color: colors.text,
        fontFamily: "Andika, sans-serif",
      }}
    >
      <DashboardNav
        colors={colors}
        themeMode={themeMode}
        onToggleTheme={onToggleTheme}
        ThemeSwitch={ThemeSwitch}
        user={user}
        onLogout={handleSignOut}
      />

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

        {statusMessage ? (
          <div
            className="rounded-2xl px-4 py-3 text-sm font-semibold"
            style={{
              border: `1px solid ${colors.primary}`,
              backgroundColor: `${colors.primary}1f`,
              color: colors.text,
            }}
          >
            {statusMessage}
          </div>
        ) : null}

        <section
          className="yoko-fade-up rounded-3xl p-5 md:p-6"
          style={{
            border: `1px solid ${colors.secondary}`,
            background: `linear-gradient(120deg, ${colors.secondary}90, ${colors.background})`,
          }}
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: colors.accent }}>
                Search & Exploration Hub
              </p>
              <h2 className="mt-2 text-2xl font-bold md:text-4xl">Discover movies instantly</h2>
              <p className="mt-2 max-w-2xl text-sm md:text-base" style={{ color: `${colors.text}c4` }}>
                Use TMDb search and filters here. Viewing details records interaction signals in the background.
              </p>
            </div>
            <div className="w-full lg:max-w-xl">
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
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
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

            <select
              value={activeGenreId}
              onChange={(event) => setActiveGenreId(event.target.value)}
              className="w-full rounded-2xl px-3 py-3 text-sm font-semibold outline-none md:text-base"
              style={{
                backgroundColor: colors.background,
                color: colors.text,
                border: `1px solid ${colors.accent}`,
              }}
            >
              <option value="all">All Genres</option>
              {genres.map((genre) => (
                <option key={genre.id} value={genre.id}>
                  {genre.name}
                </option>
              ))}
            </select>

            <select
              value={minimumRating}
              onChange={(event) => setMinimumRating(event.target.value)}
              className="w-full rounded-2xl px-3 py-3 text-sm font-semibold outline-none md:text-base"
              style={{
                backgroundColor: colors.background,
                color: colors.text,
                border: `1px solid ${colors.accent}`,
              }}
            >
              <option value="0">Any Rating</option>
              <option value="6">6.0+ Rating</option>
              <option value="7">7.0+ Rating</option>
              <option value="8">8.0+ Rating</option>
            </select>
          </div>
        </section>

        <section
          className="yoko-fade-up rounded-3xl p-5"
          style={{
            border: `1px solid ${colors.secondary}`,
            backgroundColor: `${colors.background}f2`,
          }}
        >
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-bold md:text-2xl">Main Discovery Area</h3>
              <p className="mt-1 text-sm" style={{ color: `${colors.text}ba` }}>
                {searchQuery.trim()
                  ? "Live search results from TMDb."
                  : "Filtered exploration results from TMDb discover/movie."}
              </p>
            </div>
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{ backgroundColor: `${colors.secondary}c9`, color: colors.text }}
            >
              {visibleResults.length} result{visibleResults.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            {(loading.genres ? [] : genres).map((genre) => {
              const active = String(genre.id) === String(activeGenreId);
              return (
                <button
                  key={genre.id}
                  type="button"
                  onClick={() => setActiveGenreId(active ? "all" : String(genre.id))}
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

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {(isLoadingResults ? new Array(20).fill(null) : visibleResults).map((movie, index) =>
              movie ? (
                <MovieCard
                  key={`${searchQuery.trim() ? "search" : "discover"}-${movie.id}`}
                  movie={movie}
                  colors={colors}
                  index={index}
                  onSelect={viewDetails}
                  actions={renderMovieActions(movie)}
                />
              ) : (
                <div
                  key={`discover-skeleton-${index}`}
                  className="yoko-shimmer h-56 rounded-2xl"
                  style={{ backgroundColor: `${colors.secondary}` }}
                />
              )
            )}
          </div>

          {!isLoadingResults && visibleResults.length === 0 ? (
            <p className="mt-4 text-sm" style={{ color: `${colors.text}b3` }}>
              No matching results found. Try changing your search or filters.
            </p>
          ) : null}
        </section>
      </main>
    </div>
  );
};

export default DiscoverPage;
