import { describe, it, expect } from "vitest";
import { validateAstroFilename } from "./validate-astro-filename";

describe("validateAstroFilename", () => {
  it("accepts a simple .astro filename", () => {
    expect(validateAstroFilename("breadcrumbs.astro")).toBe(true);
  });

  it("accepts hyphenated .astro filenames", () => {
    expect(validateAstroFilename("pricing-table.astro")).toBe(true);
  });

  it("rejects filenames without .astro extension", () => {
    expect(validateAstroFilename("breadcrumbs.tsx")).toBe(false);
    expect(validateAstroFilename("breadcrumbs.html")).toBe(false);
    expect(validateAstroFilename("breadcrumbs")).toBe(false);
  });

  it("rejects filenames with directory traversal (..)", () => {
    expect(validateAstroFilename("../evil.astro")).toBe(false);
    expect(validateAstroFilename("foo..bar.astro")).toBe(false);
  });

  it("rejects filenames with path separators (/)", () => {
    expect(validateAstroFilename("sub/page.astro")).toBe(false);
    expect(validateAstroFilename("/root.astro")).toBe(false);
  });

  it("rejects empty strings", () => {
    expect(validateAstroFilename("")).toBe(false);
  });
});
