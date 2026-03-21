import { useState, useEffect, useRef, useCallback } from "react";
import {
  setGlobalOverrides,
  resetGlobalOverrides,
} from "../lib/iframe-registry";
import { demoTokenConfig } from "../lib/demo-tokens";
import { hexToHsl, hslToHex, hslToCssString } from "../lib/color-convert";
import HslPicker from "./hsl-picker";

type Tab = "color" | "typography" | "spacing";

interface DemoTweakState {
  colors: Record<string, string>;
  typography: Record<string, string>;
  spacing: Record<string, string>;
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
  for (const token of [
    ...demoTokenConfig.colors.palette,
    ...demoTokenConfig.colors.status,
  ]) {
    colors[token.variable] = hslStringToHex(token.defaultValue);
  }
  const typography: Record<string, string> = {};
  for (const token of demoTokenConfig.typography) {
    typography[token.variable] = parseFloat(token.defaultValue).toString();
  }
  const spacing: Record<string, string> = {};
  for (const token of demoTokenConfig.spacing) {
    spacing[token.variable] = parseFloat(token.defaultValue).toString();
  }
  return { colors, typography, spacing };
}

function loadState(): DemoTweakState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
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
  for (const [variable, value] of Object.entries(state.typography)) {
    overrides[variable] = value + "rem";
  }
  for (const [variable, value] of Object.entries(state.spacing)) {
    overrides[variable] = value + "px";
  }
  return overrides;
}

function centerPosition(): { x: number; y: number } {
  if (typeof window === "undefined") return { x: 0, y: 0 };
  return {
    x: Math.max(0, (window.innerWidth - 280) / 2),
    y: Math.max(0, (window.innerHeight - 500) / 2),
  };
}

export default function DemoTweakPanel() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("color");
  const [state, setState] = useState<DemoTweakState>(loadState);
  const [position, setPosition] = useState(centerPosition);
  const [pickerTarget, setPickerTarget] = useState<string | null>(null);
  const swatchRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Re-center when opened
  useEffect(() => {
    if (open) {
      setPosition(centerPosition());
    }
  }, [open]);

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

  // Drag handlers
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
          x: Math.max(
            0,
            Math.min(
              ev.clientX - dragOffset.current.x,
              window.innerWidth - 280,
            ),
          ),
          y: Math.max(
            0,
            Math.min(
              ev.clientY - dragOffset.current.y,
              window.innerHeight - 100,
            ),
          ),
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

  const updateColor = (variable: string, hex: string) => {
    setState((prev) => ({
      ...prev,
      colors: { ...prev.colors, [variable]: hex },
    }));
  };

  const updateTypography = (variable: string, value: string) => {
    setState((prev) => ({
      ...prev,
      typography: { ...prev.typography, [variable]: value },
    }));
  };

  const updateSpacing = (variable: string, value: string) => {
    setState((prev) => ({
      ...prev,
      spacing: { ...prev.spacing, [variable]: value },
    }));
  };

  const handleReset = () => {
    const defaults = buildDefaults();
    setState(defaults);
    resetGlobalOverrides();
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
    color: "#6c7086",
    marginBottom: 6,
    marginTop: 8,
    fontWeight: 600,
  };

  const renderColorSection = (
    title: string,
    tokens: typeof demoTokenConfig.colors.palette,
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
            <span style={{ fontSize: 11, color: "#a6adc8" }}>
              {token.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSliderSection = (
    tokens: { variable: string; label: string }[],
    values: Record<string, string>,
    unit: string,
    min: number,
    max: number,
    step: number,
    onUpdate: (variable: string, value: string) => void,
  ) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {tokens.map((token) => {
        const val = values[token.variable] || "0";
        return (
          <div key={token.variable}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <span style={{ fontSize: 11, color: "#a6adc8" }}>
                {token.label}
              </span>
              <input
                type="text"
                value={val + unit}
                onChange={(e) => {
                  const num = parseFloat(e.target.value);
                  if (!isNaN(num)) {
                    onUpdate(token.variable, num.toString());
                  }
                }}
                style={{
                  width: 60,
                  background: "#313244",
                  color: "#cdd6f4",
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
                onUpdate(token.variable, (e.target as HTMLInputElement).value)
              }
              style={{
                width: "100%",
                height: 6,
                cursor: "pointer",
                accentColor: "#89b4fa",
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
          "linear-gradient(135deg, #f9e2af 0%, #94e2d5 50%, #89b4fa 100%)",
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
        stroke="#1e1e2e"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
        <circle cx="8" cy="6" r="2" fill="#1e1e2e" />
        <circle cx="16" cy="12" r="2" fill="#1e1e2e" />
        <circle cx="10" cy="18" r="2" fill="#1e1e2e" />
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
          width: 280,
          maxHeight: "calc(100vh - 32px)",
          overflowY: "auto",
          background: "#313244",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          fontFamily: "system-ui, sans-serif",
          fontSize: 12,
          color: "#cdd6f4",
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
          <span style={{ fontWeight: 600, fontSize: 13 }}>Demo Tweak</span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              color: "#6c7086",
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
                color: tab === t.key ? "#89b4fa" : "#6c7086",
                background: "none",
                border: "none",
                borderBottom:
                  tab === t.key ? "2px solid #89b4fa" : "2px solid transparent",
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
              {renderColorSection(
                "Palette Colors",
                demoTokenConfig.colors.palette,
              )}
              <div style={{ height: 8 }} />
              {renderColorSection(
                "Status Colors",
                demoTokenConfig.colors.status,
              )}
            </>
          )}

          {tab === "typography" &&
            renderSliderSection(
              demoTokenConfig.typography.map((t) => ({
                variable: t.variable,
                label: t.label,
              })),
              state.typography,
              "rem",
              0.5,
              3,
              0.05,
              updateTypography,
            )}

          {tab === "spacing" &&
            renderSliderSection(
              demoTokenConfig.spacing.map((t) => ({
                variable: t.variable,
                label: t.label,
              })),
              state.spacing,
              "px",
              0,
              64,
              1,
              updateSpacing,
            )}

          {/* Reset button */}
          <div style={{ marginTop: 12 }}>
            <button
              onClick={handleReset}
              style={{
                width: "100%",
                background: "#1e1e2e",
                color: "#6c7086",
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
