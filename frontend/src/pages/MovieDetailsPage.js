import React, { useEffect, useMemo, useState } from "react";
import { signOut } from "firebase/auth";
import { Link, useNavigate, useParams } from "react-router-dom";
import DashboardNav from "../components/DashboardNav";
import MovieCard from "../components/MovieCard";
import TmdbCreditFooter from "../components/TmdbCreditFooter";
import { auth } from "../firebase";
import { addFavoriteMovie, getMovieDetails, markMovieWatched, recordMovieDetailView } from "../utils/apiClient";
import {
  FAVORITES_KEY,
  WATCH_HISTORY_KEY,
  addStoredMovie,
  formatRating,
  getBackdropUrl,
  getPosterUrl,
  getPreferredWatchRegion,
  getProviderLogoUrl,
  getProfileUrl,
  pickTrailer,
} from "../utils/movieApi";

const formatCurrency = (value) => {
  if (!value) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
};

const formatRuntime = (minutes) => {
  if (!minutes) {
    return "N/A";
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
};

const formatDate = (dateValue) => {
  if (!dateValue) {
    return "N/A";
  }

  return new Date(dateValue).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getCertification = (releaseDates) => {
  const countryRelease =
    releaseDates?.results?.find((item) => item.iso_3166_1 === "US") ||
    releaseDates?.results?.find((item) => item.release_dates?.some((release) => release.certification));

  return countryRelease?.release_dates?.find((release) => release.certification)?.certification || "Not rated";
};

const getCrewByJobs = (crew = [], jobs = []) =>
  crew
    .filter((person) => jobs.includes(person.job))
    .map((person) => person.name)
    .filter(Boolean)
    .filter((name, index, list) => list.indexOf(name) === index)
    .slice(0, 3);

const DetailStat = ({ label, value, colors }) => (
  <div
    className="rounded-2xl p-4"
    style={{
      backgroundColor: `${colors.background}d9`,
      border: `1px solid ${colors.text}12`,
    }}
  >
    <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: `${colors.text}8f` }}>
      {label}
    </p>
    <p className="mt-2 text-sm font-bold md:text-base">{value}</p>
  </div>
);

const SectionShell = ({ title, action, colors, children }) => (
  <section
    className="rounded-3xl p-5 md:p-6"
    style={{
      backgroundColor: `${colors.background}f2`,
      border: `1px solid ${colors.secondary}`,
    }}
  >
    <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <h3 className="text-xl font-bold md:text-2xl">{title}</h3>
      {action}
    </div>
    {children}
  </section>
);

const WatchProviderGroup = ({ title, providers = [], colors }) => {
  if (!providers.length) {
    return null;
  }

  return (
    <div>
      <h4 className="text-sm font-bold uppercase tracking-[0.14em]" style={{ color: `${colors.text}99` }}>
        {title}
      </h4>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {providers.map((provider) => {
          const logoUrl = getProviderLogoUrl(provider.logo_path);

          return (
            <div
              key={`${title}-${provider.provider_id}`}
              className="flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-2xl p-3 text-center"
              style={{
                backgroundColor: `${colors.background}d9`,
                border: `1px solid ${colors.text}12`,
              }}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={provider.provider_name}
                  className="h-10 w-10 rounded-xl object-cover"
                  loading="lazy"
                />
              ) : (
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold"
                  style={{ backgroundColor: colors.secondary, color: colors.text }}
                >
                  {provider.provider_name?.slice(0, 1) || "?"}
                </div>
              )}
              <p className="text-xs font-semibold leading-tight">{provider.provider_name}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MovieDetailsPage = ({ colors, themeMode, onToggleTheme, ThemeSwitch, user }) => {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [aiInsight, setAiInsight] = useState(null);
  const [aiInsightConfigured, setAiInsightConfigured] = useState(false);
  const [aiInsightError, setAiInsightError] = useState("");
  const [trailer, setTrailer] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingWatched, setIsMarkingWatched] = useState(false);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const data = await getMovieDetails(movieId);
        setMovie(data.tmdb);
        setAiInsight(data.aiInsight || null);
        setAiInsightConfigured(Boolean(data.aiInsightConfigured));
        setAiInsightError(data.aiInsightError || "");
        setTrailer(pickTrailer(data.tmdb?.videos?.results || []));
        addStoredMovie(WATCH_HISTORY_KEY, data.tmdb);
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
  }, [movieId]);

  const directors = useMemo(() => getCrewByJobs(movie?.credits?.crew, ["Director"]), [movie]);
  const writers = useMemo(
    () => getCrewByJobs(movie?.credits?.crew, ["Writer", "Screenplay", "Story"]),
    [movie]
  );
  const producers = useMemo(
    () => getCrewByJobs(movie?.credits?.crew, ["Producer", "Executive Producer"]),
    [movie]
  );
  const cast = (movie?.credits?.cast || []).slice(0, 10);
  const recommendations = (movie?.recommendations?.results || []).slice(0, 8);
  const similarMovies = (movie?.similar?.results || []).slice(0, 8);
  const backdropUrl = getBackdropUrl(movie?.backdrop_path);
  const certification = getCertification(movie?.release_dates);
  const languageNames = (movie?.spoken_languages || []).map((language) => language.english_name).filter(Boolean);
  const countryNames = (movie?.production_countries || []).map((country) => country.name).filter(Boolean);
  const companyNames = (movie?.production_companies || []).map((company) => company.name).filter(Boolean).slice(0, 4);
  const preferredWatchRegion = useMemo(() => getPreferredWatchRegion(), []);
  const watchProviderResults = movie?.watchProviders?.results || {};
  const watchRegion = watchProviderResults[preferredWatchRegion]
    ? preferredWatchRegion
    : watchProviderResults.US
      ? "US"
      : Object.keys(watchProviderResults)[0] || preferredWatchRegion;
  const watchProviderData = watchProviderResults[watchRegion];
  const watchProviderGroups = [
    { title: "Free", providers: watchProviderData?.free || [] },
    { title: "Free with Ads", providers: watchProviderData?.ads || [] },
    { title: "Subscription", providers: watchProviderData?.flatrate || [] },
    { title: "Rent", providers: watchProviderData?.rent || [] },
    { title: "Buy", providers: watchProviderData?.buy || [] },
  ].filter((group) => group.providers.length > 0);

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
      setErrorMessage("");
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

  const openDetails = (selectedMovie) => {
    navigate(`/movies/${selectedMovie.id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderMovieRail = (items, emptyText) => {
    if (items.length === 0) {
      return <p className="text-sm" style={{ color: `${colors.text}b8` }}>{emptyText}</p>;
    }

    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
        {items.map((item, index) => (
          <MovieCard
            key={item.id}
            movie={item}
            colors={colors}
            index={index}
            onSelect={openDetails}
          />
        ))}
      </div>
    );
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

        {isLoading ? (
          <div className="yoko-shimmer h-[620px] rounded-3xl" style={{ backgroundColor: colors.secondary }} />
        ) : movie ? (
          <>
            <section
              className="relative overflow-hidden rounded-3xl"
              style={{
                border: `1px solid ${colors.secondary}`,
                backgroundColor: `${colors.background}f2`,
              }}
            >
              {backdropUrl ? (
                <div
                  className="absolute inset-0 opacity-45"
                  style={{
                    backgroundImage: `linear-gradient(90deg, ${colors.background} 0%, ${colors.background}d9 38%, ${colors.background}9f 100%), linear-gradient(0deg, ${colors.background} 0%, transparent 55%), url(${backdropUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              ) : null}

              <div className="relative grid gap-7 p-5 md:grid-cols-[280px_1fr] md:p-7 lg:grid-cols-[330px_1fr]">
                <img
                  src={getPosterUrl(movie.poster_path)}
                  alt={movie.title}
                  className="w-full rounded-2xl object-cover shadow-xl"
                  loading="lazy"
                />

                <div className="flex flex-col justify-between gap-7">
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
                        style={{ backgroundColor: `${colors.secondary}d9`, color: colors.text }}
                      >
                        Rating {formatRating(movie.vote_average)}
                      </span>
                      <span
                        className="rounded-full px-3 py-1 text-xs font-semibold"
                        style={{ backgroundColor: `${colors.secondary}d9`, color: colors.text }}
                      >
                        {certification}
                      </span>
                      {movie.release_date ? (
                        <span
                          className="rounded-full px-3 py-1 text-xs font-semibold"
                          style={{ backgroundColor: `${colors.secondary}d9`, color: colors.text }}
                        >
                          {movie.release_date.slice(0, 4)}
                        </span>
                      ) : null}
                    </div>

                    <h2 className="mt-4 text-4xl font-bold md:text-6xl">{movie.title}</h2>
                    {movie.tagline ? (
                      <p className="mt-3 text-lg font-semibold italic" style={{ color: `${colors.text}bd` }}>
                        {movie.tagline}
                      </p>
                    ) : null}
                    <p className="mt-4 max-w-4xl text-sm leading-relaxed md:text-base" style={{ color: `${colors.text}d6` }}>
                      {movie.overview || "No overview available."}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {(movie.genres || []).map((genre) => (
                        <span
                          key={genre.id}
                          className="rounded-full px-3 py-1 text-xs font-semibold"
                          style={{ backgroundColor: `${colors.secondary}d9`, color: colors.text }}
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
              </div>
            </section>

            <section className="grid gap-7 lg:grid-cols-12">
              <div className="grid gap-7 lg:col-span-8">
                <SectionShell
                  title="Why Watch"
                  colors={colors}
                  action={
                    <span
                      className="w-fit rounded-full px-3 py-1 text-xs font-semibold"
                      style={{
                        backgroundColor: aiInsight ? `${colors.primary}22` : `${colors.secondary}c9`,
                        color: aiInsight ? colors.primary : `${colors.text}b8`,
                      }}
                    >
                      {aiInsight ? "Generated" : aiInsightConfigured ? "Unavailable" : "API key needed"}
                    </span>
                  }
                >
                  {aiInsight ? (
                    <div className="grid gap-4">
                      <p className="text-sm font-semibold leading-relaxed md:text-base" style={{ color: `${colors.text}e0` }}>
                        {aiInsight.summary}
                      </p>

                      {aiInsight.reasons?.length > 0 ? (
                        <div className="grid gap-3 md:grid-cols-3">
                          {aiInsight.reasons.map((reason, index) => (
                            <div
                              key={reason}
                              className="rounded-2xl p-4"
                              style={{
                                backgroundColor: `${colors.secondary}66`,
                                border: `1px solid ${colors.text}12`,
                              }}
                            >
                              <p className="text-xs font-bold uppercase" style={{ color: colors.primary }}>
                                Reason {index + 1}
                              </p>
                              <p className="mt-2 text-sm leading-relaxed" style={{ color: `${colors.text}d0` }}>
                                {reason}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {aiInsight.bestFor ? (
                        <p className="text-sm font-semibold leading-relaxed" style={{ color: `${colors.text}bf` }}>
                          {aiInsight.bestFor}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed md:text-base" style={{ color: `${colors.text}d0` }}>
                      {aiInsightConfigured
                        ? aiInsightError
                          ? "Gemini is configured, but the request failed. The app can still show movie details; try refreshing later to generate watch-specific reasons."
                          : "Watch-specific AI reasons could not be generated for this movie yet."
                        : "Add GEMINI_API_KEY to the backend environment to generate spoiler-free watch reasons."}
                    </p>
                  )}
                  {aiInsight?.moodTags?.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {aiInsight.moodTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full px-3 py-1 text-xs font-semibold"
                          style={{ backgroundColor: `${colors.secondary}c9`, color: colors.text }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </SectionShell>

                {trailer ? (
                  <SectionShell title="Trailer" colors={colors}>
                    <div className="aspect-video overflow-hidden rounded-2xl" style={{ backgroundColor: colors.secondary }}>
                      <iframe
                        title={`${movie.title} trailer`}
                        src={`https://www.youtube.com/embed/${trailer.key}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="h-full w-full"
                      />
                    </div>
                  </SectionShell>
                ) : null}

                <SectionShell
                  title="Watch Options"
                  colors={colors}
                  action={
                    <span
                      className="w-fit rounded-full px-3 py-1 text-xs font-semibold"
                      style={{ backgroundColor: `${colors.secondary}c9`, color: colors.text }}
                    >
                      {watchRegion}
                    </span>
                  }
                >
                  {watchProviderGroups.length > 0 ? (
                    <div className="grid gap-6">
                      <p className="text-sm leading-relaxed" style={{ color: `${colors.text}c9` }}>
                        Legal streaming availability varies by country and provider. YOKO links to available services
                        instead of hosting full movies.
                      </p>
                      {watchProviderGroups.map((group) => (
                        <WatchProviderGroup
                          key={group.title}
                          title={group.title}
                          providers={group.providers}
                          colors={colors}
                        />
                      ))}
                      {watchProviderData?.link ? (
                        <a
                          href={watchProviderData.link}
                          target="_blank"
                          rel="noreferrer"
                          className="w-fit rounded-full px-5 py-3 text-sm font-semibold"
                          style={{ backgroundColor: colors.primary, color: "#ffffff" }}
                        >
                          View all watch options
                        </a>
                      ) : null}
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      <p className="text-sm leading-relaxed" style={{ color: `${colors.text}c9` }}>
                        No legal streaming, rent, buy, or free provider options were found for this region yet.
                      </p>
                      {trailer ? (
                        <a
                          href={`https://www.youtube.com/watch?v=${trailer.key}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-fit rounded-full px-5 py-3 text-sm font-semibold"
                          style={{ backgroundColor: colors.secondary, color: colors.text, border: `1px solid ${colors.accent}` }}
                        >
                          Watch Trailer
                        </a>
                      ) : null}
                    </div>
                  )}
                </SectionShell>

                <SectionShell title="Top Cast" colors={colors}>
                  {cast.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                      {cast.map((person) => {
                        const profileUrl = getProfileUrl(person.profile_path);
                        return (
                          <article
                            key={person.cast_id || person.credit_id}
                            className="overflow-hidden rounded-2xl"
                            style={{
                              backgroundColor: `${colors.background}d9`,
                              border: `1px solid ${colors.text}12`,
                            }}
                          >
                            {profileUrl ? (
                              <img
                                src={profileUrl}
                                alt={person.name}
                                className="aspect-[2/3] w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div
                                className="flex aspect-[2/3] w-full items-center justify-center text-xl font-bold"
                                style={{ backgroundColor: colors.secondary, color: colors.text }}
                              >
                                {person.name?.slice(0, 1) || "?"}
                              </div>
                            )}
                            <div className="p-3">
                              <h4 className="text-sm font-bold">{person.name}</h4>
                              <p className="mt-1 text-xs leading-snug" style={{ color: `${colors.text}a8` }}>
                                {person.character || "Cast"}
                              </p>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm" style={{ color: `${colors.text}b8` }}>Cast information is not available.</p>
                  )}
                </SectionShell>
              </div>

              <aside className="grid gap-7 lg:col-span-4">
                <SectionShell title="Movie Facts" colors={colors}>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <DetailStat label="Runtime" value={formatRuntime(movie.runtime)} colors={colors} />
                    <DetailStat label="Release Date" value={formatDate(movie.release_date)} colors={colors} />
                    <DetailStat label="Status" value={movie.status || "N/A"} colors={colors} />
                    <DetailStat label="Language" value={languageNames.join(", ") || movie.original_language?.toUpperCase() || "N/A"} colors={colors} />
                    <DetailStat label="Vote Count" value={movie.vote_count?.toLocaleString() || "N/A"} colors={colors} />
                    <DetailStat label="Popularity" value={movie.popularity ? Math.round(movie.popularity).toLocaleString() : "N/A"} colors={colors} />
                  </div>
                </SectionShell>

                <SectionShell title="Crew" colors={colors}>
                  <div className="grid gap-3">
                    <DetailStat label="Director" value={directors.join(", ") || "N/A"} colors={colors} />
                    <DetailStat label="Writer" value={writers.join(", ") || "N/A"} colors={colors} />
                    <DetailStat label="Producer" value={producers.join(", ") || "N/A"} colors={colors} />
                  </div>
                </SectionShell>

                <SectionShell title="Production" colors={colors}>
                  <div className="grid gap-3">
                    <DetailStat label="Budget" value={formatCurrency(movie.budget)} colors={colors} />
                    <DetailStat label="Revenue" value={formatCurrency(movie.revenue)} colors={colors} />
                    <DetailStat label="Countries" value={countryNames.join(", ") || "N/A"} colors={colors} />
                    <DetailStat label="Companies" value={companyNames.join(", ") || "N/A"} colors={colors} />
                  </div>
                </SectionShell>
              </aside>
            </section>

            <SectionShell title="More Like This" colors={colors}>
              {renderMovieRail(recommendations, "TMDb has no direct recommendations for this movie yet.")}
            </SectionShell>

            <SectionShell title="Similar Movies" colors={colors}>
              {renderMovieRail(similarMovies, "Similar movie data is not available for this title.")}
            </SectionShell>
          </>
        ) : null}
      </main>

      <TmdbCreditFooter colors={colors} />
    </div>
  );
};

export default MovieDetailsPage;
