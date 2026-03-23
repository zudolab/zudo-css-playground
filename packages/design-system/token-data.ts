export interface DemoToken {
  variable: string;
  defaultValue: string;
  label: string;
  type: "color" | "length" | "shadow" | "composite";
}

export interface DemoTokenConfig {
  spacing: DemoToken[];
  colors: {
    palette: DemoToken[];
    status: DemoToken[];
  };
  typography: DemoToken[];
  etc: DemoToken[];
  decoration: DemoToken[];
}

/* ── Palette tokens (p0–p15) with oklch defaults ── */

export const paletteTokens = [
  { variable: "--cssp-0", defaultValue: "oklch(0.14 0.01 281)", label: "P0" },
  { variable: "--cssp-1", defaultValue: "oklch(0.73 0.14 11)", label: "P1" },
  { variable: "--cssp-2", defaultValue: "oklch(0.84 0.14 145)", label: "P2" },
  { variable: "--cssp-3", defaultValue: "oklch(0.91 0.09 88)", label: "P3" },
  { variable: "--cssp-4", defaultValue: "oklch(0.75 0.12 253)", label: "P4" },
  { variable: "--cssp-5", defaultValue: "oklch(0.83 0.10 338)", label: "P5" },
  { variable: "--cssp-6", defaultValue: "oklch(0.85 0.09 180)", label: "P6" },
  { variable: "--cssp-7", defaultValue: "oklch(0.87 0.03 265)", label: "P7" },
  { variable: "--cssp-8", defaultValue: "oklch(0.44 0.02 268)", label: "P8" },
  { variable: "--cssp-9", defaultValue: "oklch(0.73 0.14 11)", label: "P9" },
  {
    variable: "--cssp-10",
    defaultValue: "oklch(0.84 0.14 145)",
    label: "P10",
  },
  { variable: "--cssp-11", defaultValue: "oklch(0.91 0.09 88)", label: "P11" },
  {
    variable: "--cssp-12",
    defaultValue: "oklch(0.75 0.12 253)",
    label: "P12",
  },
  {
    variable: "--cssp-13",
    defaultValue: "oklch(0.83 0.10 338)",
    label: "P13",
  },
  {
    variable: "--cssp-14",
    defaultValue: "oklch(0.85 0.09 180)",
    label: "P14",
  },
  {
    variable: "--cssp-15",
    defaultValue: "oklch(0.80 0.03 265)",
    label: "P15",
  },
] as const;

/* ── Semantic tokens ── */

export const semanticTokens = [
  {
    variable: "--cssp-bg",
    defaultValue: "oklch(0.21 0.02 281)",
    label: "Background",
  },
  {
    variable: "--cssp-fg",
    defaultValue: "oklch(0.87 0.03 265)",
    label: "Foreground",
  },
  {
    variable: "--cssp-surface",
    defaultValue: "oklch(0.28 0.02 275)",
    label: "Surface",
  },
  {
    variable: "--cssp-muted",
    defaultValue: "oklch(0.52 0.02 265)",
    label: "Muted",
  },
  {
    variable: "--cssp-accent",
    defaultValue: "oklch(0.75 0.12 253)",
    label: "Accent",
  },
  {
    variable: "--cssp-accent-hover",
    defaultValue: "oklch(0.84 0.07 253)",
    label: "Accent Hover",
  },
  {
    variable: "--cssp-success",
    defaultValue: "oklch(0.84 0.14 145)",
    label: "Success",
  },
  {
    variable: "--cssp-danger",
    defaultValue: "oklch(0.73 0.14 11)",
    label: "Danger",
  },
  {
    variable: "--cssp-warning",
    defaultValue: "oklch(0.91 0.09 88)",
    label: "Warning",
  },
  {
    variable: "--cssp-info",
    defaultValue: "oklch(0.84 0.08 210)",
    label: "Info",
  },
] as const;

/* ── Spacing tokens ── */

export const spacingTokens = [
  {
    variable: "--spacing-hsp-2xs",
    defaultValue: "0.25rem",
    label: "HSP 2XS",
  },
  { variable: "--spacing-hsp-xs", defaultValue: "0.375rem", label: "HSP XS" },
  { variable: "--spacing-hsp-sm", defaultValue: "0.5rem", label: "HSP SM" },
  { variable: "--spacing-hsp-md", defaultValue: "0.75rem", label: "HSP MD" },
  { variable: "--spacing-hsp-lg", defaultValue: "1rem", label: "HSP LG" },
  { variable: "--spacing-hsp-xl", defaultValue: "1.5rem", label: "HSP XL" },
  { variable: "--spacing-hsp-2xl", defaultValue: "2rem", label: "HSP 2XL" },
  {
    variable: "--spacing-vsp-2xs",
    defaultValue: "0.25rem",
    label: "VSP 2XS",
  },
  { variable: "--spacing-vsp-xs", defaultValue: "0.5rem", label: "VSP XS" },
  { variable: "--spacing-vsp-sm", defaultValue: "0.75rem", label: "VSP SM" },
  { variable: "--spacing-vsp-md", defaultValue: "1rem", label: "VSP MD" },
  { variable: "--spacing-vsp-lg", defaultValue: "1.5rem", label: "VSP LG" },
  { variable: "--spacing-vsp-xl", defaultValue: "2rem", label: "VSP XL" },
  { variable: "--spacing-vsp-2xl", defaultValue: "3rem", label: "VSP 2XL" },
] as const;

/* ── Typography tokens ── */

export const typographyTokens = [
  { variable: "--text-caption", defaultValue: "0.75rem", label: "Caption" },
  { variable: "--text-small", defaultValue: "0.875rem", label: "Small" },
  { variable: "--text-body", defaultValue: "1rem", label: "Body" },
  {
    variable: "--text-subheading",
    defaultValue: "1.125rem",
    label: "Subheading",
  },
  { variable: "--text-heading", defaultValue: "1.875rem", label: "Heading" },
  { variable: "--text-display", defaultValue: "3.75rem", label: "Display" },
  {
    variable: "--font-weight-normal",
    defaultValue: "400",
    label: "Weight Normal",
  },
  {
    variable: "--font-weight-medium",
    defaultValue: "500",
    label: "Weight Medium",
  },
  {
    variable: "--font-weight-semibold",
    defaultValue: "600",
    label: "Weight Semibold",
  },
  {
    variable: "--font-weight-bold",
    defaultValue: "700",
    label: "Weight Bold",
  },
  { variable: "--leading-tight", defaultValue: "1.25", label: "Leading Tight" },
  { variable: "--leading-snug", defaultValue: "1.375", label: "Leading Snug" },
  {
    variable: "--leading-normal",
    defaultValue: "1.5",
    label: "Leading Normal",
  },
  {
    variable: "--leading-relaxed",
    defaultValue: "1.625",
    label: "Leading Relaxed",
  },
] as const;

/* ── Demo tokens (used inside iframe previews) ── */

export const demoTokenConfig: DemoTokenConfig = {
  spacing: [
    {
      variable: "--space-xs",
      defaultValue: "8px",
      label: "Space XS",
      type: "length",
    },
    {
      variable: "--space-sm",
      defaultValue: "12px",
      label: "Space SM",
      type: "length",
    },
    {
      variable: "--space-md",
      defaultValue: "20px",
      label: "Space MD",
      type: "length",
    },
    {
      variable: "--space-lg",
      defaultValue: "32px",
      label: "Space LG",
      type: "length",
    },
  ],
  colors: {
    palette: [
      {
        variable: "--accent",
        defaultValue: "hsl(220 70% 50%)",
        label: "Accent",
        type: "color",
      },
      {
        variable: "--accent-hover",
        defaultValue: "hsl(220 70% 42%)",
        label: "Accent Hover",
        type: "color",
      },
      {
        variable: "--fg",
        defaultValue: "hsl(220 25% 15%)",
        label: "Foreground",
        type: "color",
      },
      {
        variable: "--fg-muted",
        defaultValue: "hsl(220 10% 40%)",
        label: "Foreground Muted",
        type: "color",
      },
      {
        variable: "--bg",
        defaultValue: "hsl(0 0% 100%)",
        label: "Background",
        type: "color",
      },
      {
        variable: "--bg-subtle",
        defaultValue: "hsl(220 15% 96%)",
        label: "Background Subtle",
        type: "color",
      },
      {
        variable: "--border",
        defaultValue: "hsl(220 15% 85%)",
        label: "Border",
        type: "color",
      },
    ],
    status: [
      {
        variable: "--success",
        defaultValue: "hsl(142 71% 45%)",
        label: "Success",
        type: "color",
      },
      {
        variable: "--danger",
        defaultValue: "hsl(0 84% 60%)",
        label: "Danger",
        type: "color",
      },
      {
        variable: "--warning",
        defaultValue: "hsl(45 93% 47%)",
        label: "Warning",
        type: "color",
      },
      {
        variable: "--info",
        defaultValue: "hsl(220 70% 50%)",
        label: "Info",
        type: "color",
      },
    ],
  },
  typography: [
    {
      variable: "--font-sm",
      defaultValue: "0.85rem",
      label: "Font SM",
      type: "length",
    },
    {
      variable: "--font-md",
      defaultValue: "1rem",
      label: "Font MD",
      type: "length",
    },
    {
      variable: "--font-lg",
      defaultValue: "1.1rem",
      label: "Font LG",
      type: "length",
    },
  ],
  etc: [
    {
      variable: "--demo-padding",
      defaultValue: "16px",
      label: "Demo Padding",
      type: "length",
    },
  ],
  decoration: [
    {
      variable: "--radius",
      defaultValue: "8px",
      label: "Radius",
      type: "length",
    },
    {
      variable: "--shadow",
      defaultValue: "0 1px 3px hsl(220 25% 15% / 0.1)",
      label: "Shadow",
      type: "shadow",
    },
    {
      variable: "--shadow-strong",
      defaultValue: "0 4px 12px hsl(220 25% 15% / 0.15)",
      label: "Shadow Strong",
      type: "shadow",
    },
    {
      variable: "--focus-ring",
      defaultValue: "0 0 0 2px hsl(220 70% 50% / 0.25)",
      label: "Focus Ring",
      type: "shadow",
    },
  ],
};

export function getAllTokens(config: DemoTokenConfig): DemoToken[] {
  return [
    ...config.spacing,
    ...config.colors.palette,
    ...config.colors.status,
    ...config.typography,
    ...config.etc,
    ...config.decoration,
  ];
}

export function generateBaseTokensCss(
  overrides?: Record<string, string>,
): string {
  const tokens = getAllTokens(demoTokenConfig);
  const lines = tokens.map((token) => {
    const value = overrides?.[token.variable] ?? token.defaultValue;
    return `  ${token.variable}: ${value};`;
  });
  return `:root {\n${lines.join("\n")}\n}`;
}
