import React, { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import DashboardNav from "../components/DashboardNav";
import MovieCard from "../components/MovieCard";
import TmdbCreditFooter from "../components/TmdbCreditFooter";
import { auth } from "../firebase";
import { getWatchHistory, normalizeSavedMovieRecord } from "../utils/apiClient";

const WatchHistoryPage = ({ colors, themeMode, onToggleTheme, ThemeSwitch, user }) => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadHistory = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const data = await getWatchHistory();
      setHistory(data || []);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
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

        <section
          className="yoko-fade-up rounded-3xl p-5 md:p-6"
          style={{
            border: `1px solid ${colors.secondary}`,
            background: `linear-gradient(120deg, ${colors.secondary}88, ${colors.background})`,
          }}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: colors.accent }}>
            Behaviour Signals
          </p>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-3xl font-bold md:text-5xl">Watch History</h2>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed md:text-base" style={{ color: `${colors.text}c9` }}>
                Movies appear here automatically when you view their details. These records become the behavioural
                foundation for YOKO recommendations.
              </p>
            </div>
            <button
              type="button"
              onClick={loadHistory}
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
            <h3 className="text-xl font-bold md:text-2xl">Recently Viewed</h3>
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{ backgroundColor: `${colors.secondary}c9`, color: colors.text }}
            >
              {history.length} item{history.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {(isLoading ? new Array(10).fill(null) : history).map((item, index) => {
              if (!item) {
                return (
                  <div
                    key={`history-skeleton-${index}`}
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
                <div key={item._id || `${movie.id}-${index}`} className="space-y-2">
                  <MovieCard movie={movie} colors={colors} index={index} onSelect={openDetails} />
                  <p className="px-1 text-xs" style={{ color: `${colors.text}9c` }}>
                    Viewed {item.watchedAt ? new Date(item.watchedAt).toLocaleString() : "recently"}
                  </p>
                </div>
              );
            })}
          </div>

          {!isLoading && history.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm" style={{ color: `${colors.text}b8` }}>
                No watch history yet. View a movie detail page to start collecting signals.
              </p>
              <Link
                to="/discover"
                className="mt-4 inline-flex rounded-full px-5 py-3 text-sm font-semibold"
                style={{ backgroundColor: colors.primary, color: "#ffffff" }}
              >
                Explore Movies
              </Link>
            </div>
          ) : null}
        </section>
      </main>

      <TmdbCreditFooter colors={colors} />
    </div>
  );
};

export default WatchHistoryPage;
