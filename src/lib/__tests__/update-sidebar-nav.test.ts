import { describe, it, expect } from "vitest";
import { updateSidebarNavContent } from "../update-sidebar-nav";

const SINGLE_LINE_EMPTY = `const categories: { slug: string; label: string; count: number }[] = [];

export default function SidebarNav() {
  return <nav />;
}`;

const MULTI_LINE_WITH_ENTRIES = `const categories: { slug: string; label: string; count: number }[] = [
  { slug: "buttons", label: "Buttons", count: 8 },
  { slug: "cards", label: "Cards", count: 5 },
];

export default function SidebarNav() {
  return <nav />;
}`;

const MULTI_LINE_EMPTY = `const categories: { slug: string; label: string; count: number }[] = [
];

export default function SidebarNav() {
  return <nav />;
}`;

describe("updateSidebarNavContent", () => {
  it("adds entry to empty single-line array ([] = [];)", () => {
    const result = updateSidebarNavContent(SINGLE_LINE_EMPTY, {
      slug: "headers",
      label: "Headers",
      count: 10,
    });
    expect(result).toContain(`slug: "headers"`);
    expect(result).toContain(`label: "Headers"`);
    expect(result).toContain("count: 10");
    // Should have expanded to multi-line format
    expect(result).toContain("];");
  });

  it("adds entry to multi-line array with existing entries", () => {
    const result = updateSidebarNavContent(MULTI_LINE_WITH_ENTRIES, {
      slug: "headers",
      label: "Headers",
      count: 10,
    });
    expect(result).toContain(`slug: "headers"`);
    expect(result).toContain(`slug: "buttons"`);
    expect(result).toContain(`slug: "cards"`);
  });

  it("updates count for existing category", () => {
    const result = updateSidebarNavContent(MULTI_LINE_WITH_ENTRIES, {
      slug: "buttons",
      label: "Buttons",
      count: 12,
    });
    expect(result).toContain("count: 12");
    expect(result).not.toContain("count: 8");
  });

  it("updates count when slug/label contain regex metacharacters", () => {
    const content = `const categories: { slug: string; label: string; count: number }[] = [
  { slug: "c++-snippets", label: "C++ Snippets", count: 3 },
];`;
    const result = updateSidebarNavContent(content, {
      slug: "c++-snippets",
      label: "C++ Snippets",
      count: 9,
    });
    expect(result).toContain("count: 9");
    expect(result).not.toContain("count: 3");
  });

  it("handles empty multi-line array", () => {
    const result = updateSidebarNavContent(MULTI_LINE_EMPTY, {
      slug: "forms",
      label: "Forms",
      count: 6,
    });
    expect(result).toContain(`slug: "forms"`);
    expect(result).toContain("count: 6");
  });
});
