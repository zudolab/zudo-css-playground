/**
 * Validates that a filename is a safe .astro file to write to the pages directory.
 * Rejects path traversal, directory separators, and non-.astro extensions.
 */
export function isValidAstroFilename(filename: string): boolean {
  if (!filename.trim()) return false;
  if (filename.includes("..")) return false;
  if (filename.includes("/")) return false;
  if (filename.includes("\\")) return false;
  if (!filename.endsWith(".astro")) return false;
  return true;
}
