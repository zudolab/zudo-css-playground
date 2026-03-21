export const prerender = false;

import type { APIRoute } from "astro";
import { spawn } from "node:child_process";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

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

  const contextLines = validHistory.map((h: ChatMessage) =>
    `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`,
  );
  contextLines.push(
    `\n[Context]\n${existingPages}\n\nCurrent sidebar-nav.tsx:\n${sidebarCode}\n\nUser: ${message}`,
  );
  const fullPrompt = contextLines.join("\n\n");

  inFlight = true;
  try {
    const rawResponse = await callClaude(fullPrompt);

    // Try to parse as JSON action
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
      return jsonResponse({ action: "chat", message: rawResponse });
    }

    if (parsed.action === "create_patterns" && parsed.files) {
      // Write files to disk
      const files = parsed.files as Record<string, string>;
      const writtenFiles: string[] = [];

      for (const [filename, content] of Object.entries(files)) {
        // Safety: only allow .astro files in pages dir
        if (!filename.endsWith(".astro") || filename.includes("..") || filename.includes("/")) {
          continue;
        }
        const filePath = join(PAGES_DIR, filename);
        writeFileSync(filePath, content, "utf-8");
        writtenFiles.push(filename);
      }

      // Update sidebar-nav.tsx if sidebarEntry provided
      if (parsed.sidebarEntry && writtenFiles.length > 0) {
        const entry = parsed.sidebarEntry as {
          slug: string;
          label: string;
          count: number;
        };
        updateSidebarNav(entry);
      }

      return jsonResponse({
        action: "files_written",
        files: writtenFiles,
        message:
          (parsed.message as string) ||
          `Created ${writtenFiles.join(", ")}. Reload to see changes.`,
        needsReload: true,
      });
    }

    // Regular chat response
    return jsonResponse({
      action: "chat",
      message: (parsed.message as string) || rawResponse,
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

function updateSidebarNav(entry: {
  slug: string;
  label: string;
  count: number;
}) {
  const navPath = join(PROJECT_ROOT, "src", "components", "sidebar-nav.tsx");
  if (!existsSync(navPath)) return;

  let content = readFileSync(navPath, "utf-8");

  // Check if category already exists
  if (content.includes(`slug: "${entry.slug}"`)) {
    // Update count
    const pattern = new RegExp(
      `(\\{ slug: "${entry.slug}", label: "${entry.label}", count: )\\d+`,
    );
    content = content.replace(pattern, `$1${entry.count}`);
  } else {
    // Add new entry before the closing bracket
    const newEntry = `  { slug: "${entry.slug}", label: "${entry.label}", count: ${entry.count} },\n`;
    content = content.replace(/^(\];)/m, `${newEntry}$1`);
  }

  writeFileSync(navPath, content, "utf-8");
}

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
        reject(new Error("Timeout after 60s"));
      }
    }, 60_000);

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
