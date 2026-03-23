import { useState, useEffect, useRef } from "react";
import {
  setGlobalOverrides,
  resetGlobalOverrides,
} from "../lib/iframe-registry";
import {
  demoPanelGroups,
  getColorGroups,
  getSliderGroups,
} from "../lib/token-panel-config";
import { hexToHsl, hslToHex, hslToCssString } from "../lib/color-convert";
import HslPicker from "./hsl-picker";
import { useDraggable } from "../hooks/use-draggable";

type Tab = "color" | "typography" | "spacing";

interface DemoTweakState {
  colors: Record<string, string>;
  sliders: Record<string, string>;
}

const STORAGE_KEY = "demo-tweak-state";

function hslStringToHex(hslStr: string): string {
  const match = hslStr.match(/hsl\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*\)/);
  if (match) {
    return hslToHex(
      Math.round(Number(match[1])),
      Math.round(Number(match[2])),
      Math.round(Number(match[3])),
    );
  }
  return "#888888";
}

function buildDefaults(): DemoTweakState {
  const colors: Record<string, string> = {};
  const sliders: Record<string, string> = {};
  for (const group of demoPanelGroups) {
    if (group.type === "color") {
      for (const token of group.tokens) {
        colors[token.variable] = hslStringToHex(token.defaultValue);
      }
    } else {
      for (const token of group.tokens) {
        sliders[token.variable] = parseFloat(token.defaultValue).toString();
      }
    }
  }
  return { colors, sliders };
}

/** Migrate old state shape (typography+spacing) to new (sliders) */
function migrateState(saved: Record<string, unknown>): DemoTweakState {
  if ("sliders" in saved && typeof saved.sliders === "object") {
    return saved as unknown as DemoTweakState;
  }
  const defaults = buildDefaults();
  const colors =
    typeof saved.colors === "object" && saved.colors
      ? (saved.colors as Record<string, string>)
      : defaults.colors;
  const sliders = { ...defaults.sliders };
  for (const key of ["typography", "spacing"] as const) {
    if (typeof saved[key] === "object" && saved[key]) {
      Object.assign(sliders, saved[key]);
    }
  }
  return { colors, sliders };
}

function loadState(): DemoTweakState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return migrateState(JSON.parse(saved));
  } catch {
    // ignore
  }
  return buildDefaults();
}

function stateToOverrides(state: DemoTweakState): Record<string, string> {
  const overrides: Record<string, string> = {};
  for (const [variable, hex] of Object.entries(state.colors)) {
    const { h, s, l } = hexToHsl(hex);
    overrides[variable] = hslToCssString(h, s, l);
  }
  for (const group of getSliderGroups()) {
    const unit = group.sliderConfig?.unit ?? "";
    for (const token of group.tokens) {
      const value = state.sliders[token.variable];
      if (value !== undefined) {
        overrides[token.variable] = value + unit;
      }
    }
  }
  return overrides;
}

const DEMO_PANEL_WIDTH = 280;

export default function DemoTweakPanel() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("color");
  const [state, setState] = useState<DemoTweakState>(loadState);
  const [pickerTarget, setPickerTarget] = useState<string | null>(null);
  const swatchRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { position, onMouseDown, recenter } = useDraggable(DEMO_PANEL_WIDTH);

  // Re-center when opened
  useEffect(() => {
    if (open) {
      recenter();
    }
  }, [open, recenter]);

  // Apply overrides on mount and state change
  useEffect(() => {
    const overrides = stateToOverrides(state);
    setGlobalOverrides(overrides);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  const updateColor = (variable: string, hex: string) => {
    setState((prev) => ({
      ...prev,
      colors: { ...prev.colors, [variable]: hex },
    }));
  };

  const updateSlider = (variable: string, value: string) => {
    setState((prev) => ({
      ...prev,
      sliders: { ...prev.sliders, [variable]: value },
    }));
  };

  const handleReset = () => {
    setState(buildDefaults());
    // useEffect[state] re-applies default values to all iframes
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "color", label: "Color" },
    { key: "typography", label: "Typography" },
    { key: "spacing", label: "Spacing" },
  ];

  const sectionHeaderStyle: React.CSSProperties = {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "#888888",
    marginBottom: 6,
    marginTop: 8,
    fontWeight: 600,
  };

  const renderColorSection = (
    title: string,
    tokens: { variable: string; label: string }[],
  ) => (
    <div>
      <div style={sectionHeaderStyle}>{title}</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 4,
        }}
      >
        {tokens.map((token) => (
          <div
            key={token.variable}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
            }}
            onClick={() =>
              setPickerTarget(
                pickerTarget === token.variable ? null : token.variable,
              )
            }
          >
            <div
              ref={(el) => {
                swatchRefs.current[token.variable] = el;
              }}
              style={{
                width: 24,
                height: 24,
                borderRadius: 3,
                background: state.colors[token.variable] || "#888",
                border: "1px solid rgba(255,255,255,0.12)",
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 11, color: "#b8b8b8" }}>
              {token.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSliderGroup = (group: (typeof demoPanelGroups)[number]) => {
    const {
      unit = "",
      min = 0,
      max = 100,
      step = 1,
    } = group.sliderConfig ?? {};
    return (
      <div key={group.id}>
        <div style={sectionHeaderStyle}>{group.label}</div>
        {renderSliderTokens(group.tokens, unit, min, max, step)}
      </div>
    );
  };

  const renderSliderTokens = (
    tokens: { variable: string; label: string }[],
    unit: string,
    min: number,
    max: number,
    step: number,
  ) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {tokens.map((token) => {
        const val = state.sliders[token.variable] || "0";
        return (
          <div key={token.variable}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <span style={{ fontSize: 11, color: "#b8b8b8" }}>
                {token.label}
              </span>
              <input
                type="text"
                value={val + unit}
                onChange={(e) => {
                  const num = parseFloat(e.target.value);
                  if (!isNaN(num)) {
                    updateSlider(token.variable, num.toString());
                  }
                }}
                style={{
                  width: 60,
                  background: "#383838",
                  color: "#e0e0e0",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 3,
                  padding: "1px 4px",
                  fontSize: 11,
                  fontFamily: "ui-monospace, monospace",
                  textAlign: "right",
                }}
              />
            </div>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={Number(val)}
              onInput={(e) =>
                updateSlider(
                  token.variable,
                  (e.target as HTMLInputElement).value,
                )
              }
              style={{
                width: "100%",
                height: 6,
                cursor: "pointer",
                accentColor: "#d69a66",
              }}
            />
          </div>
        );
      })}
    </div>
  );

  // Toggle button
  const toggleButton = (
    <button
      onClick={() => setOpen((o) => !o)}
      style={{
        position: "fixed",
        top: 12,
        right: 56,
        zIndex: 10000,
        width: 36,
        height: 36,
        borderRadius: "50%",
        border: "2px solid rgba(255,255,255,0.15)",
        background:
          "linear-gradient(135deg, #dfbb77 0%, #93bb77 50%, #d69a66 100%)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 16,
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        padding: 0,
      }}
      title="Toggle Demo Tweak Panel"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#1c1c1c"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
        <circle cx="8" cy="6" r="2" fill="#1c1c1c" />
        <circle cx="16" cy="12" r="2" fill="#1c1c1c" />
        <circle cx="10" cy="18" r="2" fill="#1c1c1c" />
      </svg>
    </button>
  );

  if (!open) return toggleButton;

  return (
    <>
      {toggleButton}
      <div
        style={{
          position: "fixed",
          left: position.x,
          top: position.y,
          zIndex: 9999,
          width: DEMO_PANEL_WIDTH,
          maxHeight: "calc(100vh - 32px)",
          overflowY: "auto",
          background: "#383838",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          fontFamily: "system-ui, sans-serif",
          fontSize: 12,
          color: "#e0e0e0",
        }}
      >
        {/* Title bar (draggable) */}
        <div
          onMouseDown={onMouseDown}
          aria-label="Drag to move Demo Tweak panel"
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
          <span style={{ fontWeight: 600, fontSize: 13 }}>Demo Tweak</span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              color: "#888888",
              cursor: "pointer",
              fontSize: 16,
              lineHeight: 1,
              padding: "0 2px",
            }}
          >
            ×
          </button>
        </div>

        {/* Tab bar */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1,
                padding: "6px 0",
                fontSize: 11,
                fontWeight: tab === t.key ? 600 : 400,
                color: tab === t.key ? "#d69a66" : "#888888",
                background: "none",
                border: "none",
                borderBottom:
                  tab === t.key ? "2px solid #d69a66" : "2px solid transparent",
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ padding: "8px 12px" }}>
          {tab === "color" && (
            <>
              {getColorGroups().map((group, i) => (
                <div key={group.id}>
                  {i > 0 && <div style={{ height: 8 }} />}
                  {renderColorSection(group.label, group.tokens)}
                </div>
              ))}
            </>
          )}

          {tab === "typography" &&
            getSliderGroups()
              .filter((g) => g.id === "typography")
              .map(renderSliderGroup)}

          {tab === "spacing" &&
            getSliderGroups()
              .filter((g) => g.id === "spacing" || g.id === "decoration")
              .map(renderSliderGroup)}

          {/* Reset button */}
          <div style={{ marginTop: 12 }}>
            <button
              onClick={handleReset}
              style={{
                width: "100%",
                background: "#1c1c1c",
                color: "#888888",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 4,
                padding: "5px 8px",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>

      {/* HSL Picker popover */}
      {pickerTarget && state.colors[pickerTarget] && (
        <HslPicker
          color={state.colors[pickerTarget]}
          onChange={(hex) => updateColor(pickerTarget, hex)}
          onClose={() => setPickerTarget(null)}
          anchorEl={swatchRefs.current[pickerTarget] || null}
        />
      )}
    </>
  );
}
