const CSS_STYLE_KEY = "cssp-settings-css-style";
export type CssStyle = "tailwind" | "general";

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
