import React from "react";
import { Link } from "react-router-dom";

const ErrorPage = ({ colors, themeMode, onToggleTheme, ThemeSwitch, user }) => {
  const primaryTarget = user ? "/dashboard" : "/";
  const secondaryTarget = user ? "/discover" : "/login";

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: colors.background,
        color: colors.text,
        fontFamily: "Andika, sans-serif",
      }}
    >
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 md:px-8">
        <Link to={primaryTarget} className="text-2xl font-bold tracking-tight leading-none">
          <span style={{ color: colors.primary }}>YO</span>
          <span style={{ color: colors.text }}>K</span>
          <span style={{ color: colors.accent }}>O</span>
        </Link>
        <ThemeSwitch themeMode={themeMode} onToggleTheme={onToggleTheme} colors={colors} />
      </header>

      <main className="mx-auto flex min-h-[70vh] w-full max-w-4xl flex-col items-center justify-center px-4 text-center md:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: colors.accent }}>
          404 / API Error
        </p>
        <h1 className="mt-3 text-4xl font-bold md:text-6xl">This page is not available</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed md:text-base" style={{ color: `${colors.text}c7` }}>
          The route may be wrong, expired, or temporarily unavailable. You can return to a stable YOKO page and keep
          exploring movies.
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            to={primaryTarget}
            className="rounded-full px-5 py-3 text-sm font-semibold"
            style={{ backgroundColor: colors.primary, color: "#ffffff" }}
          >
            {user ? "Go to Dashboard" : "Go Home"}
          </Link>
          <Link
            to={secondaryTarget}
            className="rounded-full px-5 py-3 text-sm font-semibold"
            style={{
              backgroundColor: colors.secondary,
              color: colors.text,
              border: `1px solid ${colors.accent}`,
            }}
          >
            {user ? "Open Discover" : "Sign In"}
          </Link>
        </div>
      </main>
    </div>
  );
};

export default ErrorPage;
