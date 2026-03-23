export const prerender = false;

import type { APIRoute } from "astro";
import { spawn } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseAiResponse } from "../../lib/parse-ai-response";
import { SYSTEM_PROMPT } from "../../lib/ai-system-prompt";
import { jsonResponse } from "../../lib/api-utils";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PROJECT_ROOT = join(__dirname, "..", "..", "..");
const PAGES_DIR = join(PROJECT_ROOT, "src", "pages");

let inFlight = false;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MAX_HISTORY_LENGTH = 20;
const MAX_MESSAGE_LENGTH = 4000;

// Read existing page content to give AI context about what exists
function readExistingPages(): string {
  const pages = [
    "headers.astro",
    "cards.astro",
    "forms.astro",
    "tabs.astro",
    "toasts.astro",
    "footers.astro",
  ];
  const summary: string[] = [];
  for (const page of pages) {
    const path = join(PAGES_DIR, page);
    if (existsSync(path)) {
      summary.push(`- ${page} exists`);
    }
  }
  return summary.length > 0
    ? `Existing pattern pages:\n${summary.join("\n")}`
    : "No pattern pages exist yet.";
}

// Read sidebar-nav.tsx to get current categories
function readSidebarCategories(): string {
  const navPath = join(PROJECT_ROOT, "src", "components", "sidebar-nav.tsx");
  if (existsSync(navPath)) {
    return readFileSync(navPath, "utf-8");
  }
  return "";
}

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }
  const { message, history } = body;

  if (typeof message !== "string" || !message.trim()) {
    return jsonResponse({ error: "message required" }, 400);
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return jsonResponse({ error: "message too long" }, 400);
  }

  const validHistory = (Array.isArray(history) ? history : [])
    .filter(
      (h: unknown): h is ChatMessage =>
        typeof h === "object" &&
        h !== null &&
        "role" in h &&
        "content" in h &&
        ((h as ChatMessage).role === "user" ||
          (h as ChatMessage).role === "assistant") &&
        typeof (h as ChatMessage).content === "string" &&
        (h as ChatMessage).content.length <= MAX_MESSAGE_LENGTH,
    )
    .slice(-MAX_HISTORY_LENGTH);

  if (inFlight) {
    return jsonResponse(
      { error: "Another request is in progress. Please wait." },
      429,
    );
  }

  // Add context about existing pages
  const existingPages = readExistingPages();
  const sidebarCode = readSidebarCategories();

  const contextLines = validHistory.map(
    (h: ChatMessage) =>
      `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`,
  );
  contextLines.push(
    `\n[Context]\n${existingPages}\n\nCurrent sidebar-nav.tsx:\n${sidebarCode}\n\nUser: ${message}`,
  );
  const fullPrompt = contextLines.join("\n\n");

  inFlight = true;
  try {
    const rawResponse = await callClaude(fullPrompt);
    const result = parseAiResponse(rawResponse);

    if (result.action === "pending_files") {
      return jsonResponse({
        action: "pending_files",
        files: result.files,
        sidebarEntry: result.sidebarEntry,
        message: result.message,
        needsReload: true,
      });
    }

    return jsonResponse({
      action: "chat",
      message: result.message,
    });
  } catch (err) {
    return jsonResponse(
      { error: err instanceof Error ? err.message : "AI request failed" },
      500,
    );
  } finally {
    inFlight = false;
  }
};

async function callClaude(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      "claude",
      [
        "-p",
        "--model",
        "haiku",
        "--max-budget-usd",
        "0.50",
        "--system-prompt",
        SYSTEM_PROMPT,
      ],
      { stdio: ["pipe", "pipe", "pipe"] },
    );

    proc.stdin.write(prompt);
    proc.stdin.end();

    let output = "";
    let error = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        proc.kill();
        reject(new Error("Timeout after 480s"));
      }
    }, 480_000);

    proc.stdout.on("data", (d: Buffer) => {
      output += d.toString();
    });
    proc.stderr.on("data", (d: Buffer) => {
      error += d.toString();
    });
    proc.on("error", (err) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(new Error(`Spawn failed: ${err.message}`));
      }
    });
    proc.on("close", (code) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        if (code === 0) resolve(output.trim());
        else reject(new Error(`claude exited ${code}: ${error}`));
      }
    });
  });
}
