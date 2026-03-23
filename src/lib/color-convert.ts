export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function hslToCssString(h: number, s: number, l: number): string {
  return `hsl(${h} ${s}% ${l}%)`;
}

/**
 * Convert hex color to oklch components.
 * Uses the sRGB → linear-sRGB → LMS → LMS' → Oklab → Oklch pipeline.
 */
export function hexToOklch(hex: string): { l: number; c: number; h: number } {
  // Parse hex to linear sRGB
  const srgbToLinear = (v: number) =>
    v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);

  const r = srgbToLinear(parseInt(hex.slice(1, 3), 16) / 255);
  const g = srgbToLinear(parseInt(hex.slice(3, 5), 16) / 255);
  const b = srgbToLinear(parseInt(hex.slice(5, 7), 16) / 255);

  // Linear sRGB → LMS (M1)
  const lms_l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const lms_m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const lms_s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  // LMS → LMS' (non-linear, cube root)
  const l_ = Math.cbrt(lms_l);
  const m_ = Math.cbrt(lms_m);
  const s_ = Math.cbrt(lms_s);

  // LMS' → Oklab (M2)
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bLab = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  // Oklab → Oklch
  const C = Math.sqrt(a * a + bLab * bLab);
  let H = (Math.atan2(bLab, a) * 180) / Math.PI;
  if (H < 0) H += 360;

  return {
    l: Math.round(L * 100) / 100,
    c: Math.round(C * 100) / 100,
    h: Math.round(H),
  };
}

export function oklchToCss(l: number, c: number, h: number): string {
  return `oklch(${l} ${c} ${h})`;
}
