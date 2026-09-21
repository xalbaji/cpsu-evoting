import { useEffect, useRef, useState } from "react";
import { useAuth } from "../lib/auth-context";
import { applyTheme, getThemeAccountKey, readTheme, saveTheme, type Theme } from "../lib/theme";

const SunIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

const MoonIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="theme-settings-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
    <path d="m19.4 15 .1.1a2 2 0 0 1-2.8 2.8l-.1-.1a2 2 0 0 0-3.4 1.4v.2a2 2 0 0 1-4 0v-.2a2 2 0 0 0-3.4-1.4l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1A2 2 0 0 0 1.6 11H1.4a2 2 0 0 1 0-4h.2A2 2 0 0 0 3 3.6l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1A2 2 0 0 0 9.2 1.5v-.2a2 2 0 0 1 4 0v.2a2 2 0 0 0 3.4 1.4l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1A2 2 0 0 0 20.8 9h.2a2 2 0 0 1 0 4h-.2a2 2 0 0 0-1.4 2Z" />
  </svg>
);

export function ThemeSettings() {
  const { user } = useAuth();
  const accountKey = getThemeAccountKey(user);
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => readTheme(accountKey));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nextTheme = readTheme(accountKey);
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }, [accountKey]);

  /* Close on outside click */
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const apply = (t: Theme) => {
    setTheme(t);
    applyTheme(t);
    saveTheme(accountKey, t);
    setOpen(false);
  };

  return (
    <div className="theme-settings" ref={ref}>
      {open && (
        <div className="theme-settings-menu" role="menu" aria-label="Theme options">
          <button
            type="button"
            role="menuitem"
            className={theme === "light" ? "selected" : ""}
            onClick={() => apply("light")}
          >
            <SunIcon /> Light
          </button>
          <button
            type="button"
            role="menuitem"
            className={theme === "dark" ? "selected" : ""}
            onClick={() => apply("dark")}
          >
            <MoonIcon /> Dark
          </button>
        </div>
      )}
      <button
        type="button"
        className="theme-settings-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <SettingsIcon />
        Appearance
      </button>
    </div>
  );
}
