import { createContext, useContext, useState, useEffect, useCallback } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem("kk_theme");
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [loading, setLoading] = useState(false);

  const loadUserTheme = useCallback(async () => {
    const token = localStorage.getItem("kk_token");
    if (!token) return;

    try {
      const response = await fetch("http://localhost:8080/api/profile", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (response.ok) {
        const userData = await response.json();
        if (userData.theme && userData.theme !== theme) {
          setThemeState(userData.theme);
        }
      }
    } catch (error) {
      console.error("failed to load theme ", error);
    }
  }, []);

  useEffect(() => {
    loadUserTheme();
  }, [loadUserTheme]);

  const syncThemeToBackend = useCallback(async (newTheme) => {
    const token = localStorage.getItem("kk_token");
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch("http://localhost:8080/api/profile/theme", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ theme: newTheme })
      });

      if (!response.ok) {
        console.error("when it fails to sync ig");
      }
    } catch (error) {
      console.error("theme sync ", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("kk_theme", theme);
    
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute("content", theme === "dark" ? "#1a1a1a" : "#ffffff");
    }
  }, [theme]);

  const setTheme = async (newTheme) => {
    setThemeState(newTheme);
    await syncThemeToBackend(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme, 
      toggleTheme, 
      loading,
      isDark: theme === "dark",
      isLight: theme === "light"
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
