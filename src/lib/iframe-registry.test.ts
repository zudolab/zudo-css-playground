import { describe, it, expect, beforeEach } from "vitest";
import {
  registerIframe,
  unregisterIframe,
  applyToAllIframes,
  setGlobalOverrides,
  resetGlobalOverrides,
} from "./iframe-registry";

// Mock iframe with a fake contentDocument
function createMockIframe(): HTMLIFrameElement {
  const styles: Record<string, string> = {};
  const iframe = {
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
    // Expose styles for assertions
    __styles: styles,
  } as unknown as HTMLIFrameElement & { __styles: Record<string, string> };
  return iframe;
}

// Clear the global registry between tests
beforeEach(() => {
  const w = globalThis as unknown as Record<string, unknown>;
  delete w["__demoIframeRegistry"];
});

describe("iframe-registry", () => {
  describe("registerIframe / unregisterIframe", () => {
    it("registers an iframe and applies existing overrides", () => {
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

    it("unregisters an iframe so it no longer receives updates", () => {
      const iframe = createMockIframe();
      registerIframe(iframe);
      unregisterIframe(iframe);
      applyToAllIframes("--fg", "blue");
      expect(iframe.__styles["--fg"]).toBeUndefined();
    });
  });

  describe("applyToAllIframes", () => {
    it("applies a single variable to all registered iframes", () => {
      const iframe1 = createMockIframe();
      const iframe2 = createMockIframe();
      registerIframe(iframe1);
      registerIframe(iframe2);
      applyToAllIframes("--bg", "white");
      expect(iframe1.__styles["--bg"]).toBe("white");
      expect(iframe2.__styles["--bg"]).toBe("white");
    });
  });

  describe("setGlobalOverrides", () => {
    it("applies all overrides to all registered iframes", () => {
      const iframe = createMockIframe();
      registerIframe(iframe);
      setGlobalOverrides({ "--accent": "blue", "--fg": "black" });
      expect(iframe.__styles["--accent"]).toBe("blue");
      expect(iframe.__styles["--fg"]).toBe("black");
    });

    it("applies overrides to newly registered iframes", () => {
      setGlobalOverrides({ "--accent": "green" });
      const iframe = createMockIframe();
      registerIframe(iframe);
      expect(iframe.__styles["--accent"]).toBe("green");
    });
  });

  describe("resetGlobalOverrides", () => {
    it("removes all override properties from iframes", () => {
      const iframe = createMockIframe();
      registerIframe(iframe);
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

  describe("shared global state", () => {
    it("shares state via globalThis across separate imports", () => {
      // Simulate two separate module scopes both accessing the registry
      const iframe = createMockIframe();
      registerIframe(iframe);
      // State is on globalThis, so a second call to setGlobalOverrides
      // from any module should reach the same iframe
      setGlobalOverrides({ "--test": "shared" });
      expect(iframe.__styles["--test"]).toBe("shared");
    });
  });
});
