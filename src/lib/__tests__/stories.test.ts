import { describe, it, expect } from "vitest";
import { buildCategoryTree } from "../stories";
import type { StoryMeta, StoryVariant } from "../stories";

describe("buildCategoryTree", () => {
  it("groups modules by category slug", () => {
    const modules: Record<string, { meta: StoryMeta; [key: string]: unknown }> =
      {
        "./navigation.stories.ts": {
          meta: { title: "Navigation/Breadcrumbs" },
          Simple: {
            name: "Simple",
            html: "<nav/>",
            css: ".nav{}",
          } as StoryVariant,
        },
        "./navigation-tabs.stories.ts": {
          meta: { title: "Navigation/Tabs" },
          Horizontal: {
            name: "Horizontal",
            html: "<div/>",
            css: ".tab{}",
          } as StoryVariant,
        },
      };

    const tree = buildCategoryTree(modules);

    expect(tree).toHaveLength(1);
    expect(tree[0].slug).toBe("navigation");
    expect(tree[0].label).toBe("Navigation");
    expect(tree[0].count).toBe(2);
    expect(tree[0].stories).toHaveLength(2);
  });

  it("sorts categories alphabetically", () => {
    const modules: Record<string, { meta: StoryMeta; [key: string]: unknown }> =
      {
        "./z.stories.ts": {
          meta: { title: "Zebra/Stripes" },
          Default: {
            name: "Default",
            html: "<div/>",
            css: ".z{}",
          } as StoryVariant,
        },
        "./a.stories.ts": {
          meta: { title: "Apple/Pie" },
          Default: {
            name: "Default",
            html: "<div/>",
            css: ".a{}",
          } as StoryVariant,
        },
      };

    const tree = buildCategoryTree(modules);

    expect(tree[0].label).toBe("Apple");
    expect(tree[1].label).toBe("Zebra");
  });

  it("skips modules without meta.title", () => {
    const modules: Record<string, { meta: StoryMeta; [key: string]: unknown }> =
      {
        "./broken.stories.ts": {
          meta: undefined as unknown as StoryMeta,
          Default: {
            name: "Default",
            html: "<div/>",
            css: ".x{}",
          } as StoryVariant,
        },
      };

    const tree = buildCategoryTree(modules);
    expect(tree).toHaveLength(0);
  });

  it("skips exports without html and css", () => {
    const modules: Record<string, { meta: StoryMeta; [key: string]: unknown }> =
      {
        "./foo.stories.ts": {
          meta: { title: "Foo/Bar" },
          helper: "not a variant",
          Default: {
            name: "Default",
            html: "<div/>",
            css: ".d{}",
          } as StoryVariant,
        },
      };

    const tree = buildCategoryTree(modules);
    expect(tree[0].count).toBe(1);
    expect(tree[0].stories[0].variants).toHaveLength(1);
  });

  it("extracts height from variants", () => {
    const modules: Record<string, { meta: StoryMeta; [key: string]: unknown }> =
      {
        "./nav.stories.ts": {
          meta: { title: "Nav/Breadcrumbs" },
          Tall: {
            name: "Tall",
            html: "<div/>",
            css: ".t{}",
            height: 300,
          } as StoryVariant,
        },
      };

    const tree = buildCategoryTree(modules);
    expect(tree[0].stories[0].variants[0].height).toBe(300);
  });
});
