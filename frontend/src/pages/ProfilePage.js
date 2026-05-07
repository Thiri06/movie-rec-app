import React, { useEffect, useMemo, useState } from "react";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import DashboardNav from "../components/DashboardNav";
import { auth } from "../firebase";
import { getCurrentUserProfile, updateUserPreferences } from "../utils/apiClient";

const GENRE_OPTIONS = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 18, name: "Drama" },
  { id: 14, name: "Fantasy" },
  { id: 27, name: "Horror" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Sci-Fi" },
  { id: 53, name: "Thriller" },
];

const LANGUAGE_OPTIONS = [
  { code: "en", name: "English" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese" },
  { code: "hi", name: "Hindi" },
  { code: "fr", name: "French" },
  { code: "es", name: "Spanish" },
];

const ProfilePage = ({ colors, themeMode, onToggleTheme, ThemeSwitch, user }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [preferences, setPreferences] = useState({
    favoriteGenres: [],
    dislikedGenres: [],
    preferredLanguages: [],
    minRating: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const selectedSummary = useMemo(() => {
    const favoriteCount = preferences.favoriteGenres.length;
    const languageCount = preferences.preferredLanguages.length;
    const rating = Number(preferences.minRating || 0);
    return `${favoriteCount} genre signal${favoriteCount === 1 ? "" : "s"} / ${languageCount} language preference${languageCount === 1 ? "" : "s"} / ${rating.toFixed(1)}+ rating`;
  }, [preferences]);

  const loadProfile = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const data = await getCurrentUserProfile();
      setProfile(data);
      setPreferences({
        favoriteGenres: data.preferences?.favoriteGenres || [],
        dislikedGenres: data.preferences?.dislikedGenres || [],
        preferredLanguages: data.preferences?.preferredLanguages || [],
        minRating: data.preferences?.minRating || 0,
      });
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      setErrorMessage(error.message || "Logout failed.");
    }
  };

  const toggleArrayValue = (field, value) => {
    setPreferences((current) => {
      const currentValues = current[field] || [];
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];

      return {
        ...current,
        [field]: nextValues,
      };
    });
  };

  const savePreferences = async () => {
    setIsSaving(true);
    setErrorMessage("");
    setStatusMessage("");
    try {
      const updated = await updateUserPreferences({
        favoriteGenres: preferences.favoriteGenres,
        dislikedGenres: preferences.dislikedGenres.filter(
          (genreId) => !preferences.favoriteGenres.includes(genreId)
        ),
        preferredLanguages: preferences.preferredLanguages,
        minRating: Number(preferences.minRating || 0),
      });
      setProfile(updated);
      setPreferences({
        favoriteGenres: updated.preferences?.favoriteGenres || [],
        dislikedGenres: updated.preferences?.dislikedGenres || [],
        preferredLanguages: updated.preferences?.preferredLanguages || [],
        minRating: updated.preferences?.minRating || 0,
      });
      setStatusMessage("Profile preferences saved.");
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const renderGenreButton = (genre, field) => {
    const isSelected = preferences[field].includes(genre.id);
    return (
      <button
        key={`${field}-${genre.id}`}
        type="button"
        onClick={() => toggleArrayValue(field, genre.id)}
        className="rounded-full px-3 py-2 text-xs font-semibold transition md:text-sm"
        style={{
          backgroundColor: isSelected ? colors.primary : colors.secondary,
          color: isSelected ? "#ffffff" : colors.text,
          border: `1px solid ${isSelected ? colors.primary : colors.accent}`,
        }}
      >
        {genre.name}
      </button>
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

        <section
          className="yoko-fade-up rounded-3xl p-5 md:p-6"
          style={{
            border: `1px solid ${colors.secondary}`,
            background: `linear-gradient(120deg, ${colors.secondary}88, ${colors.background})`,
          }}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: colors.accent }}>
            Account & Preferences
          </p>
          <div className="mt-3 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h2 className="text-3xl font-bold md:text-5xl">Profile</h2>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed md:text-base" style={{ color: `${colors.text}c9` }}>
                Tune your genre, language, and rating preferences so YOKO can make cleaner personalization choices.
              </p>
            </div>
            <span
              className="w-fit rounded-full px-3 py-1.5 text-xs font-semibold md:text-sm"
              style={{ backgroundColor: `${colors.secondary}c9`, color: colors.text }}
            >
              {selectedSummary}
            </span>
          </div>
        </section>

        <section className="grid gap-7 lg:grid-cols-12">
          <aside
            className="rounded-3xl p-5 lg:col-span-4"
            style={{
              border: `1px solid ${colors.secondary}`,
              backgroundColor: `${colors.background}f2`,
            }}
          >
            {isLoading ? (
              <div className="yoko-shimmer h-56 rounded-2xl" style={{ backgroundColor: colors.secondary }} />
            ) : (
              <>
                <div className="flex items-center gap-4">
                  {profile?.photoURL || user?.photoURL ? (
                    <img
                      src={profile?.photoURL || user?.photoURL}
                      alt={profile?.name || user?.displayName || "Profile"}
                      className="h-16 w-16 rounded-2xl object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold"
                      style={{ backgroundColor: colors.primary, color: "#ffffff" }}
                    >
                      {(profile?.name || user?.displayName || user?.email || "Y").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="truncate text-xl font-bold">{profile?.name || user?.displayName || "Movie Lover"}</h3>
                    <p className="truncate text-sm" style={{ color: `${colors.text}a8` }}>
                      {profile?.email || user?.email}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 text-sm">
                  <div className="rounded-2xl p-4" style={{ backgroundColor: `${colors.secondary}80` }}>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: colors.accent }}>
                      Last login
                    </p>
                    <p className="mt-2 font-semibold">
                      {profile?.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString() : "Not available"}
                    </p>
                  </div>
                  <div className="rounded-2xl p-4" style={{ backgroundColor: `${colors.secondary}80` }}>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: colors.accent }}>
                      Profile saved
                    </p>
                    <p className="mt-2 font-semibold">
                      {profile?.updatedAt ? new Date(profile.updatedAt).toLocaleString() : "Not available"}
                    </p>
                  </div>
                </div>
              </>
            )}
          </aside>

          <section
            className="rounded-3xl p-5 lg:col-span-8"
            style={{
              border: `1px solid ${colors.secondary}`,
              backgroundColor: `${colors.background}f2`,
            }}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xl font-bold md:text-2xl">Personalization Settings</h3>
                <p className="mt-1 text-sm" style={{ color: `${colors.text}ba` }}>
                  These values are stored in MongoDB under your user profile.
                </p>
              </div>
              <button
                type="button"
                onClick={savePreferences}
                disabled={isSaving || isLoading}
                className="rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: colors.primary, color: "#ffffff" }}
              >
                {isSaving ? "Saving..." : "Save Preferences"}
              </button>
            </div>

            <div className="mt-7 grid gap-7">
              <div>
                <h4 className="font-bold">Favorite Genres</h4>
                <div className="mt-3 flex flex-wrap gap-2">
                  {GENRE_OPTIONS.map((genre) => renderGenreButton(genre, "favoriteGenres"))}
                </div>
              </div>

              <div>
                <h4 className="font-bold">Avoid These Genres</h4>
                <div className="mt-3 flex flex-wrap gap-2">
                  {GENRE_OPTIONS.map((genre) => renderGenreButton(genre, "dislikedGenres"))}
                </div>
              </div>

              <div>
                <h4 className="font-bold">Preferred Languages</h4>
                <div className="mt-3 flex flex-wrap gap-2">
                  {LANGUAGE_OPTIONS.map((language) => {
                    const isSelected = preferences.preferredLanguages.includes(language.code);
                    return (
                      <button
                        key={language.code}
                        type="button"
                        onClick={() => toggleArrayValue("preferredLanguages", language.code)}
                        className="rounded-full px-3 py-2 text-xs font-semibold transition md:text-sm"
                        style={{
                          backgroundColor: isSelected ? colors.primary : colors.secondary,
                          color: isSelected ? "#ffffff" : colors.text,
                          border: `1px solid ${isSelected ? colors.primary : colors.accent}`,
                        }}
                      >
                        {language.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="block">
                <span className="font-bold">Minimum Rating</span>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    type="range"
                    min="0"
                    max="9"
                    step="0.5"
                    value={preferences.minRating}
                    onChange={(event) =>
                      setPreferences((current) => ({ ...current, minRating: Number(event.target.value) }))
                    }
                    className="w-full"
                  />
                  <span
                    className="w-fit rounded-full px-3 py-1 text-sm font-bold"
                    style={{ backgroundColor: colors.secondary, color: colors.text }}
                  >
                    {Number(preferences.minRating || 0).toFixed(1)}+
                  </span>
                </div>
              </label>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
};

export default ProfilePage;
