"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  isDark: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [isDark, setIsDark] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  // Apply theme to DOM
  const applyTheme = (resolvedDark: boolean) => {
    setIsDark(resolvedDark);
    if (resolvedDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    setMounted(true);
    const storedTheme = (localStorage.getItem("theme") as Theme) || "system";
    setThemeState(storedTheme);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const resolveIsDark = (th: Theme) => {
      if (th === "dark") return true;
      if (th === "light") return false;
      return mediaQuery.matches;
    };

    applyTheme(resolveIsDark(storedTheme));

    const handleMediaChange = (e: MediaQueryListEvent) => {
      const currentStored = localStorage.getItem("theme") as Theme;
      if (!currentStored || currentStored === "system") {
        applyTheme(e.matches);
      }
    };

    mediaQuery.addEventListener("change", handleMediaChange);
    return () => mediaQuery.removeEventListener("change", handleMediaChange);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const resolvedDark =
      newTheme === "dark" || (newTheme === "system" && mediaQuery.matches);
    applyTheme(resolvedDark);
  };

  const toggleTheme = () => {
    const nextTheme = isDark ? "light" : "dark";
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
