export const prerender = false;

import type { APIRoute } from "astro";
import { spawn } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseAiResponse } from "../../lib/parse-ai-response";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
// In dev: src/pages/api/ → ../../ = src/
// Resolve to project root's src/pages/ for writing pattern files
const PROJECT_ROOT = join(__dirname, "..", "..", "..");
const PAGES_DIR = join(PROJECT_ROOT, "src", "pages");

let inFlight = false;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MAX_HISTORY_LENGTH = 20;
const MAX_MESSAGE_LENGTH = 4000;
const JSON_HEADERS = { "Content-Type": "application/json" };

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

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

const SYSTEM_PROMPT = `You are the CSS Playground AI assistant. You CREATE UI pattern pages — you do NOT just show code.

When the user asks you to create patterns (e.g., "make 10 breadcrumb patterns"), you MUST:
1. Respond with a JSON object containing the files to write
2. The response MUST be valid JSON — no markdown, no explanation, ONLY JSON

Response format:
{
  "action": "create_patterns",
  "category": "breadcrumbs",
  "label": "Breadcrumbs",
  "files": {
    "breadcrumbs.astro": "<full Astro page content>"
  },
  "sidebarEntry": { "slug": "breadcrumbs", "label": "Breadcrumbs", "count": 10 },
  "message": "Created 10 breadcrumb patterns! Click reload to see them."
}

For the Astro page content, follow this template exactly:
---
import BaseLayout from '../layouts/base-layout.astro';
import HtmlPreview from '../components/html-preview.tsx';
---

<BaseLayout title="Category" activeCategory="slug">
  <h1 class="text-heading font-bold mb-vsp-lg">Category Patterns</h1>
  <p class="text-body text-muted mb-vsp-xl">N variations built with strict design tokens.</p>
  <div class="space-y-vsp-xl">
    <section>
      <h2 class="text-subheading font-semibold mb-vsp-sm">1. Pattern Name</h2>
      <HtmlPreview client:visible title="Pattern Name" html={\`...\`} css={\`...\`} height={60} />
    </section>
  </div>
</BaseLayout>

CRITICAL CSS RULES — every pattern CSS MUST use these token variables:
- Spacing: var(--space-xs) (8px), var(--space-sm) (12px), var(--space-md) (20px), var(--space-lg) (32px)
- Colors: var(--accent), var(--accent-hover), var(--fg), var(--fg-muted), var(--bg), var(--bg-subtle), var(--border)
- Status: var(--success), var(--danger), var(--warning), var(--info)
- Typography: var(--font-sm) (0.85rem), var(--font-md) (1rem), var(--font-lg) (1.1rem)
- Radius: var(--radius) (8px)
- Shadows: var(--shadow), var(--shadow-strong)
- Focus: var(--focus-ring)
- Font: font-family: system-ui, sans-serif (already set by iframe)
- Form controls inherit font (already set by iframe)
- :focus-visible outline already set by iframe

NEVER use arbitrary hex colors, hsl() values, or pixel values for spacing. EVERY value must come from a token variable.
Use BEM-ish class names. CSS-only interactions (no JavaScript).

If the user asks a general question (not about creating patterns), respond with:
{
  "action": "chat",
  "message": "Your answer here"
}`;

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
