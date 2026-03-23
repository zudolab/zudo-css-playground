export interface TokenGroup {
  id: string;
  label: string;
  type: "color" | "slider";
  tokens: {
    variable: string;
    label: string;
    defaultValue: string;
  }[];
  /** Slider-specific config — only used when type is "slider" */
  sliderConfig?: {
    unit: string;
    min: number;
    max: number;
    step: number;
  };
}

/**
 * Data-driven panel group definitions for the demo tweak panel.
 * Color groups render swatch pickers, slider groups render range inputs.
 */
export const demoPanelGroups: TokenGroup[] = [
  {
    id: "palette",
    label: "Palette Colors",
    type: "color",
    tokens: [
      {
        variable: "--accent",
        label: "Accent",
        defaultValue: "hsl(220 70% 50%)",
      },
      {
        variable: "--accent-hover",
        label: "Accent Hover",
        defaultValue: "hsl(220 70% 42%)",
      },
      {
        variable: "--fg",
        label: "Foreground",
        defaultValue: "hsl(220 25% 15%)",
      },
      {
        variable: "--fg-muted",
        label: "FG Muted",
        defaultValue: "hsl(220 10% 40%)",
      },
      {
        variable: "--bg",
        label: "Background",
        defaultValue: "hsl(0 0% 100%)",
      },
      {
        variable: "--bg-subtle",
        label: "BG Subtle",
        defaultValue: "hsl(220 15% 96%)",
      },
      {
        variable: "--border",
        label: "Border",
        defaultValue: "hsl(220 15% 85%)",
      },
    ],
  },
  {
    id: "status",
    label: "Status Colors",
    type: "color",
    tokens: [
      {
        variable: "--success",
        label: "Success",
        defaultValue: "hsl(142 71% 45%)",
      },
      {
        variable: "--danger",
        label: "Danger",
        defaultValue: "hsl(0 84% 60%)",
      },
      {
        variable: "--warning",
        label: "Warning",
        defaultValue: "hsl(45 93% 47%)",
      },
      {
        variable: "--info",
        label: "Info",
        defaultValue: "hsl(220 70% 50%)",
      },
    ],
  },
  {
    id: "typography",
    label: "Typography",
    type: "slider",
    tokens: [
      { variable: "--font-sm", label: "Font SM", defaultValue: "0.85" },
      { variable: "--font-md", label: "Font MD", defaultValue: "1" },
      { variable: "--font-lg", label: "Font LG", defaultValue: "1.1" },
    ],
    sliderConfig: { unit: "rem", min: 0.5, max: 3, step: 0.05 },
  },
  {
    id: "spacing",
    label: "Spacing",
    type: "slider",
    tokens: [
      { variable: "--space-xs", label: "Space XS", defaultValue: "8" },
      { variable: "--space-sm", label: "Space SM", defaultValue: "12" },
      { variable: "--space-md", label: "Space MD", defaultValue: "20" },
      { variable: "--space-lg", label: "Space LG", defaultValue: "32" },
    ],
    sliderConfig: { unit: "px", min: 0, max: 64, step: 1 },
  },
  {
    id: "decoration",
    label: "Decoration",
    type: "slider",
    tokens: [{ variable: "--radius", label: "Radius", defaultValue: "8" }],
    sliderConfig: { unit: "px", min: 0, max: 24, step: 1 },
  },
];

/** Get all color-type groups */
export function getColorGroups(): TokenGroup[] {
  return demoPanelGroups.filter((g) => g.type === "color");
}

/** Get all slider-type groups */
export function getSliderGroups(): TokenGroup[] {
  return demoPanelGroups.filter((g) => g.type === "slider");
}
