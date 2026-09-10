import { useEffect, useState } from "react";

type Theme = "light" | "dark";
const THEME_STORAGE_KEY = "cpsu-theme";

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="theme-settings-icon">
      <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
      <path d="m19.4 15 .1.1a2 2 0 0 1-2.8 2.8l-.1-.1a2 2 0 0 0-3.4 1.4v.2a2 2 0 0 1-4 0v-.2a2 2 0 0 0-3.4-1.4l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1A2 2 0 0 0 1.6 11H1.4a2 2 0 0 1 0-4h.2A2 2 0 0 0 3 3.6l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1A2 2 0 0 0 9.2 1.5v-.2a2 2 0 0 1 4 0v.2a2 2 0 0 0 3.4 1.4l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1A2 2 0 0 0 20.8 9h.2a2 2 0 0 1 0 4h-.2a2 2 0 0 0-1.4 2Z" />
    </svg>
  );
}

export function ThemeSettings() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    return window.localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  return (
    <div className="theme-settings">
      {open && (
        <div className="theme-settings-menu" role="menu" aria-label="Theme options">
          <button type="button" className={theme === "light" ? "selected" : ""} onClick={() => setTheme("light")}>
            <span aria-hidden="true">☀</span> Light
          </button>
          <button type="button" className={theme === "dark" ? "selected" : ""} onClick={() => setTheme("dark")}>
            <span aria-hidden="true">☾</span> Dark
          </button>
        </div>
      )}
      <button type="button" className="theme-settings-trigger" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((value) => !value)}>
        <SettingsIcon /> Settings
      </button>
    </div>
  );
}
