import { useState, useEffect, useRef, useCallback } from "react";
import { hexToHsl, hslToHex } from "../lib/color-convert";
import { getPopoverPosition } from "../lib/popover-position";

export interface HslPickerProps {
  color: string;
  onChange: (hex: string) => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

export default function HslPicker({
  color,
  onChange,
  onClose,
  anchorRef,
}: HslPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hsl, setHsl] = useState(() => hexToHsl(color));
  const [hexInput, setHexInput] = useState(color);

  useEffect(() => {
    setHsl(hexToHsl(color));
    setHexInput(color);
  }, [color]);

  const handleClose = useCallback(() => onClose(), [onClose]);

  // Close on outside click or Escape — exclude anchor so toggle-click works
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      const insideContainer =
        containerRef.current && containerRef.current.contains(target);
      const insideAnchor =
        anchorRef.current && anchorRef.current.contains(target);
      if (!insideContainer && !insideAnchor) {
        handleClose();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [handleClose, anchorRef]);

  function updateFromHsl(newHsl: { h: number; s: number; l: number }) {
    setHsl(newHsl);
    const hex = hslToHex(newHsl.h, newHsl.s, newHsl.l);
    setHexInput(hex);
    onChange(hex);
  }

  function handleHexChange(value: string) {
    setHexInput(value);
    if (/^#[0-9a-fA-F]{6}$/.test(value)) {
      setHsl(hexToHsl(value));
      onChange(value);
    }
  }

  const sliders = [
    { label: "H", value: hsl.h, max: 360, key: "h" as const },
    { label: "S", value: hsl.s, max: 100, key: "s" as const },
    { label: "L", value: hsl.l, max: 100, key: "l" as const },
  ];

  return (
    <div
      ref={containerRef}
      style={{
        ...getPopoverPosition(anchorRef.current, 320, 200),
        width: 320,
        padding: 12,
        background: "var(--cssp-surface, #313244)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "var(--cssp-fg, #cdd6f4)",
        fontFamily: "system-ui, sans-serif",
        fontSize: 12,
      }}
    >
      {/* Preview + hex input */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            width: "3rem",
            height: "3rem",
            borderRadius: 4,
            border: "1px solid rgba(255,255,255,0.12)",
            backgroundColor: hslToHex(hsl.h, hsl.s, hsl.l),
            flexShrink: 0,
          }}
        />
        <input
          type="text"
          value={hexInput}
          onChange={(e) => handleHexChange(e.target.value)}
          spellCheck={false}
          aria-label="Hex color value"
          style={{
            background: "var(--cssp-bg, #1e1e2e)",
            color: "var(--cssp-fg, #cdd6f4)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 4,
            padding: "4px 6px",
            fontFamily: "monospace",
            fontSize: 13,
            width: "7rem",
          }}
        />
      </div>

      {/* HSL sliders */}
      {sliders.map(({ label, value, max, key }) => (
        <div
          key={key}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 6,
          }}
        >
          <span
            style={{
              color: "var(--cssp-muted, #6c7086)",
              fontSize: 12,
              width: "1rem",
              flexShrink: 0,
            }}
          >
            {label}
          </span>
          <input
            type="range"
            min={0}
            max={max}
            value={value}
            onChange={(e) =>
              updateFromHsl({ ...hsl, [key]: parseInt(e.target.value, 10) })
            }
            aria-label={
              label === "H" ? "Hue" : label === "S" ? "Saturation" : "Lightness"
            }
            style={{ flex: 1, height: "1.25rem" }}
          />
          <span
            style={{
              fontSize: 12,
              width: "2.5rem",
              textAlign: "right",
              flexShrink: 0,
            }}
          >
            {value}
            {key === "h" ? "" : "%"}
          </span>
        </div>
      ))}
    </div>
  );
}
