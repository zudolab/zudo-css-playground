// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  registerIframe,
  applyToAllIframes,
  setGlobalOverrides,
  resetGlobalOverrides,
} from "./iframe-registry";

// Mock iframe with a fake contentDocument and contentWindow
function createMockIframe(): HTMLIFrameElement & {
  __styles: Record<string, string>;
  __messages: unknown[];
} {
  const styles: Record<string, string> = {};
  const messages: unknown[] = [];
  return {
    contentDocument: {
      documentElement: {
        style: {
          setProperty(name: string, value: string) {
            styles[name] = value;
          },
          removeProperty(name: string) {
            delete styles[name];
          },
        },
      },
    },
    contentWindow: {
      postMessage(data: unknown) {
        messages.push(data);
      },
    },
    __styles: styles,
    __messages: messages,
  } as unknown as HTMLIFrameElement & {
    __styles: Record<string, string>;
    __messages: unknown[];
  };
}

// Track mock iframes added to the "DOM"
let domIframes: HTMLIFrameElement[] = [];

beforeEach(() => {
  // Clear overrides
  const w = globalThis as unknown as Record<string, unknown>;
  delete w["__demoTokenOverrides"];
  // Reset DOM mock
  domIframes = [];
  vi.spyOn(document, "querySelectorAll").mockImplementation((selector) => {
    if (selector === "iframe") {
      return domIframes as unknown as NodeListOf<Element>;
    }
    return [] as unknown as NodeListOf<Element>;
  });
});

describe("iframe-registry", () => {
  describe("registerIframe", () => {
    it("applies existing overrides to a newly loaded iframe", () => {
      setGlobalOverrides({ "--accent": "red" });
      const iframe = createMockIframe();
      registerIframe(iframe);
      expect(iframe.__styles["--accent"]).toBe("red");
    });

    it("does not apply overrides when none are set", () => {
      const iframe = createMockIframe();
      registerIframe(iframe);
      expect(Object.keys(iframe.__styles)).toHaveLength(0);
    });
  });

  describe("applyToAllIframes", () => {
    it("applies a single variable to all iframes in the DOM", () => {
      const iframe1 = createMockIframe();
      const iframe2 = createMockIframe();
      domIframes = [iframe1, iframe2];
      applyToAllIframes("--bg", "white");
      expect(iframe1.__styles["--bg"]).toBe("white");
      expect(iframe2.__styles["--bg"]).toBe("white");
    });

    it("stores the override for future use", () => {
      domIframes = [];
      applyToAllIframes("--fg", "black");
      // Now a new iframe loads and registers
      const iframe = createMockIframe();
      registerIframe(iframe);
      expect(iframe.__styles["--fg"]).toBe("black");
    });
  });

  describe("setGlobalOverrides", () => {
    it("applies all overrides to all iframes in the DOM", () => {
      const iframe = createMockIframe();
      domIframes = [iframe];
      setGlobalOverrides({ "--accent": "blue", "--fg": "black" });
      expect(iframe.__styles["--accent"]).toBe("blue");
      expect(iframe.__styles["--fg"]).toBe("black");
    });

    it("overrides are applied to newly registered iframes", () => {
      setGlobalOverrides({ "--accent": "green" });
      const iframe = createMockIframe();
      registerIframe(iframe);
      expect(iframe.__styles["--accent"]).toBe("green");
    });
  });

  describe("resetGlobalOverrides", () => {
    it("removes all override properties from iframes in the DOM", () => {
      const iframe = createMockIframe();
      domIframes = [iframe];
      setGlobalOverrides({ "--accent": "red", "--fg": "blue" });
      expect(iframe.__styles["--accent"]).toBe("red");
      resetGlobalOverrides();
      expect(iframe.__styles["--accent"]).toBeUndefined();
      expect(iframe.__styles["--fg"]).toBeUndefined();
    });

    it("newly registered iframes get no overrides after reset", () => {
      setGlobalOverrides({ "--accent": "red" });
      resetGlobalOverrides();
      const iframe = createMockIframe();
      registerIframe(iframe);
      expect(Object.keys(iframe.__styles)).toHaveLength(0);
    });
  });

  describe("postMessage sync", () => {
    it("sends postMessage when applying overrides via setGlobalOverrides", () => {
      const iframe = createMockIframe();
      domIframes = [iframe];
      setGlobalOverrides({ "--accent": "blue" });
      expect(iframe.__messages).toHaveLength(1);
      expect(iframe.__messages[0]).toEqual({
        type: "cssp-token-override",
        overrides: { "--accent": "blue" },
      });
    });

    it("sends postMessage when applying overrides via applyToAllIframes", () => {
      const iframe = createMockIframe();
      domIframes = [iframe];
      applyToAllIframes("--fg", "black");
      expect(iframe.__messages).toHaveLength(1);
      expect(iframe.__messages[0]).toEqual({
        type: "cssp-token-override",
        overrides: { "--fg": "black" },
      });
    });

    it("sends postMessage when registering iframe with existing overrides", () => {
      setGlobalOverrides({ "--accent": "green" });
      const iframe = createMockIframe();
      registerIframe(iframe);
      expect(iframe.__messages).toHaveLength(1);
      expect(iframe.__messages[0]).toEqual({
        type: "cssp-token-override",
        overrides: { "--accent": "green" },
      });
    });

    it("sends empty overrides via postMessage on reset", () => {
      const iframe = createMockIframe();
      domIframes = [iframe];
      setGlobalOverrides({ "--accent": "red" });
      iframe.__messages.length = 0; // clear prior messages
      resetGlobalOverrides();
      expect(iframe.__messages).toHaveLength(1);
      expect(iframe.__messages[0]).toEqual({
        type: "cssp-token-override",
        overrides: {},
      });
    });
  });
});
