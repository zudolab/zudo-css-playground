import { describe, it, expect } from "vitest";
import {
  parseAiResponse,
  type ParsedPendingFilesResponse,
} from "./parse-ai-response";

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
        pendingFiles: {
          "cards.astro": "<h1>Cards</h1>",
          "tabs.astro": "<h1>Tabs</h1>",
        },
        sidebarEntry: { slug: "cards", label: "Cards", count: 5 },
        files: ["cards.astro", "tabs.astro"],
        message: "Created patterns!",
        needsReload: true,
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
      const result = parseAiResponse(raw) as ParsedPendingFilesResponse;
      expect(result.action).toBe("pending_files");
      expect(result.pendingFiles).toEqual({ "good.astro": "ok" });
      expect(result.files).toEqual(["good.astro"]);
    });

    it("generates a default message when none provided", () => {
      const raw = JSON.stringify({
        action: "create_patterns",
        files: { "footer.astro": "<footer/>" },
      });
      const result = parseAiResponse(raw);
      expect(result.message).toBe(
        "Created footer.astro. Click reload to apply.",
      );
    });

    it("returns null sidebarEntry when not provided", () => {
      const raw = JSON.stringify({
        action: "create_patterns",
        files: { "nav.astro": "<nav/>" },
      });
      const result = parseAiResponse(raw) as ParsedPendingFilesResponse;
      expect(result.sidebarEntry).toBeNull();
    });
  });
});
