import { describe, it, expect } from "vitest";
import { parseAiResponse, type ParsedAiResponse } from "./parse-ai-response";

describe("parseAiResponse", () => {
  describe("plain text fallback", () => {
    it("returns a chat action when input is not JSON", () => {
      const result = parseAiResponse("Hello, how can I help?");
      expect(result).toEqual({
        action: "chat",
        message: "Hello, how can I help?",
      });
    });
  });

  describe("code fence stripping", () => {
    it("strips ```json fences before parsing", () => {
      const raw = '```json\n{"action":"chat","message":"Hi"}\n```';
      const result = parseAiResponse(raw);
      expect(result).toEqual({ action: "chat", message: "Hi" });
    });

    it("strips ``` fences without language tag", () => {
      const raw = '```\n{"action":"chat","message":"Hi"}\n```';
      const result = parseAiResponse(raw);
      expect(result).toEqual({ action: "chat", message: "Hi" });
    });

    it("handles fences case-insensitively", () => {
      const raw = '```JSON\n{"action":"chat","message":"Ok"}\n```';
      const result = parseAiResponse(raw);
      expect(result).toEqual({ action: "chat", message: "Ok" });
    });
  });

  describe("chat action", () => {
    it("returns chat action with message", () => {
      const raw = '{"action":"chat","message":"Token info here"}';
      const result = parseAiResponse(raw);
      expect(result).toEqual({
        action: "chat",
        message: "Token info here",
      });
    });

    it("falls back to raw text if parsed JSON has no message", () => {
      const raw = '{"action":"chat"}';
      const result = parseAiResponse(raw);
      expect(result).toEqual({ action: "chat", message: raw });
    });
  });

  describe("create_patterns action", () => {
    it("returns pending_files with valid .astro files", () => {
      const raw = JSON.stringify({
        action: "create_patterns",
        files: {
          "cards.astro": "<h1>Cards</h1>",
          "tabs.astro": "<h1>Tabs</h1>",
        },
        sidebarEntry: { slug: "cards", label: "Cards", count: 5 },
        message: "Created patterns!",
      });
      const result = parseAiResponse(raw);
      expect(result).toEqual({
        action: "pending_files",
        files: {
          "cards.astro": "<h1>Cards</h1>",
          "tabs.astro": "<h1>Tabs</h1>",
        },
        sidebarEntry: { slug: "cards", label: "Cards", count: 5 },
        message: "Created patterns!",
      });
    });

    it("filters out invalid filenames", () => {
      const raw = JSON.stringify({
        action: "create_patterns",
        files: {
          "good.astro": "ok",
          "../evil.astro": "bad",
          "sub/dir.astro": "bad",
          "not-astro.tsx": "bad",
        },
        message: "Done",
      });
      const result = parseAiResponse(raw);
      expect(result.action).toBe("pending_files");
      expect(result.files).toEqual({ "good.astro": "ok" });
    });

    it("generates a default message when none provided", () => {
      const raw = JSON.stringify({
        action: "create_patterns",
        files: { "footer.astro": "<footer/>" },
      });
      const result = parseAiResponse(raw);
      expect(result.message).toBe("Created footer.astro.");
    });

    it("returns undefined sidebarEntry when not provided", () => {
      const raw = JSON.stringify({
        action: "create_patterns",
        files: { "nav.astro": "<nav/>" },
      });
      const result = parseAiResponse(raw);
      expect(result.sidebarEntry).toBeUndefined();
    });

    it("returns chat when all files are invalid", () => {
      const raw = JSON.stringify({
        action: "create_patterns",
        files: {
          "../evil.astro": "bad",
          "not-astro.tsx": "bad",
        },
      });
      const result = parseAiResponse(raw);
      expect(result.action).toBe("chat");
    });
  });
});
