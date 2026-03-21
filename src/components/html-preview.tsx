import { useState, useRef, useEffect, useCallback } from "react";
import { generateBaseTokensCss } from "../lib/demo-tokens";
import { registerIframe, unregisterIframe } from "../lib/iframe-registry";

type Viewport = "mobile" | "tablet" | "full";

const viewportWidths: Record<Viewport, string> = {
  mobile: "320px",
  tablet: "768px",
  full: "100%",
};

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
${generateBaseTokensCss()}
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
    const handleLoad = () => {
      registerIframe(iframe);
      measureHeight();
    };
    iframe.addEventListener("load", handleLoad);
    return () => {
      iframe.removeEventListener("load", handleLoad);
      unregisterIframe(iframe);
    };
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
