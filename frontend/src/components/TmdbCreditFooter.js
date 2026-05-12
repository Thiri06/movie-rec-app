import React from "react";

const TmdbCreditFooter = ({ colors }) => {
  return (
    <footer
      className="mx-auto mt-2 w-full max-w-7xl px-4 pb-7 md:px-8"
      style={{ color: `${colors.text}b8` }}
    >
      <div
        className="rounded-2xl px-4 py-5 md:px-6"
        style={{
          border: `1px solid ${colors.secondary}`,
          backgroundColor: `${colors.background}e8`,
        }}
      >
        <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.14em]">Credits</p>
            <img
              src={`${process.env.PUBLIC_URL}/tmdb-logo.svg`}
              alt="TMDB Logo"
              className="h-6 w-auto md:h-7"
              loading="lazy"
            />
            <p className="max-w-3xl text-xs leading-relaxed md:text-sm">
              This application uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by
              TMDB.
            </p>
          </div>
          <a
            href="https://www.themoviedb.org"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold underline decoration-2 underline-offset-4 md:text-sm"
            style={{ color: colors.accent }}
          >
            View TMDB
          </a>
        </div>
      </div>
    </footer>
  );
};

export default TmdbCreditFooter;
