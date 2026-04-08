import React, { useEffect, useMemo, useState } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import { auth } from "./firebase";

const themes = {
  light: {
    text: "#040316",
    background: "#fbfbfe",
    primary: "#2f27ce",
    secondary: "#dddbff",
    accent: "#443dff",
  },
  dark: {
    text: "#eae9fc",
    background: "#010104",
    primary: "#3a31d8",
    secondary: "#020024",
    accent: "#0600c2",
  },
};

const ThemeSwitch = ({ themeMode, onToggleTheme, colors }) => {
  const isDark = themeMode === "dark";

  return (
    <button
      onClick={onToggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="relative flex h-11 w-20 items-center rounded-full p-1 transition"
      style={{
        backgroundColor: colors.secondary,
        border: `1px solid ${colors.accent}`,
      }}
    >
      <span
        className="absolute left-3"
        style={{ color: isDark ? `${colors.text}70` : colors.primary }}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
          <path d="M12 18a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1Zm6.364-2.95.707.708a1 1 0 1 1-1.414 1.414l-.707-.707a1 1 0 1 1 1.414-1.414ZM5.636 15.05a1 1 0 0 1 1.414 1.414l-.707.707a1 1 0 1 1-1.414-1.414l.707-.707ZM12 6a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm8-1a1 1 0 1 1 0 2h-1a1 1 0 1 1 0-2h1ZM5 7a1 1 0 1 1 0 2H4a1 1 0 1 1 0-2h1Zm12.657-3.657a1 1 0 0 1 1.414 0l.707.707a1 1 0 0 1-1.414 1.414l-.707-.707a1 1 0 0 1 0-1.414ZM6.343 3.343a1 1 0 0 1 0 1.414l-.707.707A1 1 0 0 1 4.222 4.05l.707-.707a1 1 0 0 1 1.414 0ZM12 2a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1Z" />
        </svg>
      </span>
      <span
        className="absolute right-3"
        style={{ color: isDark ? colors.accent : `${colors.text}70` }}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
          <path d="M21.64 13.02A1 1 0 0 0 20.6 12a8 8 0 0 1-8.6-8.6 1 1 0 0 0-1.02-1.04A10 10 0 1 0 21.64 13.02Z" />
        </svg>
      </span>
      <span
        className={`h-8 w-8 rounded-full transition-transform duration-300 ${
          isDark ? "translate-x-10" : "translate-x-0"
        }`}
        style={{
          backgroundColor: isDark ? colors.accent : colors.primary,
          boxShadow: `0 0 0 2px ${colors.background}`,
        }}
      />
    </button>
  );
};

const AppLayout = ({ colors, themeMode, onToggleTheme, children }) => {
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: colors.background,
        color: colors.text,
        fontFamily: "Andika, sans-serif",
      }}
    >
      <header className="flex items-center justify-between px-6 py-5 md:px-10">
        <div className="text-2xl font-bold tracking-tight">
          <span style={{ color: colors.primary }}>YO</span>
          <span style={{ color: colors.text }}>K</span>
          <span style={{ color: colors.accent }}>O</span>
        </div>
        <ThemeSwitch themeMode={themeMode} onToggleTheme={onToggleTheme} colors={colors} />
      </header>

      <main className="mx-auto flex max-w-4xl flex-col items-center px-6 pb-10 pt-16 text-center md:pt-24">{children}</main>
    </div>
  );
};

const FeaturePlaceholder = ({ title, description, colors, themeMode, onToggleTheme }) => {
  return (
    <AppLayout colors={colors} themeMode={themeMode} onToggleTheme={onToggleTheme}>
      <h1 className="text-4xl font-bold md:text-5xl">{title}</h1>
      <p
        className="mt-4 max-w-2xl text-base leading-relaxed md:text-lg"
        style={{ color: `${colors.text}cc` }}
      >
        {description}
      </p>
    </AppLayout>
  );
};

const AuthLoadingScreen = ({ colors }) => {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{
        backgroundColor: colors.background,
        color: colors.text,
        fontFamily: "Andika, sans-serif",
      }}
    >
      <p className="text-base md:text-lg">Checking your session...</p>
    </div>
  );
};

const ProtectedRoute = ({ user, isAuthReady, children }) => {
  if (!isAuthReady) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicOnlyRoute = ({ user, isAuthReady, children }) => {
  if (!isAuthReady) {
    return null;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  const [themeMode, setThemeMode] = useState("dark");
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("yoko-theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      setThemeMode(savedTheme);
    } else {
      setThemeMode("dark");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("yoko-theme", themeMode);
    document.documentElement.style.colorScheme = themeMode;
  }, [themeMode]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });

    return unsubscribe;
  }, []);

  const colors = useMemo(() => themes[themeMode], [themeMode]);

  const handleToggleTheme = () => {
    setThemeMode((previousMode) => (previousMode === "light" ? "dark" : "light"));
  };

  if (!isAuthReady) {
    return <AuthLoadingScreen colors={colors} />;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              colors={colors}
              themeMode={themeMode}
              onToggleTheme={handleToggleTheme}
              ThemeSwitch={ThemeSwitch}
            />
          }
        />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute user={user} isAuthReady={isAuthReady}>
              <LoginPage
                colors={colors}
                themeMode={themeMode}
                onToggleTheme={handleToggleTheme}
                ThemeSwitch={ThemeSwitch}
              />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute user={user} isAuthReady={isAuthReady}>
              <DashboardPage
                colors={colors}
                themeMode={themeMode}
                onToggleTheme={handleToggleTheme}
                ThemeSwitch={ThemeSwitch}
                user={user}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute user={user} isAuthReady={isAuthReady}>
              <FeaturePlaceholder
                title="Watch History Coming Soon"
                description="Your watched and explored movies will appear here, ordered from newest to oldest for quick revisit."
                colors={colors}
                themeMode={themeMode}
                onToggleTheme={handleToggleTheme}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recommendations"
          element={
            <ProtectedRoute user={user} isAuthReady={isAuthReady}>
              <FeaturePlaceholder
                title="Recommendations Coming Soon"
                description="Personalized picks generated from your behavior and preferred genres will be shown on this page."
                colors={colors}
                themeMode={themeMode}
                onToggleTheme={handleToggleTheme}
              />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
