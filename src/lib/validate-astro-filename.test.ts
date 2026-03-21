import { describe, it, expect } from "vitest";
import { isValidAstroFilename } from "./validate-astro-filename";

describe("isValidAstroFilename", () => {
  it("accepts a simple .astro filename", () => {
    expect(isValidAstroFilename("breadcrumbs.astro")).toBe(true);
  });

  it("accepts hyphenated .astro filenames", () => {
    expect(isValidAstroFilename("pricing-table.astro")).toBe(true);
  });

  it("rejects filenames without .astro extension", () => {
    expect(isValidAstroFilename("breadcrumbs.tsx")).toBe(false);
    expect(isValidAstroFilename("breadcrumbs.html")).toBe(false);
    expect(isValidAstroFilename("breadcrumbs")).toBe(false);
  });

  it("rejects filenames with directory traversal (..)", () => {
    expect(isValidAstroFilename("../evil.astro")).toBe(false);
    expect(isValidAstroFilename("foo..bar.astro")).toBe(false);
  });

  it("rejects filenames with path separators (/)", () => {
    expect(isValidAstroFilename("sub/page.astro")).toBe(false);
    expect(isValidAstroFilename("/root.astro")).toBe(false);
  });

  it("rejects empty strings", () => {
    expect(isValidAstroFilename("")).toBe(false);
  });
});
