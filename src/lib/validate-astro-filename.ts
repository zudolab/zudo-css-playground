export function validateAstroFilename(filename: string): boolean {
  if (!filename.endsWith(".astro")) return false;
  if (filename.includes("..")) return false;
  if (filename.includes("/")) return false;
  return true;
}
