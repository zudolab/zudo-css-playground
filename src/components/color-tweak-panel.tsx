import { useState, useEffect, useRef, useCallback } from "react";
import HslPicker from "./hsl-picker";
import PaletteSelector from "./palette-selector";
import { useDraggable } from "../hooks/use-draggable";

interface TweakState {
  palette: string[];
  semanticMappings: Record<string, number>;
}

const DEFAULT_PRESET = "Default Dark";
// Derived from the default preset to avoid duplication
const DEFAULT_SEMANTIC_MAPPINGS: Record<string, number> = {
  bg: 9, fg: 15, surface: 0, muted: 8, accent: 12,
  accentHover: 14, success: 2, danger: 1, warning: 3, info: 4,
};

interface PresetDef {
  palette: string[];
  semanticMappings: Record<string, number>;
}

const PRESETS: Record<string, PresetDef> = {
  "Default Dark": {
    palette: [
      "#1c1c1c",
      "#da6871",
      "#93bb77",
      "#dfbb77",
      "#5caae9",
      "#c074d6",
      "#90a1b9",
      "#a0a0a0",
      "#888888",
      "#181818",
      "#383838",
      "#e0e0e0",
      "#d69a66",
      "#c074d6",
      "#a7c0e3",
      "#b8b8b8",
    ],
    semanticMappings: {
      bg: 9,
      fg: 15,
      surface: 0,
      muted: 8,
      accent: 12,
      accentHover: 14,
      success: 2,
      danger: 1,
      warning: 3,
      info: 4,
    },
  },
  "Default Light": {
    palette: [
      "#303030",
      "#dd3131",
      "#266538",
      "#a83838",
      "#3277c8",
      "#a35e0f",
      "#90a1b9",
      "#7a5218",
      "#6b6b6b",
      "#e2ddda",
      "#ece9e9",
      "#303030",
      "#5b99dc",
      "#b89ee7",
      "#8590a0",
      "#654516",
    ],
    semanticMappings: {
      bg: 9,
      fg: 11,
      surface: 10,
      muted: 8,
      accent: 5,
      accentHover: 14,
      success: 2,
      danger: 1,
      warning: 3,
      info: 4,
    },
  },
};

const STORAGE_KEY = "cssp-tweak-state";
const PRESET_KEY = "cssp-tweak-preset";

const SEMANTIC_FIELDS: {
  key: string;
  label: string;
  cssVar: string;
}[] = [
  { key: "bg", label: "BG", cssVar: "--cssp-bg" },
  { key: "fg", label: "FG", cssVar: "--cssp-fg" },
  { key: "surface", label: "Surface", cssVar: "--cssp-surface" },
  { key: "muted", label: "Muted", cssVar: "--cssp-muted" },
  { key: "accent", label: "Accent", cssVar: "--cssp-accent" },
  { key: "accentHover", label: "Acc Hover", cssVar: "--cssp-accent-hover" },
  { key: "success", label: "Success", cssVar: "--cssp-success" },
  { key: "danger", label: "Danger", cssVar: "--cssp-danger" },
  { key: "warning", label: "Warning", cssVar: "--cssp-warning" },
  { key: "info", label: "Info", cssVar: "--cssp-info" },
];

const BASE_FIELDS = SEMANTIC_FIELDS.filter(
  (f) => f.key === "bg" || f.key === "fg",
);
const TOKEN_FIELDS = SEMANTIC_FIELDS.filter(
  (f) => f.key !== "bg" && f.key !== "fg",
);

const PANEL_WIDTH = 420;

function loadState(): { state: TweakState; preset: string } {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const rawPreset = localStorage.getItem(PRESET_KEY) || DEFAULT_PRESET;
    const preset = rawPreset in PRESETS ? rawPreset : DEFAULT_PRESET;
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migration: convert old format (individual semantic keys) to new format
      if (parsed.palette && !parsed.semanticMappings) {
        const mappings = { ...DEFAULT_SEMANTIC_MAPPINGS };
        return {
          state: { palette: parsed.palette, semanticMappings: mappings },
          preset,
        };
      }
      return { state: parsed, preset };
    }
  } catch {
    // ignore
  }
  return {
    state: {
      palette: [...PRESETS[DEFAULT_PRESET].palette],
      semanticMappings: { ...PRESETS[DEFAULT_PRESET].semanticMappings },
    },
    preset: DEFAULT_PRESET,
  };
}

function applyToDocument(state: TweakState) {
  const el = document.documentElement;
  state.palette.forEach((color, i) => {
    el.style.setProperty(`--cssp-${i}`, color);
  });
  SEMANTIC_FIELDS.forEach(({ key, cssVar }) => {
    const paletteIndex =
      state.semanticMappings[key] ?? DEFAULT_SEMANTIC_MAPPINGS[key] ?? 0;
    el.style.setProperty(cssVar, state.palette[paletteIndex] ?? "#000000");
  });
}

function loadInitial() {
  const { state, preset } = loadState();
  return { state, preset };
}

// --- Palette swatch with HSL picker ---

function PaletteSwatch({
  color,
  index,
  onChange,
  mutedColor,
}: {
  color: string;
  index: number;
  onChange: (hex: string) => void;
  mutedColor: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const handleClose = useCallback(() => setIsOpen(false), []);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title={`p${index}: ${color}`}
        style={{
          width: "3rem",
          height: "3rem",
          backgroundColor: color,
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 4,
          cursor: "pointer",
          padding: 0,
        }}
      />
      {isOpen && (
        <HslPicker
          color={color}
          onChange={onChange}
          onClose={handleClose}
          anchorEl={buttonRef.current}
        />
      )}
      <span style={{ fontSize: 10, color: mutedColor, lineHeight: 1 }}>
        p{index}
      </span>
    </div>
  );
}

// --- Main Panel ---

export default function ColorTweakPanel() {
  const [initial] = useState(loadInitial);
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<TweakState>(initial.state);
  const [preset, setPreset] = useState(initial.preset);
  const panelRef = useRef<HTMLDivElement>(null);
  const { position, onMouseDown, recenter } = useDraggable(PANEL_WIDTH);

  // Re-center panel each time it opens
  useEffect(() => {
    if (open) {
      recenter();
    }
  }, [open, recenter]);

  // Apply colors on mount and state change
  useEffect(() => {
    applyToDocument(state);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  const updatePalette = (index: number, color: string) => {
    setState((prev) => {
      const palette = [...prev.palette];
      palette[index] = color;
      return { ...prev, palette };
    });
  };

  const updateSemanticMapping = (key: string, paletteIndex: number) => {
    setState((prev) => ({
      ...prev,
      semanticMappings: { ...prev.semanticMappings, [key]: paletteIndex },
    }));
  };

  const applyPreset = (name: string) => {
    const p = PRESETS[name];
    if (!p) return;
    setPreset(name);
    setState({
      palette: [...p.palette],
      semanticMappings: { ...p.semanticMappings },
    });
    try {
      localStorage.setItem(PRESET_KEY, name);
    } catch {
      // ignore
    }
  };

  const resetToPreset = () => {
    applyPreset(preset);
  };

  // Derive colors for panel styling from current state
  const bgColor = state.palette[state.semanticMappings.bg ?? 9] ?? "#181818";
  const fgColor = state.palette[state.semanticMappings.fg ?? 15] ?? "#b8b8b8";
  const surfaceColor =
    state.palette[state.semanticMappings.surface ?? 0] ?? "#1c1c1c";
  const mutedColor =
    state.palette[state.semanticMappings.muted ?? 8] ?? "#888888";

  // Toggle button (always visible)
  const toggleButton = (
    <button
      onClick={() => setOpen((o) => !o)}
      style={{
        position: "fixed",
        top: 12,
        right: 12,
        zIndex: 10000,
        width: 36,
        height: 36,
        borderRadius: "50%",
        border: "2px solid rgba(255,255,255,0.15)",
        background:
          "linear-gradient(135deg, #5caae9 0%, #c074d6 50%, #93bb77 100%)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 16,
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        padding: 0,
      }}
      title="Toggle Color Tweak Panel"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#181818"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="8" r="2" fill="#181818" />
        <circle cx="8" cy="14" r="2" fill="#181818" />
        <circle cx="16" cy="14" r="2" fill="#181818" />
      </svg>
    </button>
  );

  if (!open) return toggleButton;

  const sectionHeadingStyle: React.CSSProperties = {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: mutedColor,
    marginBottom: 6,
    fontWeight: 600,
  };

  return (
    <>
      {toggleButton}
      <div
        ref={panelRef}
        style={{
          position: "fixed",
          left: position.x,
          top: position.y,
          zIndex: 9999,
          width: PANEL_WIDTH,
          maxHeight: "calc(100vh - 32px)",
          overflowY: "auto",
          background: surfaceColor,
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          fontFamily: "system-ui, sans-serif",
          fontSize: 12,
          color: fgColor,
        }}
      >
        {/* Title bar (draggable) */}
        <div
          onMouseDown={onMouseDown}
          aria-label="Drag to move Color Tweak panel"
          style={{
            padding: "8px 12px",
            cursor: "grab",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            userSelect: "none",
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 13 }}>Color Tweak</span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              color: mutedColor,
              cursor: "pointer",
              fontSize: 16,
              lineHeight: 1,
              padding: "0 2px",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: "8px 12px" }}>
          {/* Preset + Reset row */}
          <div
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 10,
              alignItems: "center",
            }}
          >
            <select
              value={preset}
              onChange={(e) => applyPreset(e.target.value)}
              style={{
                flex: 1,
                background: bgColor,
                color: fgColor,
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 4,
                padding: "3px 6px",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              {Object.keys(PRESETS).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <button
              onClick={resetToPreset}
              style={{
                background: bgColor,
                color: mutedColor,
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 4,
                padding: "3px 8px",
                fontSize: 11,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Reset
            </button>
          </div>

          {/* Section 1: PALETTE (p0-p15) */}
          <div style={{ marginBottom: 12 }}>
            <div style={sectionHeadingStyle}>Palette (p0-p15)</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(8, 1fr)",
                gap: 4,
              }}
            >
              {state.palette.map((color, i) => (
                <PaletteSwatch
                  key={i}
                  color={color}
                  index={i}
                  onChange={(hex) => updatePalette(i, hex)}
                  mutedColor={mutedColor}
                />
              ))}
            </div>
          </div>

          {/* Section 2: BASE (bg, fg) */}
          <div style={{ marginBottom: 12 }}>
            <div style={sectionHeadingStyle}>Base</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 6,
              }}
            >
              {BASE_FIELDS.map(({ key, label }) => (
                <PaletteSelector
                  key={key}
                  label={label}
                  value={
                    state.semanticMappings[key] ??
                    DEFAULT_SEMANTIC_MAPPINGS[key] ??
                    0
                  }
                  palette={state.palette}
                  onChange={(index) => updateSemanticMapping(key, index)}
                />
              ))}
            </div>
          </div>

          {/* Section 3: SEMANTIC TOKENS */}
          <div>
            <div style={sectionHeadingStyle}>Semantic Tokens</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 6,
              }}
            >
              {TOKEN_FIELDS.map(({ key, label }) => (
                <PaletteSelector
                  key={key}
                  label={label}
                  value={
                    state.semanticMappings[key] ??
                    DEFAULT_SEMANTIC_MAPPINGS[key] ??
                    0
                  }
                  palette={state.palette}
                  onChange={(index) => updateSemanticMapping(key, index)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
