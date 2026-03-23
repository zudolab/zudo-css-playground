const CSS_STYLE_KEY = "cssp-settings-css-style";
const SHIKI_THEME_KEY = "cssp-settings-shiki-theme";

export type CssStyle = "tailwind" | "general";

export const SHIKI_THEMES = [
  "vitesse-dark",
  "vitesse-light",
  "catppuccin-mocha",
  "catppuccin-latte",
  "dracula",
  "github-dark",
  "github-light",
  "nord",
  "one-dark-pro",
  "solarized-dark",
  "solarized-light",
  "tokyo-night",
  "min-dark",
  "min-light",
] as const;

export type ShikiTheme = (typeof SHIKI_THEMES)[number];

export function getCssStyle(): CssStyle {
  const saved =
    typeof window !== "undefined" ? localStorage.getItem(CSS_STYLE_KEY) : null;
  return saved === "general" ? "general" : "tailwind";
}

export function setCssStyle(style: CssStyle): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(CSS_STYLE_KEY, style);
  }
}

export function getShikiTheme(): ShikiTheme {
  const saved =
    typeof window !== "undefined"
      ? localStorage.getItem(SHIKI_THEME_KEY)
      : null;
  if (saved && (SHIKI_THEMES as readonly string[]).includes(saved)) {
    return saved as ShikiTheme;
  }
  return "vitesse-dark";
}

export function setShikiTheme(theme: ShikiTheme): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(SHIKI_THEME_KEY, theme);
    // Notify components to re-highlight
    window.dispatchEvent(new Event("cssp-shiki-theme-change"));
  }
}
