import React, { useEffect, useMemo, useState } from "react";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import DashboardNav from "../components/DashboardNav";
import { auth } from "../firebase";
import { getCurrentUserProfile, updateUserPreferences } from "../utils/apiClient";
import { getAgeFromBirthDate, getContentLimitLabel, isUnderageProfile } from "../utils/movieApi";

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

const formatInputDate = (dateValue) => {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
};

const PreferenceButton = ({ active, colors, children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="rounded-full px-3 py-2 text-xs font-semibold transition md:text-sm"
    style={{
      backgroundColor: active ? colors.primary : `${colors.background}d9`,
      color: active ? "#ffffff" : colors.text,
      border: `1px solid ${active ? colors.primary : colors.accent}`,
    }}
  >
    {children}
  </button>
);

const MetricTile = ({ label, value, colors }) => (
  <div
    className="rounded-2xl p-4"
    style={{
      backgroundColor: `${colors.background}cc`,
      border: `1px solid ${colors.text}12`,
    }}
  >
    <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: `${colors.text}91` }}>
      {label}
    </p>
    <p className="mt-2 text-lg font-bold">{value}</p>
  </div>
);

const Panel = ({ title, description, colors, children }) => (
  <section
    className="rounded-3xl p-5 md:p-6"
    style={{
      border: `1px solid ${colors.secondary}`,
      backgroundColor: `${colors.background}f2`,
    }}
  >
    <div className="mb-5">
      <h3 className="text-xl font-bold md:text-2xl">{title}</h3>
      {description ? (
        <p className="mt-1 text-sm" style={{ color: `${colors.text}b8` }}>
          {description}
        </p>
      ) : null}
    </div>
    {children}
  </section>
);

const ProfilePage = ({ colors, themeMode, onToggleTheme, ThemeSwitch, user }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [preferences, setPreferences] = useState({
    favoriteGenres: [],
    dislikedGenres: [],
    preferredLanguages: [],
    minRating: 0,
    birthDate: "",
    maturityLimit: "auto",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const previewProfile = useMemo(
    () => ({
      ...profile,
      preferences,
    }),
    [preferences, profile]
  );
  const age = getAgeFromBirthDate(preferences.birthDate);
  const isUnderage = isUnderageProfile(previewProfile);
  const contentLimitLabel = getContentLimitLabel(previewProfile);
  const favoriteGenreNames = GENRE_OPTIONS
    .filter((genre) => preferences.favoriteGenres.includes(genre.id))
    .map((genre) => genre.name)
    .slice(0, 4);

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
        birthDate: formatInputDate(data.preferences?.birthDate),
        maturityLimit: data.preferences?.maturityLimit || "auto",
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
      const cleanedBirthDate = preferences.birthDate || null;
      const updated = await updateUserPreferences({
        favoriteGenres: preferences.favoriteGenres,
        dislikedGenres: preferences.dislikedGenres.filter(
          (genreId) => !preferences.favoriteGenres.includes(genreId)
        ),
        preferredLanguages: preferences.preferredLanguages,
        minRating: Number(preferences.minRating || 0),
        birthDate: cleanedBirthDate,
        maturityLimit: preferences.maturityLimit || "auto",
      });
      setProfile(updated);
      setPreferences({
        favoriteGenres: updated.preferences?.favoriteGenres || [],
        dislikedGenres: updated.preferences?.dislikedGenres || [],
        preferredLanguages: updated.preferences?.preferredLanguages || [],
        minRating: updated.preferences?.minRating || 0,
        birthDate: formatInputDate(updated.preferences?.birthDate),
        maturityLimit: updated.preferences?.maturityLimit || "auto",
      });
      setStatusMessage("Profile preferences saved.");
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
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
          className="overflow-hidden rounded-3xl"
          style={{
            border: `1px solid ${colors.secondary}`,
            background: `linear-gradient(135deg, ${colors.secondary}b8 0%, ${colors.background} 58%)`,
          }}
        >
          <div className="grid gap-6 p-5 md:grid-cols-[auto_1fr_auto] md:items-center md:p-7">
            {profile?.photoURL || user?.photoURL ? (
              <img
                src={profile?.photoURL || user?.photoURL}
                alt={profile?.name || user?.displayName || "Profile"}
                className="h-28 w-28 rounded-3xl object-cover shadow-xl"
              />
            ) : (
              <div
                className="flex h-28 w-28 items-center justify-center rounded-3xl text-4xl font-bold shadow-xl"
                style={{ backgroundColor: colors.primary, color: "#ffffff" }}
              >
                {(profile?.name || user?.displayName || user?.email || "Y").slice(0, 1).toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: colors.accent }}>
                User Profile
              </p>
              <h2 className="mt-2 truncate text-3xl font-bold md:text-5xl">
                {profile?.name || user?.displayName || "Movie Lover"}
              </h2>
              <p className="mt-2 truncate text-sm md:text-base" style={{ color: `${colors.text}c4` }}>
                {profile?.email || user?.email}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: `${colors.primary}22`, color: colors.primary }}>
                  {age === null ? "Age not set" : `${age} years old`}
                </span>
                <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: `${colors.secondary}d9`, color: colors.text }}>
                  Content: {contentLimitLabel}
                </span>
                <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: `${colors.secondary}d9`, color: colors.text }}>
                  {favoriteGenreNames.length > 0 ? favoriteGenreNames.join(", ") : "No taste profile yet"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={savePreferences}
              disabled={isSaving || isLoading}
              className="w-fit rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: colors.primary, color: "#ffffff" }}
            >
              {isSaving ? "Saving..." : "Save Profile"}
            </button>
          </div>

          <div className="grid gap-3 px-5 pb-5 md:grid-cols-4 md:px-7 md:pb-7">
            <MetricTile label="Favorite Genres" value={preferences.favoriteGenres.length} colors={colors} />
            <MetricTile label="Languages" value={preferences.preferredLanguages.length} colors={colors} />
            <MetricTile label="Minimum Rating" value={`${Number(preferences.minRating || 0).toFixed(1)}+`} colors={colors} />
            <MetricTile label="Safety Mode" value={isUnderage ? "Under 18" : contentLimitLabel} colors={colors} />
          </div>
        </section>

        <section className="grid gap-7 lg:grid-cols-12">
          <div className="grid gap-7 lg:col-span-4">
            <Panel title="Account Details" description="Firebase identity synced into MongoDB." colors={colors}>
              <div className="grid gap-3">
                <MetricTile label="Last Login" value={profile?.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleDateString() : "N/A"} colors={colors} />
                <MetricTile label="Profile Saved" value={profile?.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : "N/A"} colors={colors} />
              </div>
            </Panel>

            <Panel title="Content Safety" description="Under-18 profiles are restricted automatically." colors={colors}>
              <label className="block">
                <span className="text-sm font-bold">Date of Birth</span>
                <input
                  type="date"
                  value={preferences.birthDate}
                  onChange={(event) =>
                    setPreferences((current) => ({ ...current, birthDate: event.target.value }))
                  }
                  className="mt-2 w-full rounded-2xl px-3 py-3 text-sm outline-none"
                  style={{
                    backgroundColor: `${colors.background}d9`,
                    color: colors.text,
                    border: `1px solid ${colors.accent}`,
                  }}
                />
              </label>

              <div className="mt-5 grid gap-2">
                {[
                  { value: "auto", label: "Auto by Age" },
                  { value: "pg13", label: "PG-13 and Below" },
                  { value: "adult", label: "Standard Catalog" },
                ].map((option) => {
                  const lockedAdult = option.value === "adult" && isUnderage;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={lockedAdult}
                      onClick={() =>
                        setPreferences((current) => ({ ...current, maturityLimit: option.value }))
                      }
                      className="rounded-2xl px-4 py-3 text-left text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45"
                      style={{
                        backgroundColor: preferences.maturityLimit === option.value ? colors.primary : `${colors.background}d9`,
                        color: preferences.maturityLimit === option.value ? "#ffffff" : colors.text,
                        border: `1px solid ${colors.accent}`,
                      }}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 text-xs leading-relaxed" style={{ color: `${colors.text}ad` }}>
                Discover applies TMDb adult exclusion for everyone and PG-13 certification filtering when this profile is under 18 or restricted.
              </p>
            </Panel>
          </div>

          <div className="grid gap-7 lg:col-span-8">
            <Panel title="Taste Profile" description="Tell YOKO what to favor and what to avoid." colors={colors}>
              <div className="grid gap-7">
                <div>
                  <h4 className="font-bold">Favorite Genres</h4>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {GENRE_OPTIONS.map((genre) => (
                      <PreferenceButton
                        key={`favorite-${genre.id}`}
                        active={preferences.favoriteGenres.includes(genre.id)}
                        colors={colors}
                        onClick={() => toggleArrayValue("favoriteGenres", genre.id)}
                      >
                        {genre.name}
                      </PreferenceButton>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold">Avoid These Genres</h4>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {GENRE_OPTIONS.map((genre) => (
                      <PreferenceButton
                        key={`avoid-${genre.id}`}
                        active={preferences.dislikedGenres.includes(genre.id)}
                        colors={colors}
                        onClick={() => toggleArrayValue("dislikedGenres", genre.id)}
                      >
                        {genre.name}
                      </PreferenceButton>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold">Preferred Languages</h4>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {LANGUAGE_OPTIONS.map((language) => (
                      <PreferenceButton
                        key={language.code}
                        active={preferences.preferredLanguages.includes(language.code)}
                        colors={colors}
                        onClick={() => toggleArrayValue("preferredLanguages", language.code)}
                      >
                        {language.name}
                      </PreferenceButton>
                    ))}
                  </div>
                </div>
              </div>
            </Panel>

            <Panel title="Quality Filter" description="Raise this when you want fewer, stronger matches." colors={colors}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
                  className="w-fit rounded-full px-4 py-2 text-sm font-bold"
                  style={{ backgroundColor: colors.secondary, color: colors.text }}
                >
                  {Number(preferences.minRating || 0).toFixed(1)}+
                </span>
              </div>
            </Panel>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ProfilePage;
