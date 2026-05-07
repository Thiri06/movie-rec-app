import React, { useEffect, useMemo, useState } from "react";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import DashboardNav from "../components/DashboardNav";
import MovieCard from "../components/MovieCard";
import { auth } from "../firebase";
import { addFavoriteMovie, getCurrentUserProfile } from "../utils/apiClient";
import {
  createTmdbRequest,
  getContentLimitLabel,
  getMaxCertificationForProfile,
  getMovieUsCertification,
  isCertificationAllowed,
  isUnderageProfile,
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
  const [searchPage, setSearchPage] = useState(1);
  const [discoverPage, setDiscoverPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(1);
  const [discoverTotalPages, setDiscoverTotalPages] = useState(1);
  const [profile, setProfile] = useState(null);
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
  const isUnderage = isUnderageProfile(profile);
  const shouldUseFamilyFilter = isUnderage || profile?.preferences?.maturityLimit === "pg13";
  const contentLimitLabel = getContentLimitLabel(profile);
  const maxCertification = getMaxCertificationForProfile(profile);

  const filterMoviesForProfile = async (movies) => {
    const baseFiltered = (movies || [])
      .filter((movie) => !movie.adult)
      .filter((movie) => Number(movie.vote_average || 0) >= Number(minimumRating));

    if (!maxCertification) {
      return baseFiltered;
    }

    const checkedMovies = await Promise.all(
      baseFiltered.map(async (movie) => {
        try {
          const details = await tmdbRequest(`/movie/${movie.id}`, {
            append_to_response: "release_dates",
          });
          const certification = getMovieUsCertification(details.release_dates);
          return isCertificationAllowed(certification, maxCertification) ? movie : null;
        } catch (_error) {
          return null;
        }
      })
    );

    return checkedMovies.filter(Boolean);
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

  const getVisiblePageNumbers = (currentPage, totalPages) => {
    const safeTotal = Math.max(1, Math.min(totalPages || 1, 500));
    const start = Math.max(1, Math.min(currentPage - 1, safeTotal - 2));

    return Array.from({ length: Math.min(3, safeTotal) }, (_, index) => start + index);
  };

  const fetchDiscoverResults = async () => {
    setLoading((previous) => ({ ...previous, discover: true }));
    try {
      const params = {
        sort_by: "popularity.desc",
        include_adult: "false",
        "vote_average.gte": minimumRating,
        "vote_count.gte": "40",
        page: String(discoverPage),
      };

      if (shouldUseFamilyFilter) {
        params.certification_country = "US";
        params["certification.lte"] = maxCertification || "PG-13";
      }

      if (activeGenreId !== "all") {
        params.with_genres = String(activeGenreId);
      }

      if (selectedYear !== "all") {
        params.primary_release_year = selectedYear;
      }

      const data = await tmdbRequest("/discover/movie", params);
      setDiscoverResults(await filterMoviesForProfile(data.results || []));
      setDiscoverTotalPages(Math.max(1, Math.min(data.total_pages || 1, 500)));
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading((previous) => ({ ...previous, discover: false }));
    }
  };

  useEffect(() => {
    fetchGenres();
    getCurrentUserProfile()
      .then(setProfile)
      .catch((error) => {
        console.error("Profile safety settings failed:", error);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchDiscoverResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGenreId, selectedYear, minimumRating, discoverPage, shouldUseFamilyFilter, maxCertification]);

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
          page: String(searchPage),
          ...(selectedYear === "all" ? {} : { primary_release_year: selectedYear }),
        });
        const moviesOnly = await filterMoviesForProfile(data.results || []);
        setSearchResults(moviesOnly);
        setSearchTotalPages(Math.max(1, Math.min(data.total_pages || 1, 500)));
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setLoading((previous) => ({ ...previous, search: false }));
      }
    }, 450);

    return () => clearTimeout(timerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedYear, minimumRating, searchPage, maxCertification]);

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

  const updateSearchQuery = (value) => {
    setSearchQuery(value);
    setSearchPage(1);
  };

  const updateSelectedYear = (value) => {
    setSelectedYear(value);
    setSearchPage(1);
    setDiscoverPage(1);
  };

  const updateActiveGenreId = (value) => {
    setActiveGenreId(value);
    setDiscoverPage(1);
  };

  const updateMinimumRating = (value) => {
    setMinimumRating(value);
    setSearchPage(1);
    setDiscoverPage(1);
  };

  const saveToFavorites = async (movie) => {
    try {
      await addFavoriteMovie(movie.id, "discover");
      setStatusMessage(`Added "${movie.title}" to Favourites.`);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.message);
    }
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
  const currentPage = searchQuery.trim() ? searchPage : discoverPage;
  const totalPages = searchQuery.trim() ? searchTotalPages : discoverTotalPages;
  const pageNumbers = getVisiblePageNumbers(currentPage, totalPages);

  const goToPage = (page) => {
    if (searchQuery.trim()) {
      setSearchPage(page);
    } else {
      setDiscoverPage(page);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
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
          className="yoko-fade-up relative rounded-3xl p-5 pt-16 md:p-6 md:pt-16 lg:pt-6"
          style={{
            border: `1px solid ${colors.secondary}`,
            background: `linear-gradient(120deg, ${colors.secondary}90, ${colors.background})`,
          }}
        >
          <span
            className="absolute right-5 top-5 rounded-full px-3 py-1.5 text-xs font-semibold md:right-6 md:top-6"
            style={{
              backgroundColor: shouldUseFamilyFilter ? `${colors.primary}22` : `${colors.secondary}c9`,
              color: shouldUseFamilyFilter ? colors.primary : colors.text,
              border: `1px solid ${shouldUseFamilyFilter ? colors.primary : colors.accent}`,
            }}
          >
            Content: {contentLimitLabel}
          </span>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)] lg:items-end">
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: colors.accent }}>
                Search & Exploration Hub
              </p>
              <h2 className="mt-2 text-2xl font-bold md:text-4xl">Discover movies instantly</h2>
              <p className="mt-2 max-w-2xl text-sm md:text-base" style={{ color: `${colors.text}c4` }}>
                Use TMDb search and filters here. Viewing details records interaction signals in the background.
              </p>
            </div>
            <div className="w-full">
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => updateSearchQuery(event.target.value)}
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
              onChange={(event) => updateSelectedYear(event.target.value)}
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
              onChange={(event) => updateActiveGenreId(event.target.value)}
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
              onChange={(event) => updateMinimumRating(event.target.value)}
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
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            {(loading.genres ? [] : genres).map((genre) => {
              const active = String(genre.id) === String(activeGenreId);
              return (
                <button
                  key={genre.id}
                  type="button"
                  onClick={() => updateActiveGenreId(active ? "all" : String(genre.id))}
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

          {!isLoadingResults && visibleResults.length > 0 ? (
            <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => goToPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="rounded-full px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  backgroundColor: colors.secondary,
                  color: colors.text,
                  border: `1px solid ${colors.accent}`,
                }}
              >
                Previous
              </button>
              {pageNumbers.map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => goToPage(page)}
                  className="h-10 w-10 rounded-full text-sm font-bold"
                  style={{
                    backgroundColor: page === currentPage ? colors.primary : colors.secondary,
                    color: page === currentPage ? "#ffffff" : colors.text,
                    border: `1px solid ${colors.accent}`,
                  }}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
                className="rounded-full px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  backgroundColor: colors.secondary,
                  color: colors.text,
                  border: `1px solid ${colors.accent}`,
                }}
              >
                Next
              </button>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
};

export default DiscoverPage;
