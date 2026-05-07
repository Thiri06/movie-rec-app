import React, { useEffect, useMemo, useState } from "react";
import { signOut } from "firebase/auth";
import { Link, useNavigate, useParams } from "react-router-dom";
import DashboardNav from "../components/DashboardNav";
import { auth } from "../firebase";
import { addFavoriteMovie, markMovieWatched, recordMovieDetailView } from "../utils/apiClient";
import {
  FAVORITES_KEY,
  WATCH_HISTORY_KEY,
  addStoredMovie,
  createTmdbRequest,
  formatRating,
  getPosterUrl,
  pickTrailer,
} from "../utils/movieApi";

const MovieDetailsPage = ({ colors, themeMode, onToggleTheme, ThemeSwitch, user }) => {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [trailer, setTrailer] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingWatched, setIsMarkingWatched] = useState(false);

  const tmdbRequest = useMemo(
    () => createTmdbRequest(process.env.REACT_APP_TMDB_API_KEY),
    []
  );

  useEffect(() => {
    const fetchMovieDetails = async () => {
      setIsLoading(true);
      try {
        const data = await tmdbRequest(`/movie/${movieId}`, {
          append_to_response: "videos",
        });
        setMovie(data);
        setTrailer(pickTrailer(data.videos?.results || []));
        addStoredMovie(WATCH_HISTORY_KEY, data);
        recordMovieDetailView(movieId, "details").catch((interactionError) => {
          console.error("Backend watch history recording failed:", interactionError);
        });
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovieDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieId]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      setErrorMessage(error.message || "Logout failed.");
    }
  };

  const saveToFavorites = async () => {
    if (!movie) {
      return;
    }

    addStoredMovie(FAVORITES_KEY, movie);
    try {
      await addFavoriteMovie(movie.id, "details");
      setStatusMessage(`Added "${movie.title}" to Favourites.`);
    } catch (error) {
      setStatusMessage(`Saved "${movie.title}" locally. Backend favourite failed: ${error.message}`);
    }
  };

  const markWatched = async () => {
    if (!movie) {
      return;
    }

    setIsMarkingWatched(true);
    try {
      await markMovieWatched(movie.id, "details");
      setStatusMessage(`Marked "${movie.title}" as watched.`);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsMarkingWatched(false);
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

      <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 pb-10 pt-6 md:px-8">
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

        {isLoading ? (
          <div className="yoko-shimmer h-[520px] rounded-3xl" style={{ backgroundColor: colors.secondary }} />
        ) : movie ? (
          <section
            className="grid gap-6 rounded-3xl p-5 md:grid-cols-[300px_1fr] md:p-7"
            style={{
              border: `1px solid ${colors.secondary}`,
              background: `linear-gradient(145deg, ${colors.background}, ${colors.secondary}66)`,
            }}
          >
            <img
              src={getPosterUrl(movie.poster_path)}
              alt={movie.title}
              className="w-full rounded-2xl object-cover shadow-xl"
              loading="lazy"
            />

            <div className="flex flex-col justify-between gap-6">
              <div>
                <Link
                  to="/discover"
                  className="text-sm font-semibold underline decoration-2 underline-offset-4"
                  style={{ color: colors.accent }}
                >
                  Back to Discover
                </Link>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <span
                    className="rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ backgroundColor: `${colors.primary}1f`, color: colors.primary }}
                  >
                    Watch history recorded
                  </span>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ backgroundColor: `${colors.secondary}c9`, color: colors.text }}
                  >
                    Rating {formatRating(movie.vote_average)}
                  </span>
                  {movie.release_date ? (
                    <span
                      className="rounded-full px-3 py-1 text-xs font-semibold"
                      style={{ backgroundColor: `${colors.secondary}c9`, color: colors.text }}
                    >
                      {movie.release_date.slice(0, 4)}
                    </span>
                  ) : null}
                </div>

                <h2 className="mt-4 text-3xl font-bold md:text-5xl">{movie.title}</h2>
                <p className="mt-4 max-w-3xl text-sm leading-relaxed md:text-base" style={{ color: `${colors.text}c9` }}>
                  {movie.overview || "No overview available."}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {(movie.genres || []).map((genre) => (
                    <span
                      key={genre.id}
                      className="rounded-full px-3 py-1 text-xs font-semibold"
                      style={{ backgroundColor: `${colors.secondary}c9`, color: colors.text }}
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {trailer ? (
                  <a
                    href={`https://www.youtube.com/watch?v=${trailer.key}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full px-5 py-3 text-sm font-semibold"
                    style={{ backgroundColor: colors.primary, color: "#ffffff" }}
                  >
                    Watch Trailer
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={saveToFavorites}
                  className="rounded-full px-5 py-3 text-sm font-semibold"
                  style={{
                    backgroundColor: colors.secondary,
                    color: colors.text,
                    border: `1px solid ${colors.accent}`,
                  }}
                >
                  Favourite
                </button>
                <button
                  type="button"
                  onClick={markWatched}
                  disabled={isMarkingWatched}
                  className="rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
                  style={{
                    backgroundColor: colors.secondary,
                    color: colors.text,
                    border: `1px solid ${colors.accent}`,
                  }}
                >
                  {isMarkingWatched ? "Marking..." : "Mark as Watched"}
                </button>
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
};

export default MovieDetailsPage;
