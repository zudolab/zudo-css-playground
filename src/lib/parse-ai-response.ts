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

export function isValidSidebarEntry(
  val: unknown,
): val is { slug: string; label: string; count: number } {
  if (typeof val !== "object" || val === null || Array.isArray(val)) return false;
  const obj = val as Record<string, unknown>;
  return (
    typeof obj.slug === "string" &&
    obj.slug.length > 0 &&
    typeof obj.label === "string" &&
    obj.label.length > 0 &&
    typeof obj.count === "number" &&
    Number.isFinite(obj.count) &&
    Number.isInteger(obj.count) &&
    obj.count > 0
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

  const messageStr =
    typeof parsed.message === "string" ? parsed.message : null;

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
        message: messageStr || "No valid files in AI response.",
      };
    }

    return {
      action: "pending_files",
      message:
        messageStr || `Created ${Object.keys(validFiles).join(", ")}.`,
      files: validFiles,
      sidebarEntry: isValidSidebarEntry(parsed.sidebarEntry)
        ? parsed.sidebarEntry
        : undefined,
    };
  }

  // Regular chat response
  return {
    action: "chat",
    message: messageStr || rawResponse,
  };
}
