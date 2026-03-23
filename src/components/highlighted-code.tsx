import { useEffect, useState } from "react";
import type { HighlighterCore } from "shiki";
import { getShikiTheme, type ShikiTheme } from "../lib/settings-store";

let highlighterPromise: Promise<HighlighterCore> | null = null;
let loadedTheme: string | null = null;

function getHighlighter(theme: ShikiTheme): Promise<HighlighterCore> {
  if (!highlighterPromise || loadedTheme !== theme) {
    loadedTheme = theme;
    highlighterPromise = import("shiki")
      .then(({ createHighlighter }) =>
        createHighlighter({
          themes: [theme],
          langs: ["html", "css"],
        }),
      )
      .catch((err) => {
        highlighterPromise = null;
        loadedTheme = null;
        throw err;
      });
  }
  return highlighterPromise;
}

interface HighlightedCodeProps {
  code: string;
  language: "html" | "css";
}

export default function HighlightedCode({
  code,
  language,
}: HighlightedCodeProps) {
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [theme, setTheme] = useState<ShikiTheme>(() => getShikiTheme());

  // Listen for theme changes from settings panel
  useEffect(() => {
    const handler = () => setTheme(getShikiTheme());
    window.addEventListener("cssp-shiki-theme-change", handler);
    return () => window.removeEventListener("cssp-shiki-theme-change", handler);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setHighlighted(null); // Show fallback while loading new theme
    getHighlighter(theme)
      .then((highlighter) => {
        if (cancelled) return;
        const result = highlighter.codeToHtml(code, {
          lang: language,
          theme,
        });
        setHighlighted(result);
      })
      .catch(() => {
        // Shiki failed — keep plain-text fallback
      });
    return () => {
      cancelled = true;
    };
  }, [code, language, theme]);

  if (!highlighted) {
    return (
      <pre className="text-caption text-fg/80 whitespace-pre-wrap break-words m-0">
        <code>{code}</code>
      </pre>
    );
  }

  return (
    <div
      className="cssp-highlighted-code"
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
}
