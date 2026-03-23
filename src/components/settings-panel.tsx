import { useState, useEffect } from "react";
import { useDraggable } from "../hooks/use-draggable";
import { getCssStyle, setCssStyle, type CssStyle } from "../lib/settings-store";

const PANEL_WIDTH = 280;

export default function SettingsPanel() {
  const [open, setOpen] = useState(false);
  const [cssStyle, setCssStyleState] = useState<CssStyle>(() => getCssStyle());
  const { position, onMouseDown, recenter } = useDraggable(PANEL_WIDTH);

  useEffect(() => {
    if (open) {
      recenter();
    }
  }, [open, recenter]);

  const handleCssStyleChange = (value: CssStyle) => {
    setCssStyleState(value);
    setCssStyle(value);
  };

  const toggleButton = (
    <button
      onClick={() => setOpen((o) => !o)}
      style={{
        position: "fixed",
        top: 12,
        right: 100,
        zIndex: 10000,
        width: 36,
        height: 36,
        borderRadius: "50%",
        border: "2px solid rgba(255,255,255,0.15)",
        background:
          "linear-gradient(135deg, #585b70 0%, #6c7086 50%, #888888 100%)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 16,
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        padding: 0,
      }}
      title="Toggle Settings Panel"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#e0e0e0"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    </button>
  );

  return (
    <>
      {toggleButton}
      {open && (
        <div
          style={{
            position: "fixed",
            left: position.x,
            top: position.y,
            zIndex: 9999,
            width: PANEL_WIDTH,
            background: "#1c1c1c",
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
            aria-label="Drag to move Settings panel"
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
            <span style={{ fontWeight: 600, fontSize: 13 }}>Settings</span>
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

          {/* Content */}
          <div style={{ padding: "12px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <label
                htmlFor="cssp-css-style-select"
                style={{
                  fontSize: 12,
                  color: "#b8b8b8",
                  whiteSpace: "nowrap",
                }}
              >
                CSS Style
              </label>
              <select
                id="cssp-css-style-select"
                value={cssStyle}
                onChange={(e) =>
                  handleCssStyleChange(e.target.value as CssStyle)
                }
                style={{
                  flex: 1,
                  maxWidth: 160,
                  background: "#383838",
                  color: "#e0e0e0",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 4,
                  padding: "4px 8px",
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                <option value="tailwind">Tailwind CSS</option>
                <option value="general">General CSS</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
