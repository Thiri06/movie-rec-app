import React from "react";
import { auth, provider } from "../firebase";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";

const createStrongPassword = () => {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const numbers = "23456789";
  const symbols = "!@#$%^&*?";
  const pool = upper + lower + numbers + symbols;
  let generated = "";

  generated += upper[Math.floor(Math.random() * upper.length)];
  generated += lower[Math.floor(Math.random() * lower.length)];
  generated += numbers[Math.floor(Math.random() * numbers.length)];
  generated += symbols[Math.floor(Math.random() * symbols.length)];

  for (let i = 0; i < 8; i += 1) {
    generated += pool[Math.floor(Math.random() * pool.length)];
  }

  return generated
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
};

const getPasswordStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) return { label: "Weak", level: 1 };
  if (score <= 4) return { label: "Medium", level: 2 };
  if (score <= 5) return { label: "Strong", level: 3 };
  return { label: "Very Strong", level: 4 };
};

const LoginPage = ({ colors, themeMode, onToggleTheme, ThemeSwitch }) => {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [formError, setFormError] = React.useState("");
  const [isSigningIn, setIsSigningIn] = React.useState(false);
  const [suggestedPassword, setSuggestedPassword] = React.useState(createStrongPassword());

  const strength = getPasswordStrength(password);
  const strengthBars = [
    strength.level >= 1,
    strength.level >= 2,
    strength.level >= 3,
    strength.level >= 4,
  ];

  const handleEmailPasswordLogin = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!email.trim() || !password.trim()) {
      setFormError("Please fill in both email and password.");
      return;
    }

    setIsSigningIn(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (error) {
      setFormError(error.message || "Email/password login failed.");
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    setFormError("");
    setIsSigningIn(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("User logged in:", user);
      navigate("/dashboard");
    } catch (error) {
      setFormError(error.message || "Google login failed.");
    } finally {
      setIsSigningIn(false);
    }
  };

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
        className="absolute -left-20 top-1/4 h-72 w-72 rounded-full blur-3xl"
        style={{ backgroundColor: `${colors.primary}40` }}
      />
      <div
        className="absolute -right-16 -top-12 h-72 w-72 rounded-full blur-3xl"
        style={{ backgroundColor: `${colors.accent}3d` }}
      />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6 md:px-10">
        <Link to="/" className="text-2xl font-bold tracking-tight">
          <span style={{ color: colors.primary }}>YO</span>
          <span style={{ color: colors.text }}>K</span>
          <span style={{ color: colors.accent }}>O</span>
        </Link>

        <ThemeSwitch themeMode={themeMode} onToggleTheme={onToggleTheme} colors={colors} />
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-88px)] max-w-6xl items-center px-6 pb-10 md:px-10">
        <div
          className="w-full rounded-3xl p-7 shadow-xl md:grid md:grid-cols-2 md:gap-8 md:p-10"
          style={{
            background: `linear-gradient(145deg, ${colors.background}, ${colors.secondary})`,
            border: `1px solid ${colors.accent}55`,
          }}
        >
          <section className="mb-8 md:mb-0 md:pr-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: colors.primary }}>
              Welcome back
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">
              Sign in and continue your movie journey
            </h2>
            <p className="mt-4 text-sm leading-relaxed md:text-base" style={{ color: `${colors.text}c9` }}>
              Secure Google authentication is enabled through Firebase. Once you log in, YOKO will guide you to your recommendation dashboard.
            </p>
          </section>

          <section className="rounded-2xl p-5 md:p-6" style={{ backgroundColor: `${colors.background}cc` }}>
            <h3 className="text-xl font-bold">Sign In</h3>
            <p className="mt-2 text-sm" style={{ color: `${colors.text}b3` }}>
              Choose login with email/password or continue with Google.
            </p>

            <form onSubmit={handleEmailPasswordLogin} className="mt-5 space-y-4">
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-semibold">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                  style={{
                    backgroundColor: colors.background,
                    color: colors.text,
                    border: `1px solid ${colors.secondary}`,
                  }}
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-semibold">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                  style={{
                    backgroundColor: colors.background,
                    color: colors.text,
                    border: `1px solid ${colors.secondary}`,
                  }}
                />

                <div className="mt-2 flex items-center gap-2">
                  {strengthBars.map((active, index) => (
                    <span
                      key={index}
                      className="h-1.5 flex-1 rounded-full"
                      style={{
                        backgroundColor: active ? colors.primary : `${colors.text}25`,
                      }}
                    />
                  ))}
                </div>
                <p className="mt-2 text-xs font-semibold" style={{ color: colors.accent }}>
                  Strength: {password ? strength.label : "Not entered"}
                </p>
                <p className="mt-1 text-xs" style={{ color: `${colors.text}b3` }}>
                  Suggested strong password: <span className="font-semibold">{suggestedPassword}</span>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setPassword(suggestedPassword);
                    setSuggestedPassword(createStrongPassword());
                  }}
                  className="mt-1 text-xs font-semibold underline decoration-2 underline-offset-4"
                  style={{ color: colors.accent }}
                >
                  Fill suggested password
                </button>
              </div>

              <button
                type="submit"
                disabled={isSigningIn}
                className="w-full rounded-xl px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: colors.primary, color: "#ffffff" }}
              >
                {isSigningIn ? "Signing In..." : "Sign in with Email"}
              </button>
            </form>

            <div className="my-4 flex items-center gap-3">
              <span className="h-px flex-1" style={{ backgroundColor: `${colors.text}30` }} />
              <span className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: `${colors.text}90` }}>
                or
              </span>
              <span className="h-px flex-1" style={{ backgroundColor: `${colors.text}30` }} />
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={isSigningIn}
              className="flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                backgroundColor: colors.secondary,
                color: colors.text,
                border: `1px solid ${colors.accent}`,
              }}
            >
              {isSigningIn ? "Please wait..." : "Sign in with Google"}
            </button>

            {formError ? (
              <p className="mt-3 text-xs font-semibold" style={{ color: "#d9534f" }}>
                {formError}
              </p>
            ) : null}

            <Link
              to="/"
              className="mt-4 inline-block text-sm font-semibold underline decoration-2 underline-offset-4"
              style={{ color: colors.accent }}
            >
              Back to Home
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
