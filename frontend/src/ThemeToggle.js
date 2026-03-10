import { useTheme } from "./ThemeContext";

export default function ThemeToggle({ showLabel = false, style = {} }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: showLabel ? "8px 16px" : "8px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        cursor: "pointer",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 13,
        fontWeight: 500,
        color: "var(--primary)",
        transition: "all .15s",
        ...style
      }}
    >
      {theme === "light" ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
      {showLabel && <span>{theme === "light" ? "Light Mode" : "Dark Mode"}</span>}
    </button>
  );
}