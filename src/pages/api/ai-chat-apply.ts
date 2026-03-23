export const prerender = false;

import type { APIRoute } from "astro";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { isValidAstroFilename } from "../../lib/validate-astro-filename";
import { isValidSidebarEntry } from "../../lib/parse-ai-response";
import { updateSidebarNavContent } from "../../lib/update-sidebar-nav";
import { jsonResponse } from "../../lib/api-utils";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PROJECT_ROOT = join(__dirname, "..", "..", "..");
const PAGES_DIR = join(PROJECT_ROOT, "src", "pages");

/**
 * Writes pending files and updates sidebar.
 * Called by the client when user clicks "reload" — separating file writes
 * from the AI response prevents Astro HMR from reloading the page
 * before the chat UI can show the result.
 */
export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const { files, sidebarEntry } = body;

  if (!files || typeof files !== "object") {
    return jsonResponse({ error: "files required" }, 400);
  }

  const writtenFiles: string[] = [];

  for (const [filename, content] of Object.entries(
    files as Record<string, unknown>,
  )) {
    if (!isValidAstroFilename(filename) || typeof content !== "string") {
      continue;
    }
    const filePath = join(PAGES_DIR, filename);
    writeFileSync(filePath, content, "utf-8");
    writtenFiles.push(filename);
  }

  if (isValidSidebarEntry(sidebarEntry) && writtenFiles.length > 0) {
    const entry = {
      slug: sidebarEntry.slug,
      label: sidebarEntry.label,
      count: sidebarEntry.count,
    };
    const navPath = join(PROJECT_ROOT, "src", "components", "sidebar-nav.tsx");
    if (existsSync(navPath)) {
      const content = readFileSync(navPath, "utf-8");
      const updated = updateSidebarNavContent(content, entry);
      writeFileSync(navPath, updated, "utf-8");
    }
  }

  return jsonResponse({ ok: true, files: writtenFiles });
};
