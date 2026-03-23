/**
 * Pure function that updates sidebar-nav.tsx content string.
 * Adds a new category entry or updates the count of an existing one.
 */
export function updateSidebarNavContent(
  content: string,
  entry: { slug: string; label: string; count: number },
): string {
  const safeSlug = entry.slug.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const safeLabel = entry.label.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const entryStr = `{ slug: "${safeSlug}", label: "${safeLabel}", count: ${entry.count} }`;

  // Check if category already exists — update count
  if (content.includes(`slug: "${entry.slug}"`)) {
    const escapedSlug = entry.slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const escapedLabel = entry.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(
      `\\{ slug: "${escapedSlug}", label: "${escapedLabel}", count: \\d+ \\}`,
    );
    return content.replace(pattern, entryStr);
  }

  // Single-line empty array: `[] = [];` — expand to multi-line
  const singleLineEmpty = /(]\s*=\s*)\[\];/;
  if (singleLineEmpty.test(content)) {
    return content.replace(singleLineEmpty, `$1[\n  ${entryStr},\n];`);
  }

  // Multi-line array: insert before closing `];`
  const newEntry = `  ${entryStr},\n`;
  return content.replace(/^(\];)/m, `${newEntry}$1`);
}
