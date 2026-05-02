import React from "react";
import { NavLink } from "react-router-dom";

const DashboardNav = ({ colors, themeMode, onToggleTheme, ThemeSwitch, user, onLogout }) => {
  const navItems = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Discover", to: "/discover" },
    { label: "Watch History", to: "/history" },
    { label: "Profile", to: "/profile" },
    { label: "Favorites", to: "/favorites" },
  ];

  return (
    <header
      className="sticky top-0 z-20 border-b backdrop-blur-xl"
      style={{
        borderColor: `${colors.text}12`,
        backgroundColor: `${colors.background}f2`,
      }}
    >
      <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-4 md:px-8 lg:grid-cols-[minmax(180px,1fr)_auto_minmax(180px,1fr)] lg:items-center">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight leading-none">
            <span style={{ color: colors.primary }}>YO</span>
            <span style={{ color: colors.text }}>K</span>
            <span style={{ color: colors.accent }}>O</span>
          </h1>
          <p className="mt-1 truncate text-xs" style={{ color: `${colors.text}8f` }}>
            {user?.displayName || user?.email || "Movie Lover"}
          </p>
        </div>

        <nav
          className="flex min-w-0 items-center gap-1 overflow-x-auto rounded-full px-1 py-1"
          style={{
            backgroundColor: `${colors.secondary}42`,
            border: `1px solid ${colors.text}10`,
            scrollbarWidth: "none",
          }}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="relative whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition md:text-sm"
              style={({ isActive }) => ({
                backgroundColor: isActive ? `${colors.primary}f2` : "transparent",
                color: isActive ? "#ffffff" : `${colors.text}bd`,
                boxShadow: isActive ? `0 10px 24px ${colors.primary}24` : "none",
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center justify-start gap-3 lg:justify-end">
          <div className="scale-90">
            <ThemeSwitch themeMode={themeMode} onToggleTheme={onToggleTheme} colors={colors} />
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-full px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5"
            style={{
              backgroundColor: "transparent",
              color: `${colors.text}d6`,
              border: `1px solid ${colors.text}24`,
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default DashboardNav;
