import { useState, useRef, useCallback } from "react";

/** Estimated panel height for centering calculation */
const DEFAULT_ESTIMATED_HEIGHT = 500;
/** Minimum visible portion at bottom edge during drag */
const MIN_VISIBLE_BOTTOM = 100;

/**
 * Shared drag-to-move hook for floating panels.
 * Uses refs instead of state dependencies to avoid
 * recreating the callback on every mousemove frame.
 */
export function useDraggable(panelWidth: number) {
  const [position, setPosition] = useState(() => {
    if (typeof window === "undefined") return { x: 0, y: 0 };
    return {
      x: Math.max(0, (window.innerWidth - panelWidth) / 2),
      y: Math.max(0, (window.innerHeight - DEFAULT_ESTIMATED_HEIGHT) / 2),
    };
  });

  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const positionRef = useRef(position);
  positionRef.current = position;

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      dragging.current = true;
      dragOffset.current = {
        x: e.clientX - positionRef.current.x,
        y: e.clientY - positionRef.current.y,
      };
      e.preventDefault();

      const onMouseMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        setPosition({
          x: Math.max(
            0,
            Math.min(
              ev.clientX - dragOffset.current.x,
              window.innerWidth - panelWidth,
            ),
          ),
          y: Math.max(
            0,
            Math.min(
              ev.clientY - dragOffset.current.y,
              window.innerHeight - MIN_VISIBLE_BOTTOM,
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
    [panelWidth],
  );

  const recenter = useCallback(() => {
    if (typeof window === "undefined") return;
    setPosition({
      x: Math.max(0, (window.innerWidth - panelWidth) / 2),
      y: Math.max(0, (window.innerHeight - DEFAULT_ESTIMATED_HEIGHT) / 2),
    });
  }, [panelWidth]);

  return { position, onMouseDown, recenter };
}
