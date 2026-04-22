import React from "react";
import { Link } from "react-router-dom";

const HomePage = ({ colors, themeMode, onToggleTheme, ThemeSwitch }) => {
  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        backgroundColor: colors.background,
        color: colors.text,
        fontFamily: "Andika, sans-serif",
      }}
    >
      <div
        className="absolute -top-24 -left-16 h-72 w-72 rounded-full blur-3xl"
        style={{ backgroundColor: `${colors.primary}50` }}
      />
      <div
        className="absolute -right-24 top-1/3 h-80 w-80 rounded-full blur-3xl"
        style={{ backgroundColor: `${colors.accent}35` }}
      />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6 md:px-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            <span style={{ color: colors.primary }}>YO</span>
            <span style={{ color: colors.text }}>K</span>
            <span style={{ color: colors.accent }}>O</span>
          </h1>
          <p className="text-xs uppercase tracking-[0.2em]" style={{ color: `${colors.text}b3` }}>
            Movie Intelligence
          </p>
        </div>

        <ThemeSwitch themeMode={themeMode} onToggleTheme={onToggleTheme} colors={colors} />
      </header>

      <main className="relative z-10 mx-auto grid max-w-6xl gap-10 px-6 pb-12 pt-8 md:grid-cols-2 md:px-10 md:pt-16">
        <section className="flex flex-col justify-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: colors.primary }}>
            Personalized discovery
          </p>
          <h2 className="text-4xl font-bold leading-tight md:text-6xl">
            Find your next movie with <span style={{ color: colors.accent }}>YOKO</span>
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed md:text-lg" style={{ color: `${colors.text}c9` }}>
            Discover trending titles, explore by genre, and receive recommendation insights shaped by your watch behavior.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/login"
              className="rounded-full px-7 py-3 text-sm font-semibold transition hover:-translate-y-0.5"
              style={{ backgroundColor: colors.primary, color: "#ffffff" }}
            >
              Sign In with Google
            </Link>
            <Link
              to="/login"
              className="rounded-full px-7 py-3 text-sm font-semibold transition hover:opacity-90"
              style={{
                backgroundColor: colors.secondary,
                color: colors.text,
                border: `1px solid ${colors.accent}`,
              }}
            >
              Explore demo flow
            </Link>
          </div>
        </section>

        <section
          className="rounded-3xl p-6 md:p-8"
          style={{
            background: `linear-gradient(155deg, ${colors.secondary}, ${colors.background})`,
            border: `1px solid ${colors.accent}55`,
          }}
        >
          <h3 className="text-xl font-bold md:text-2xl">Why YOKO feels effortless</h3>
          <div className="mt-6 space-y-4">
            {[
              "Live TMDb search with responsive filtering",
              "Behavior-based recommendations and watch history",
              "Clean design for desktop and mobile screens",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl px-4 py-3 text-sm md:text-base"
                style={{
                  backgroundColor: `${colors.background}cc`,
                  border: `1px solid ${colors.secondary}`,
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;
