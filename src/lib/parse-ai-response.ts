import { isValidAstroFilename } from "./validate-astro-filename";

export interface ParsedAiResponse {
  action: "pending_files" | "chat";
  message: string;
  files?: Record<string, string>;
  sidebarEntry?: { slug: string; label: string; count: number };
}

function isStringRecord(val: unknown): val is Record<string, string> {
  if (typeof val !== "object" || val === null || Array.isArray(val)) return false;
  return Object.values(val).every((v) => typeof v === "string");
}

function isValidSidebarEntry(
  val: unknown,
): val is { slug: string; label: string; count: number } {
  if (typeof val !== "object" || val === null) return false;
  const obj = val as Record<string, unknown>;
  return (
    typeof obj.slug === "string" &&
    typeof obj.label === "string" &&
    typeof obj.count === "number"
  );
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
      .replace(/^```[a-z]*\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();
    parsed = JSON.parse(cleaned);
  } catch {
    // AI responded with plain text — return as chat message
    return { action: "chat", message: rawResponse };
  }

  if (parsed.action === "create_patterns" && isStringRecord(parsed.files)) {
    const validFiles: Record<string, string> = {};

    for (const [filename, content] of Object.entries(parsed.files)) {
      if (isValidAstroFilename(filename)) {
        validFiles[filename] = content;
      }
    }

    if (Object.keys(validFiles).length === 0) {
      return {
        action: "chat",
        message:
          (typeof parsed.message === "string" ? parsed.message : null) ||
          "No valid files in AI response.",
      };
    }

    return {
      action: "pending_files",
      message:
        (typeof parsed.message === "string" ? parsed.message : null) ||
        `Created ${Object.keys(validFiles).join(", ")}.`,
      files: validFiles,
      sidebarEntry: isValidSidebarEntry(parsed.sidebarEntry)
        ? parsed.sidebarEntry
        : undefined,
    };
  }

  // Regular chat response
  return {
    action: "chat",
    message:
      (typeof parsed.message === "string" ? parsed.message : null) ||
      rawResponse,
  };
}
