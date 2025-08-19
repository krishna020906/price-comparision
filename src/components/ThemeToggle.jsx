// src/components/ThemeToggle.jsx
"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    // read localStorage in initialiser if available
    if (typeof window === "undefined") return "dark";
    return localStorage.getItem("theme") || (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  });

  useEffect(() => {
    // apply class to html
    const root = document.documentElement;
    root.classList.remove("theme-dark", "theme-light");
    root.classList.add(theme === "light" ? "theme-light" : "theme-dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={() => setTheme(prev => prev === "light" ? "dark" : "light")}
        aria-label="Toggle theme"
        className="px-3 py-1 rounded-md border"
        style={{
          borderColor: "var(--border-soft)",
          background: "transparent",
          color: "var(--text-primary)",
        }}
      >
        {theme === "light" ? "🌞 Light" : "🌙 Dark"}
      </button>
    </div>
  );
}
