import { describe, it, expect } from "vitest";
import { isValidAstroFilename } from "../validate-astro-filename";

describe("isValidAstroFilename", () => {
  it("accepts valid .astro filenames", () => {
    expect(isValidAstroFilename("buttons.astro")).toBe(true);
    expect(isValidAstroFilename("my-cards.astro")).toBe(true);
    expect(isValidAstroFilename("headers_v2.astro")).toBe(true);
  });

  it("rejects non-.astro files", () => {
    expect(isValidAstroFilename("script.ts")).toBe(false);
    expect(isValidAstroFilename("style.css")).toBe(false);
    expect(isValidAstroFilename("readme.md")).toBe(false);
    expect(isValidAstroFilename("file.astro.ts")).toBe(false);
  });

  it("rejects path traversal (..)", () => {
    expect(isValidAstroFilename("../evil.astro")).toBe(false);
    expect(isValidAstroFilename("foo/../bar.astro")).toBe(false);
    expect(isValidAstroFilename("..buttons.astro")).toBe(false);
  });

  it("rejects directory separators (/)", () => {
    expect(isValidAstroFilename("sub/page.astro")).toBe(false);
    expect(isValidAstroFilename("a/b/c.astro")).toBe(false);
  });

  it("rejects backslash directory separators (\\)", () => {
    expect(isValidAstroFilename("sub\\page.astro")).toBe(false);
    expect(isValidAstroFilename("a\\b\\c.astro")).toBe(false);
  });

  it("rejects empty or whitespace-only names", () => {
    expect(isValidAstroFilename("")).toBe(false);
    expect(isValidAstroFilename("  ")).toBe(false);
  });
});
