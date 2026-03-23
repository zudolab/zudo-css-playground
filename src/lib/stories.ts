export interface StoryMeta {
  title: string; // e.g., "Navigation/Breadcrumbs"
}

export interface StoryVariant {
  name: string;
  html: string;
  css: string;
  height?: number;
}

export interface StoryModule {
  meta: StoryMeta;
  variants: StoryVariant[];
}

export interface CategoryNode {
  slug: string;
  label: string;
  count: number;
  stories: StoryModule[];
}

/**
 * Parse story modules discovered via import.meta.glob into a category tree.
 * Story title format: "Category/ComponentName"
 */
export function buildCategoryTree(
  modules: Record<string, { meta: StoryMeta; [key: string]: unknown }>,
): CategoryNode[] {
  const categoryMap = new Map<string, CategoryNode>();

  for (const [, mod] of Object.entries(modules)) {
    if (!mod.meta?.title) continue;

    const parts = mod.meta.title.split("/");
    const category = parts[0];
    const slug = category.toLowerCase().replace(/\s+/g, "-");

    // Extract variants (named exports that have html+css)
    const variants: StoryVariant[] = [];
    for (const [key, value] of Object.entries(mod)) {
      if (key === "meta" || key === "default") continue;
      if (
        typeof value === "object" &&
        value !== null &&
        "html" in value &&
        "css" in value
      ) {
        variants.push({
          name: (value as StoryVariant).name,
          html: (value as StoryVariant).html,
          css: (value as StoryVariant).css,
          height: (value as StoryVariant).height,
        });
      }
    }

    if (!categoryMap.has(slug)) {
      categoryMap.set(slug, {
        slug,
        label: category,
        count: 0,
        stories: [],
      });
    }

    const node = categoryMap.get(slug)!;
    node.stories.push({ meta: mod.meta, variants });
    node.count += variants.length;
  }

  return Array.from(categoryMap.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
}
