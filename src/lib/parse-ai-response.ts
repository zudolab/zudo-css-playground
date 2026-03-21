import { isValidAstroFilename } from "./validate-astro-filename";

export interface ParsedAiResponse {
  action: "pending_files" | "chat";
  message: string;
  files?: Record<string, string>;
  sidebarEntry?: { slug: string; label: string; count: number };
}

/**
 * Parses the raw AI response string into a structured response.
 * Handles JSON with optional markdown code fences, and plain text fallback.
 */
export function parseAiResponse(rawResponse: string): ParsedAiResponse {
  let parsed: Record<string, unknown>;
  try {
    // Strip markdown code fences if AI wrapped it
    const cleaned = rawResponse
      .replace(/^```json?\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();
    parsed = JSON.parse(cleaned);
  } catch {
    // AI responded with plain text — return as chat message
    return { action: "chat", message: rawResponse };
  }

  if (parsed.action === "create_patterns" && parsed.files) {
    const rawFiles = parsed.files as Record<string, string>;
    const validFiles: Record<string, string> = {};

    for (const [filename, content] of Object.entries(rawFiles)) {
      if (isValidAstroFilename(filename)) {
        validFiles[filename] = content;
      }
    }

    if (Object.keys(validFiles).length === 0) {
      return {
        action: "chat",
        message: (parsed.message as string) || "No valid files in AI response.",
      };
    }

    return {
      action: "pending_files",
      message:
        (parsed.message as string) ||
        `Created ${Object.keys(validFiles).join(", ")}.`,
      files: validFiles,
      sidebarEntry: parsed.sidebarEntry as
        | { slug: string; label: string; count: number }
        | undefined,
    };
  }

  // Regular chat response
  return {
    action: "chat",
    message: (parsed.message as string) || rawResponse,
  };
}
