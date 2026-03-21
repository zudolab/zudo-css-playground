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
  decoration: DemoToken[];
}

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
