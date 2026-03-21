import { useState, useRef, useEffect, useCallback } from "react";

type Viewport = "mobile" | "tablet" | "full";

const viewportWidths: Record<Viewport, string> = {
  mobile: "320px",
  tablet: "768px",
  full: "100%",
};

/** Shared design tokens injected into every preview iframe */
const BASE_TOKENS = `
:root {
  --space-xs: 8px;
  --space-sm: 12px;
  --space-md: 20px;
  --space-lg: 32px;
  --radius: 8px;
  --accent: hsl(220 70% 50%);
  --accent-hover: hsl(220 70% 42%);
  --fg: hsl(220 25% 15%);
  --fg-muted: hsl(220 10% 40%);
  --bg: hsl(0 0% 100%);
  --bg-subtle: hsl(220 15% 96%);
  --border: hsl(220 15% 85%);
  --success: hsl(142 71% 45%);
  --danger: hsl(0 84% 60%);
  --warning: hsl(45 93% 47%);
  --info: hsl(220 70% 50%);
  --font-sm: 0.85rem;
  --font-md: 1rem;
  --font-lg: 1.1rem;
  --shadow: 0 1px 3px hsl(220 25% 15% / 0.1);
  --shadow-strong: 0 4px 12px hsl(220 25% 15% / 0.15);
  --focus-ring: 0 0 0 2px hsl(220 70% 50% / 0.25);
}`;

interface Props {
  html: string;
  css: string;
  title?: string;
  height?: number;
  defaultOpen?: boolean;
}

export default function HtmlPreview({
  html,
  css,
  title,
  height,
  defaultOpen = false,
}: Props) {
  const [viewport, setViewport] = useState<Viewport>("full");
  const [codeOpen, setCodeOpen] = useState(defaultOpen);
  const [iframeHeight, setIframeHeight] = useState(height ?? 200);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const srcdoc = `<!doctype html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, sans-serif; }
input, button, textarea, select { font-family: inherit; }
:focus-visible { outline: 2px solid var(--accent, hsl(220 70% 50%)); outline-offset: 2px; }
${BASE_TOKENS}
${css}
</style>
</head>
<body>${html}</body>
</html>`;

  const measureHeight = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe || height) return;
    try {
      const doc = iframe.contentDocument;
      if (doc?.body) {
        const measured = doc.body.scrollHeight;
        if (measured > 0) {
          setIframeHeight(measured + 16);
        }
      }
    } catch {
      // cross-origin; keep default
    }
  }, [height]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const handleLoad = () => measureHeight();
    iframe.addEventListener("load", handleLoad);
    return () => iframe.removeEventListener("load", handleLoad);
  }, [measureHeight]);

  const viewportButtons: { key: Viewport; label: string }[] = [
    { key: "mobile", label: "Mobile" },
    { key: "tablet", label: "Tablet" },
    { key: "full", label: "Full" },
  ];

  return (
    <div className="border border-muted/30 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-surface px-hsp-md py-vsp-2xs">
        <div className="flex items-center gap-hsp-sm">
          {title && (
            <span className="text-small font-medium text-fg">{title}</span>
          )}
        </div>
        <div className="flex items-center gap-hsp-xs">
          {viewportButtons.map((vp) => (
            <button
              key={vp.key}
              onClick={() => setViewport(vp.key)}
              className={`px-hsp-sm py-vsp-2xs text-caption rounded transition-colors cursor-pointer border-none ${
                viewport === vp.key
                  ? "bg-accent/20 text-accent"
                  : "text-muted hover:text-fg bg-transparent"
              }`}
            >
              {vp.label}
            </button>
          ))}
          <button
            onClick={() => setCodeOpen(!codeOpen)}
            className="px-hsp-sm py-vsp-2xs text-caption rounded text-muted hover:text-fg transition-colors cursor-pointer border-none bg-transparent ml-hsp-xs"
          >
            {codeOpen ? "Hide Code" : "Show Code"}
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-bg p-hsp-md flex justify-center">
        <iframe
          ref={iframeRef}
          srcDoc={srcdoc}
          title={title || "Preview"}
          style={{
            width: viewportWidths[viewport],
            height: `${iframeHeight}px`,
            maxWidth: "100%",
          }}
          className="border border-muted/20 rounded bg-bg block"
          sandbox="allow-same-origin"
        />
      </div>

      {/* Code */}
      {codeOpen && (
        <div className="border-t border-muted/20">
          <div className="bg-p0 p-hsp-md overflow-auto">
            <div className="mb-vsp-xs">
              <span className="text-caption text-muted font-medium">HTML</span>
            </div>
            <pre className="text-caption text-fg/80 whitespace-pre-wrap break-words m-0">
              <code>{html}</code>
            </pre>
            {css && (
              <>
                <div className="mt-vsp-sm mb-vsp-xs">
                  <span className="text-caption text-muted font-medium">
                    CSS
                  </span>
                </div>
                <pre className="text-caption text-fg/80 whitespace-pre-wrap break-words m-0">
                  <code>{css}</code>
                </pre>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
