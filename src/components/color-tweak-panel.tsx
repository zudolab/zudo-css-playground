import { useState, useEffect, useRef, useCallback } from "react";

interface TweakState {
  palette: string[];
  bg: string;
  fg: string;
  surface: string;
  muted: string;
  accent: string;
  accentHover: string;
  success: string;
  danger: string;
  warning: string;
  info: string;
}

const PRESETS: Record<string, TweakState> = {
  "Catppuccin Mocha": {
    palette: [
      "#11111b", "#f38ba8", "#a6e3a1", "#f9e2af",
      "#89b4fa", "#f5c2e7", "#94e2d5", "#cdd6f4",
      "#585b70", "#f38ba8", "#a6e3a1", "#f9e2af",
      "#89b4fa", "#f5c2e7", "#94e2d5", "#bac2de",
    ],
    bg: "#1e1e2e", fg: "#cdd6f4", surface: "#313244", muted: "#6c7086",
    accent: "#89b4fa", accentHover: "#b4d0fb",
    success: "#a6e3a1", danger: "#f38ba8", warning: "#f9e2af", info: "#89dceb",
  },
  Dracula: {
    palette: [
      "#21222c", "#ff5555", "#50fa7b", "#f1fa8c",
      "#bd93f9", "#ff79c6", "#8be9fd", "#f8f8f2",
      "#6272a4", "#ff6e6e", "#69ff94", "#ffffa5",
      "#d6acff", "#ff92df", "#a4ffff", "#ffffff",
    ],
    bg: "#282a36", fg: "#f8f8f2", surface: "#21222c", muted: "#86878b",
    accent: "#8be9fd", accentHover: "#a4ffff",
    success: "#50fa7b", danger: "#ff5555", warning: "#f1fa8c", info: "#bd93f9",
  },
  Nord: {
    palette: [
      "#2e3440", "#bf616a", "#a3be8c", "#ebcb8b",
      "#81a1c1", "#b48ead", "#88c0d0", "#e5e9f0",
      "#4c566a", "#bf616a", "#a3be8c", "#ebcb8b",
      "#81a1c1", "#b48ead", "#88c0d0", "#eceff4",
    ],
    bg: "#2e3440", fg: "#d8dee9", surface: "#3b4252", muted: "#616e88",
    accent: "#88c0d0", accentHover: "#8fbcbb",
    success: "#a3be8c", danger: "#bf616a", warning: "#ebcb8b", info: "#81a1c1",
  },
};

const STORAGE_KEY = "cssp-tweak-state";
const POSITION_KEY = "cssp-tweak-position";
const PRESET_KEY = "cssp-tweak-preset";

const SEMANTIC_FIELDS: { key: keyof Omit<TweakState, "palette">; label: string; cssVar: string }[] = [
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

function loadState(): { state: TweakState; preset: string } {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const preset = localStorage.getItem(PRESET_KEY) || "Catppuccin Mocha";
    if (saved) {
      return { state: JSON.parse(saved), preset };
    }
  } catch {
    // ignore
  }
  return { state: { ...PRESETS["Catppuccin Mocha"] }, preset: "Catppuccin Mocha" };
}

function loadPosition(): { x: number; y: number } {
  try {
    const saved = localStorage.getItem(POSITION_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return { x: -1, y: -1 };
}

function applyToDocument(state: TweakState) {
  const el = document.documentElement;
  state.palette.forEach((color, i) => {
    el.style.setProperty(`--cssp-${i}`, color);
  });
  SEMANTIC_FIELDS.forEach(({ key, cssVar }) => {
    el.style.setProperty(cssVar, state[key]);
  });
}

function loadInitial() {
  const { state, preset } = loadState();
  return { state, preset, position: loadPosition() };
}

export default function ColorTweakPanel() {
  const [initial] = useState(loadInitial);
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<TweakState>(initial.state);
  const [preset, setPreset] = useState(initial.preset);
  const [position, setPosition] = useState(initial.position);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Initialize position on first render
  useEffect(() => {
    if (position.x === -1 && position.y === -1) {
      setPosition({ x: window.innerWidth - 300, y: 16 });
    }
  }, [position.x, position.y]);

  // Apply colors on mount and state change
  useEffect(() => {
    applyToDocument(state);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  // Persist position
  useEffect(() => {
    if (position.x === -1) return;
    try {
      localStorage.setItem(POSITION_KEY, JSON.stringify(position));
    } catch {
      // ignore
    }
  }, [position]);

  // Drag handlers — only attach mousemove/mouseup during active drag
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      dragging.current = true;
      dragOffset.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
      e.preventDefault();

      const onMouseMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        setPosition({
          x: Math.max(0, Math.min(ev.clientX - dragOffset.current.x, window.innerWidth - 280)),
          y: Math.max(0, Math.min(ev.clientY - dragOffset.current.y, window.innerHeight - 100)),
        });
      };
      const onMouseUp = () => {
        dragging.current = false;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [position],
  );

  const updatePalette = (index: number, color: string) => {
    setState((prev) => {
      const palette = [...prev.palette];
      palette[index] = color;
      return { ...prev, palette };
    });
  };

  const updateSemantic = (key: keyof Omit<TweakState, "palette">, color: string) => {
    setState((prev) => ({ ...prev, [key]: color }));
  };

  const applyPreset = (name: string) => {
    const p = PRESETS[name];
    if (!p) return;
    setPreset(name);
    setState({ ...p });
    try {
      localStorage.setItem(PRESET_KEY, name);
    } catch {
      // ignore
    }
  };

  const resetToPreset = () => {
    applyPreset(preset);
  };

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
        background: "linear-gradient(135deg, #89b4fa 0%, #f5c2e7 50%, #a6e3a1 100%)",
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
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e1e2e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="8" r="2" fill="#1e1e2e" />
        <circle cx="8" cy="14" r="2" fill="#1e1e2e" />
        <circle cx="16" cy="14" r="2" fill="#1e1e2e" />
      </svg>
    </button>
  );

  if (!open) return toggleButton;

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
          width: 280,
          maxHeight: "calc(100vh - 32px)",
          overflowY: "auto",
          background: state.surface,
          border: `1px solid rgba(255,255,255,0.1)`,
          borderRadius: 8,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          fontFamily: "system-ui, sans-serif",
          fontSize: 12,
          color: state.fg,
        }}
      >
        {/* Title bar (draggable) */}
        <div
          onMouseDown={onMouseDown}
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
              color: state.muted,
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
          <div style={{ display: "flex", gap: 6, marginBottom: 10, alignItems: "center" }}>
            <select
              value={preset}
              onChange={(e) => applyPreset(e.target.value)}
              style={{
                flex: 1,
                background: state.bg,
                color: state.fg,
                border: `1px solid rgba(255,255,255,0.1)`,
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
                background: state.bg,
                color: state.muted,
                border: `1px solid rgba(255,255,255,0.1)`,
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

          {/* Palette section */}
          <div style={{ marginBottom: 10 }}>
            <div
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: state.muted,
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              Palette (p0–p15)
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 4,
              }}
            >
              {state.palette.map((color, i) => (
                <label
                  key={i}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => updatePalette(i, e.target.value)}
                    style={{
                      width: 24,
                      height: 24,
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 3,
                      padding: 0,
                      cursor: "pointer",
                      background: "none",
                    }}
                  />
                  <span style={{ fontSize: 9, color: state.muted }}>p{i}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Semantic section */}
          <div>
            <div
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: state.muted,
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              Semantic
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 4,
              }}
            >
              {SEMANTIC_FIELDS.map(({ key, label }) => (
                <label
                  key={key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <input
                    type="color"
                    value={state[key]}
                    onChange={(e) => updateSemantic(key, e.target.value)}
                    style={{
                      width: 24,
                      height: 24,
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 3,
                      padding: 0,
                      cursor: "pointer",
                      background: "none",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 11, color: state.muted }}>{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
