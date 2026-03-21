import { validateAstroFilename } from "./validate-astro-filename";

export interface ParsedChatResponse {
  action: "chat";
  message: string;
}

export interface ParsedPendingFilesResponse {
  action: "pending_files";
  pendingFiles: Record<string, string>;
  sidebarEntry: { slug: string; label: string; count: number } | null;
  files: string[];
  message: string;
  needsReload: true;
}

export type ParsedAiResponse = ParsedChatResponse | ParsedPendingFilesResponse;

export function parseAiResponse(rawResponse: string): ParsedAiResponse {
  let parsed: Record<string, unknown>;
  try {
    const cleaned = rawResponse
      .replace(/^```(?:json)?\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();
    parsed = JSON.parse(cleaned);
  } catch {
    return { action: "chat", message: rawResponse };
  }

  if (parsed.action === "create_patterns" && parsed.files) {
    const files = parsed.files as Record<string, string>;
    const validFiles: Record<string, string> = {};

    for (const [filename, content] of Object.entries(files)) {
      if (validateAstroFilename(filename)) {
        validFiles[filename] = content;
      }
    }

    const fileNames = Object.keys(validFiles);
    return {
      action: "pending_files",
      pendingFiles: validFiles,
      sidebarEntry:
        (parsed.sidebarEntry as ParsedPendingFilesResponse["sidebarEntry"]) ||
        null,
      files: fileNames,
      message:
        (parsed.message as string) ||
        `Created ${fileNames.join(", ")}. Click reload to apply.`,
      needsReload: true,
    };
  }

  return {
    action: "chat",
    message: (parsed.message as string) || rawResponse,
  };
}
