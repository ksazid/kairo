"use client";

import { useEffect, useState } from "react";
import { KairoIcon } from "./kairo-icons";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = localStorage.getItem("kairo-theme");
    const resolved: Theme = saved === "dark"
      ? "dark"
      : saved === "light"
        ? "light"
        : matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";

    setTheme(resolved);
    localStorage.setItem("kairo-theme", resolved);
    applyTheme(resolved);
  }, []);

  function choose(next: Theme) {
    setTheme(next);
    localStorage.setItem("kairo-theme", next);
    applyTheme(next);
  }

  return (
    <div className="k-shell-theme-toggle" role="group" aria-label="Colour theme">
      <button
        type="button"
        className={theme === "light" ? "active" : ""}
        aria-pressed={theme === "light"}
        onClick={() => choose("light")}
        title="Light theme"
      >
        <KairoIcon name="sun" />
        <span className="sr-only">Light theme</span>
      </button>
      <button
        type="button"
        className={theme === "dark" ? "active" : ""}
        aria-pressed={theme === "dark"}
        onClick={() => choose("dark")}
        title="Dark theme"
      >
        <KairoIcon name="moon" />
        <span className="sr-only">Dark theme</span>
      </button>
    </div>
  );
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}
