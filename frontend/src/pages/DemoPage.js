import React from "react";
import { Link } from "react-router-dom";

const DemoPage = ({ colors, themeMode, onToggleTheme, ThemeSwitch }) => {
  const steps = [
    {
      label: "Step 01",
      title: "Discover movies",
      description: "Start with TMDb-powered search, then narrow results by genre, year, and rating.",
      preview: "Search: sci-fi thriller",
      chips: ["Genre: Sci-Fi", "Rating: 7.0+", "Year: All"],
    },
    {
      label: "Step 02",
      title: "Open movie details",
      description: "Viewing a detail page records a lightweight interest signal for personalization.",
      preview: "Signal recorded: viewed_details",
      chips: ["Poster", "Overview", "Trailer"],
    },
    {
      label: "Step 03",
      title: "Get explained recommendations",
      description: "YOKO blends behavior, favorites, actors, directors, and similar-user patterns.",
      preview: "Because you watched Interstellar.",
      chips: ["Hybrid score", "Matched actors", "Similar users"],
    },
    {
      label: "Step 04",
      title: "Strengthen your profile",
      description: "Favorites and marked-watched movies become stronger signals than casual browsing.",
      preview: "Signal strength: favorite + marked_watched",
      chips: ["Favorites", "Watch History", "Taste Profile"],
    },
  ];

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
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage: `linear-gradient(${colors.text}10 1px, transparent 1px), linear-gradient(90deg, ${colors.text}10 1px, transparent 1px)`,
          backgroundSize: "46px 46px",
          maskImage: "linear-gradient(to bottom, black, transparent 82%)",
        }}
      />

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 md:px-8">
        <Link to="/" className="leading-none">
          <h1 className="text-2xl font-bold tracking-tight">
            <span style={{ color: colors.primary }}>YO</span>
            <span style={{ color: colors.text }}>K</span>
            <span style={{ color: colors.accent }}>O</span>
          </h1>
          <p className="mt-1 text-xs uppercase tracking-[0.2em]" style={{ color: `${colors.text}a8` }}>
            Demo Flow
          </p>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="hidden rounded-full px-4 py-2 text-sm font-semibold sm:inline-flex"
            style={{ backgroundColor: colors.primary, color: "#ffffff" }}
          >
            Sign In
          </Link>
          <ThemeSwitch themeMode={themeMode} onToggleTheme={onToggleTheme} colors={colors} />
        </div>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-7xl gap-7 px-4 pb-10 pt-5 md:px-8">
        <section
          className="grid gap-6 rounded-3xl p-5 md:p-7 lg:grid-cols-[0.95fr_1.05fr] lg:items-center"
          style={{
            border: `1px solid ${colors.accent}45`,
            background: `linear-gradient(135deg, ${colors.secondary}8a, ${colors.background})`,
          }}
        >
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: colors.accent }}>
              Read-only product walkthrough
            </p>
            <h2 className="mt-3 text-4xl font-bold leading-tight md:text-6xl">Preview how YOKO learns taste</h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed md:text-base" style={{ color: `${colors.text}c9` }}>
              This demo shows the intended user journey without opening protected app pages. Sign in when you want real
              recommendations generated from your own activity.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="rounded-full px-5 py-3 text-sm font-semibold"
                style={{ backgroundColor: colors.primary, color: "#ffffff" }}
              >
                Sign In to Personalize
              </Link>
              <Link
                to="/"
                className="rounded-full px-5 py-3 text-sm font-semibold"
                style={{
                  backgroundColor: colors.secondary,
                  color: colors.text,
                  border: `1px solid ${colors.accent}`,
                }}
              >
                Back Home
              </Link>
            </div>
          </div>

          <div
            className="overflow-hidden rounded-3xl p-4"
            style={{ backgroundColor: `${colors.background}e8`, border: `1px solid ${colors.text}14` }}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              {["Discovery", "Signals", "Recommendations"].map((label, index) => (
                <div
                  key={label}
                  className="rounded-2xl p-4"
                  style={{
                    backgroundColor: `${colors.secondary}9c`,
                    border: `1px solid ${colors.accent}2e`,
                  }}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: colors.accent }}>
                    {label}
                  </p>
                  <div className="mt-4 h-2 overflow-hidden rounded-full" style={{ backgroundColor: `${colors.text}1c` }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${index === 0 ? 78 : index === 1 ? 88 : 94}%`,
                        backgroundColor: index === 1 ? colors.accent : colors.primary,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl p-4" style={{ backgroundColor: `${colors.background}f5` }}>
              <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: colors.accent }}>
                Example recommendation
              </p>
              <p className="mt-2 text-lg font-bold">Because you favorited Parasite.</p>
              <p className="mt-2 text-sm" style={{ color: `${colors.text}b8` }}>
                Matched preferred genres, familiar directors, and similar-user taste signals.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step) => (
            <article
              key={step.title}
              className="rounded-3xl p-5"
              style={{
                backgroundColor: `${colors.background}f2`,
                border: `1px solid ${colors.secondary}`,
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: colors.accent }}>
                {step.label}
              </p>
              <h3 className="mt-3 text-xl font-bold">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: `${colors.text}bf` }}>
                {step.description}
              </p>
              <div
                className="mt-5 rounded-2xl p-4 text-sm font-semibold"
                style={{ backgroundColor: `${colors.secondary}86`, border: `1px solid ${colors.accent}35` }}
              >
                {step.preview}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {step.chips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ backgroundColor: `${colors.secondary}c9`, color: colors.text }}
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
};

export default DemoPage;
