import { describe, it, expect } from "vitest";
import { parseAiResponse } from "../parse-ai-response";

describe("parseAiResponse", () => {
  it("returns pending_files for create_patterns action", () => {
    const raw = JSON.stringify({
      action: "create_patterns",
      category: "buttons",
      label: "Buttons",
      files: {
        "buttons.astro": "<html>buttons</html>",
      },
      sidebarEntry: { slug: "buttons", label: "Buttons", count: 10 },
      message: "Created 10 button patterns!",
    });

    const result = parseAiResponse(raw);
    expect(result.action).toBe("pending_files");
    expect(result.files).toEqual({ "buttons.astro": "<html>buttons</html>" });
    expect(result.sidebarEntry).toEqual({
      slug: "buttons",
      label: "Buttons",
      count: 10,
    });
    expect(result.message).toBe("Created 10 button patterns!");
  });

  it("filters invalid filenames from files", () => {
    const raw = JSON.stringify({
      action: "create_patterns",
      category: "buttons",
      label: "Buttons",
      files: {
        "buttons.astro": "valid",
        "../evil.astro": "traversal",
        "script.ts": "wrong extension",
        "sub/page.astro": "has slash",
      },
      sidebarEntry: { slug: "buttons", label: "Buttons", count: 10 },
      message: "Created patterns",
    });

    const result = parseAiResponse(raw);
    expect(result.action).toBe("pending_files");
    expect(result.files).toEqual({ "buttons.astro": "valid" });
  });

  it("returns chat for regular chat action", () => {
    const raw = JSON.stringify({
      action: "chat",
      message: "Here is some info about CSS tokens.",
    });

    const result = parseAiResponse(raw);
    expect(result.action).toBe("chat");
    expect(result.message).toBe("Here is some info about CSS tokens.");
    expect(result.files).toBeUndefined();
  });

  it("handles plain text (non-JSON) as chat", () => {
    const raw = "This is just a text response from the AI.";

    const result = parseAiResponse(raw);
    expect(result.action).toBe("chat");
    expect(result.message).toBe("This is just a text response from the AI.");
  });

  it("strips markdown code fences from JSON", () => {
    const json = JSON.stringify({
      action: "chat",
      message: "Hello!",
    });
    const raw = "```json\n" + json + "\n```";

    const result = parseAiResponse(raw);
    expect(result.action).toBe("chat");
    expect(result.message).toBe("Hello!");
  });

  it("returns chat with raw text when create_patterns has no valid files", () => {
    const raw = JSON.stringify({
      action: "create_patterns",
      files: {
        "../evil.astro": "bad",
        "script.ts": "bad",
      },
      sidebarEntry: { slug: "x", label: "X", count: 1 },
      message: "Created patterns",
    });

    const result = parseAiResponse(raw);
    // No valid files means we fall back to chat
    expect(result.action).toBe("chat");
  });
});
