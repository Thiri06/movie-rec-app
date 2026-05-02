import React, { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import DashboardNav from "../components/DashboardNav";
import MovieCard from "../components/MovieCard";
import { auth } from "../firebase";
import {
  getFavoriteMovies,
  normalizeSavedMovieRecord,
  removeFavoriteMovie,
} from "../utils/apiClient";

const FavoritesPage = ({ colors, themeMode, onToggleTheme, ThemeSwitch, user }) => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const loadFavorites = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const data = await getFavoriteMovies();
      setFavorites(data || []);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      setErrorMessage(error.message || "Logout failed.");
    }
  };

  const openDetails = (movie) => {
    navigate(`/movies/${movie.id}`);
  };

  const removeFavorite = async (record) => {
    const movie = normalizeSavedMovieRecord(record);
    if (!movie) {
      return;
    }

    try {
      await removeFavoriteMovie(movie.id);
      setFavorites((current) => current.filter((item) => item._id !== record._id));
      setStatusMessage(`Removed "${movie.title}" from Favourites.`);
    } catch (error) {
      setErrorMessage(error.message);
    }
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
          className="yoko-fade-up rounded-3xl p-5 md:p-6"
          style={{
            border: `1px solid ${colors.secondary}`,
            background: `linear-gradient(120deg, ${colors.secondary}88, ${colors.background})`,
          }}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: colors.accent }}>
            Explicit Preferences
          </p>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-3xl font-bold md:text-5xl">Favourites</h2>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed md:text-base" style={{ color: `${colors.text}c9` }}>
                Favourites are intentional user preferences. YOKO uses them as stronger signals than passive detail
                views when building recommendations.
              </p>
            </div>
            <button
              type="button"
              onClick={loadFavorites}
              className="rounded-full px-4 py-2 text-sm font-semibold"
              style={{
                backgroundColor: colors.secondary,
                color: colors.text,
                border: `1px solid ${colors.accent}`,
              }}
            >
              Refresh
            </button>
          </div>
        </section>

        <section
          className="rounded-3xl p-5"
          style={{
            border: `1px solid ${colors.secondary}`,
            backgroundColor: `${colors.background}f2`,
          }}
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <h3 className="text-xl font-bold md:text-2xl">Saved Movies</h3>
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{ backgroundColor: `${colors.secondary}c9`, color: colors.text }}
            >
              {favorites.length} item{favorites.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {(isLoading ? new Array(10).fill(null) : favorites).map((item, index) => {
              if (!item) {
                return (
                  <div
                    key={`favorite-skeleton-${index}`}
                    className="yoko-shimmer h-64 rounded-2xl"
                    style={{ backgroundColor: `${colors.secondary}` }}
                  />
                );
              }

              const movie = normalizeSavedMovieRecord(item);
              if (!movie) {
                return null;
              }

              return (
                <MovieCard
                  key={item._id || `${movie.id}-${index}`}
                  movie={movie}
                  colors={colors}
                  index={index}
                  onSelect={openDetails}
                  actions={
                    <button
                      type="button"
                      onClick={() => removeFavorite(item)}
                      className="rounded-xl px-2 py-2 text-xs font-semibold sm:col-span-2"
                      style={{
                        backgroundColor: `${colors.secondary}c9`,
                        color: colors.text,
                        border: `1px solid ${colors.accent}`,
                      }}
                    >
                      Remove
                    </button>
                  }
                />
              );
            })}
          </div>

          {!isLoading && favorites.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm" style={{ color: `${colors.text}b8` }}>
                No favourites yet. Save movies from Discover or a Movie Details page.
              </p>
              <Link
                to="/discover"
                className="mt-4 inline-flex rounded-full px-5 py-3 text-sm font-semibold"
                style={{ backgroundColor: colors.primary, color: "#ffffff" }}
              >
                Find Movies
              </Link>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
};

export default FavoritesPage;
