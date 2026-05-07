import React from "react";
import { Link } from "react-router-dom";

const HomePage = ({ colors, themeMode, onToggleTheme, ThemeSwitch }) => {
  const featureItems = [
    {
      title: "Live TMDb Search",
      description: "Responsive filtering helps users move from a vague mood to a concrete title quickly.",
      icon: (
        <path d="M10.5 18a7.5 7.5 0 1 1 5.95-2.93l3.24 3.24a.98.98 0 0 1 0 1.38.98.98 0 0 1-1.38 0l-3.24-3.24A7.46 7.46 0 0 1 10.5 18Zm0-2a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11Z" />
      ),
      tags: ["TMDb API", "Instant filters"],
    },
    {
      title: "Hybrid Recommendations",
      description: "Combines watch behavior with collaborative patterns to surface smarter suggestions.",
      icon: (
        <path d="M5 13.5A3.5 3.5 0 1 1 8.5 10H11V7.5a3.5 3.5 0 1 1 2 0V10h2.5a3.5 3.5 0 1 1 0 2H13v2.5a3.5 3.5 0 1 1-2 0V12H8.5A3.5 3.5 0 0 1 5 13.5Zm0-2A1.5 1.5 0 1 0 5 8a1.5 1.5 0 0 0 0 3.5Zm7-5A1.5 1.5 0 1 0 12 3a1.5 1.5 0 0 0 0 3.5Zm7 5A1.5 1.5 0 1 0 19 8a1.5 1.5 0 0 0 0 3.5Zm-7 9A1.5 1.5 0 1 0 12 17a1.5 1.5 0 0 0 0 3.5Z" />
      ),
      tags: ["Behavior", "Collaborative filtering"],
    },
    {
      title: "Responsive Design",
      description: "Built to stay usable and polished across desktop, tablet, and mobile screens.",
      icon: (
        <path d="M4 5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-3v2h2a1 1 0 1 1 0 2H8a1 1 0 1 1 0-2h2v-2H7a3 3 0 0 1-3-3V5Zm3-1a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H7Z" />
      ),
      tags: ["Desktop", "Mobile"],
    },
  ];

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        backgroundColor: colors.background,
        color: colors.text,
        fontFamily: "Andika, sans-serif",
      }}
    >
      <style>
        {`
          @keyframes yokoFilmDrift {
            from { transform: translateX(-18px); }
            to { transform: translateX(18px); }
          }

          @keyframes yokoSignalPulse {
            0%, 100% { opacity: 0.44; transform: scale(0.98); }
            50% { opacity: 0.9; transform: scale(1); }
          }

          .yoko-film-drift {
            animation: yokoFilmDrift 6s ease-in-out infinite alternate;
          }

          .yoko-signal-pulse {
            animation: yokoSignalPulse 3.5s ease-in-out infinite;
          }
        `}
      </style>

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(${colors.text}10 1px, transparent 1px), linear-gradient(90deg, ${colors.text}10 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
          maskImage: "linear-gradient(to bottom, black, transparent 78%)",
        }}
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

      <main className="relative z-10 mx-auto grid max-w-6xl gap-8 px-6 pb-8 pt-6 lg:min-h-[calc(100vh-168px)] lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:px-10 lg:pt-10">
        <section className="flex flex-col justify-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: colors.accent }}>
            Personalized Discovery
          </p>
          <h2 className="max-w-2xl text-4xl font-bold leading-tight md:text-6xl">
            YOKO Movie Intelligence
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed md:text-lg" style={{ color: `${colors.text}d6` }}>
            Find your next movie with YOKO &mdash; tailored to your watch behavior.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/login"
              className="inline-flex min-h-12 items-center rounded-full px-7 py-3 text-sm font-semibold shadow-lg transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{
                backgroundColor: colors.primary,
                color: "#ffffff",
                boxShadow: `0 18px 36px ${colors.primary}33`,
                "--tw-ring-color": colors.accent,
                "--tw-ring-offset-color": colors.background,
              }}
            >
              Sign In with Google
            </Link>
            <Link
              to="/demo"
              className="inline-flex min-h-12 items-center rounded-full px-7 py-3 text-sm font-semibold transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{
                backgroundColor: `${colors.secondary}d9`,
                color: colors.text,
                border: `1px solid ${colors.accent}`,
                "--tw-ring-color": colors.accent,
                "--tw-ring-offset-color": colors.background,
              }}
            >
              Explore Demo Flow
            </Link>
          </div>

          <p className="mt-4 text-sm" style={{ color: `${colors.text}ad` }}>
            Logging in helps us personalize your movie journey.
          </p>

          <div
            id="discovery-preview"
            className="mt-8 overflow-hidden rounded-2xl p-4"
            style={{
              backgroundColor: `${colors.secondary}70`,
              border: `1px solid ${colors.accent}40`,
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: colors.accent }}>
                  Demo Preview
                </p>
                <p className="mt-1 text-sm font-bold">Recommendation confidence</p>
              </div>
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: `${colors.background}d9`, color: colors.text }}
              >
                92% match
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {["Mood", "Genre", "History"].map((label, index) => (
                <div
                  key={label}
                  className="rounded-xl p-3"
                  style={{
                    backgroundColor: `${colors.background}d9`,
                    border: `1px solid ${colors.text}14`,
                  }}
                >
                  <p className="text-xs" style={{ color: `${colors.text}99` }}>
                    {label}
                  </p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full" style={{ backgroundColor: `${colors.text}1c` }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${index === 0 ? 86 : index === 1 ? 74 : 91}%`,
                        backgroundColor: index === 1 ? colors.accent : colors.primary,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div
            className="relative overflow-hidden rounded-3xl p-5 md:p-6"
            style={{
              background: `linear-gradient(145deg, ${colors.secondary}f2, ${colors.background})`,
              border: `1px solid ${colors.accent}55`,
              boxShadow: `0 24px 80px ${colors.primary}24`,
            }}
          >
            <div className="yoko-signal-pulse absolute right-8 top-8 h-24 w-24 rounded-full" style={{ border: `1px solid ${colors.accent}55` }} />
            <div className="relative h-48 overflow-hidden rounded-2xl md:h-56" style={{ backgroundColor: `${colors.background}d9` }}>
              <div className="yoko-film-drift absolute left-[-8%] top-12 flex w-[116%] rotate-[-8deg] gap-3">
                {Array.from({ length: 10 }).map((_, index) => (
                  <span
                    key={index}
                    className="h-24 flex-1 rounded-xl"
                    style={{
                      background: `linear-gradient(160deg, ${index % 2 === 0 ? colors.primary : colors.accent}, ${colors.secondary})`,
                      border: `6px solid ${colors.text}18`,
                      boxShadow: `0 12px 30px ${colors.primary}24`,
                    }}
                  />
                ))}
              </div>
              <div className="absolute inset-x-6 bottom-5 rounded-2xl p-4" style={{ backgroundColor: `${colors.background}e6`, border: `1px solid ${colors.text}18` }}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: colors.accent }}>
                      Intelligent Pick
                    </p>
                    <p className="mt-1 text-lg font-bold">Because you explored sci-fi thrillers</p>
                  </div>
                  <div className="h-12 w-12 shrink-0 rounded-full" style={{ background: `conic-gradient(${colors.accent}, ${colors.primary}, ${colors.secondary}, ${colors.accent})` }} />
                </div>
              </div>
            </div>
          </div>

          <div
            className="rounded-3xl p-6 md:p-7"
            style={{
              backgroundColor: `${colors.secondary}bf`,
              border: `1px solid ${colors.accent}55`,
            }}
          >
            <h3 className="text-xl font-bold md:text-2xl">Why YOKO feels effortless</h3>
            <div className="mt-5 space-y-4">
              {featureItems.map((item) => (
                <div
                  key={item.title}
                  className="grid gap-3 rounded-2xl p-4 text-sm sm:grid-cols-[auto_1fr] md:text-base"
                  style={{
                    backgroundColor: `${colors.background}d9`,
                    border: `1px solid ${colors.text}14`,
                  }}
                >
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${colors.primary}22`, color: colors.accent }}
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                      {item.icon}
                    </svg>
                  </span>
                  <div>
                    <h4 className="font-bold">{item.title}</h4>
                    <p className="mt-1 text-sm leading-relaxed" style={{ color: `${colors.text}b8` }}>
                      {item.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full px-3 py-1 text-xs font-semibold"
                          style={{ backgroundColor: `${colors.secondary}c9`, color: colors.text }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 mx-auto max-w-6xl px-6 pb-7 text-sm md:px-10" style={{ color: `${colors.text}a8` }}>
        Powered by TMDb API & Gemini AI for intelligent movie insights.
      </footer>
    </div>
  );
};

export default HomePage;
