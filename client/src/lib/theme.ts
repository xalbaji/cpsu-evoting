export type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "cpsu-theme-by-account";

export interface ThemeAccount {
  _id?: string;
  id?: string;
  email?: string;
}

export function getThemeAccountKey(account?: ThemeAccount | null): string {
  return account?._id
    ?? account?.id
    ?? account?.email?.trim().toLowerCase()
    ?? "guest";
}

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

function readPreferences(): Record<string, Theme> {
  if (typeof window === "undefined") return {};

  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(THEME_STORAGE_KEY) ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) => isTheme(value)),
    ) as Record<string, Theme>;
  } catch {
    return {};
  }
}

export function readTheme(accountKey: string): Theme {
  return readPreferences()[accountKey] ?? "light";
}

export function saveTheme(accountKey: string, theme: Theme) {
  if (typeof window === "undefined") return;

  const preferences = readPreferences();
  preferences[accountKey] = theme;
  window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(preferences));
}

export function applyTheme(theme: Theme) {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = theme;
  }
}
