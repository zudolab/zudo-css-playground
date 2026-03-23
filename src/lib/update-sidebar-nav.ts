/** Escape a string for safe interpolation into a JS string literal */
function escapeForJsString(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

/**
 * Pure function that updates sidebar-nav.tsx content string.
 * Adds a new category entry or updates the count of an existing one.
 */
export function updateSidebarNavContent(
  content: string,
  entry: { slug: string; label: string; count: number },
): string {
  const safeSlug = escapeForJsString(entry.slug);
  const safeLabel = escapeForJsString(entry.label);
  const entryStr = `{ slug: "${safeSlug}", label: "${safeLabel}", count: ${entry.count} }`;

  // Check if category already exists — update count (use escaped values to match content)
  if (content.includes(`slug: "${safeSlug}"`)) {
    const regexSlug = safeSlug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regexLabel = safeLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(
      `\\{ slug: "${regexSlug}", label: "${regexLabel}", count: \\d+ \\}`,
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
