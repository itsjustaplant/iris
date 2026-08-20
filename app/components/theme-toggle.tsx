import { Moon, Sun } from "@phosphor-icons/react";
import { useSyncExternalStore } from "react";

import { Button } from "~/components/ui/button";

type Theme = "light" | "dark";

const themeChangeEvent = "iris-theme-change";

function subscribeToTheme(onStoreChange: () => void) {
  window.addEventListener(themeChangeEvent, onStoreChange);
  return () => window.removeEventListener(themeChangeEvent, onStoreChange);
}

function getTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
  window.dispatchEvent(new Event(themeChangeEvent));
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeToTheme, getTheme, () => "light");

  function selectTheme(nextTheme: Theme) {
    applyTheme(nextTheme);
    localStorage.setItem("iris-theme", nextTheme);
  }

  return (
    <div
      aria-label="Color theme"
      className="flex shrink-0 items-center border border-border bg-secondary/70 p-0.5"
      role="group"
    >
      <Button
        aria-pressed={theme === "light"}
        className="h-7 gap-1.5 px-2"
        onClick={() => selectTheme("light")}
        size="sm"
        type="button"
        variant={theme === "light" ? "default" : "ghost"}
      >
        <Sun weight="bold" />
        <span className="hidden sm:inline">Light</span>
      </Button>
      <Button
        aria-pressed={theme === "dark"}
        className="h-7 gap-1.5 px-2"
        onClick={() => selectTheme("dark")}
        size="sm"
        type="button"
        variant={theme === "dark" ? "default" : "ghost"}
      >
        <Moon weight="bold" />
        <span className="hidden sm:inline">Dark</span>
      </Button>
    </div>
  );
}
