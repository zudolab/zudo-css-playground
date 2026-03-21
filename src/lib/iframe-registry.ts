/**
 * Iframe registry for live demo token updates.
 *
 * Uses direct DOM queries (document.querySelectorAll("iframe")) to find
 * all iframes on the page. This avoids issues with Astro's client:visible
 * directive where iframes exist in the DOM but their React components
 * haven't hydrated yet (so registerIframe was never called).
 *
 * Overrides are stored on `window` so all Astro island bundles share state.
 */

const OVERRIDES_KEY = "__demoTokenOverrides";

function getOverrides(): Record<string, string> {
  const w = globalThis as unknown as Record<string, Record<string, string>>;
  if (!w[OVERRIDES_KEY]) {
    w[OVERRIDES_KEY] = {};
  }
  return w[OVERRIDES_KEY];
}

function setOverridesStore(overrides: Record<string, string>): void {
  (globalThis as unknown as Record<string, Record<string, string>>)[
    OVERRIDES_KEY
  ] = overrides;
}

function getAllIframes(): HTMLIFrameElement[] {
  if (typeof document === "undefined") return [];
  return Array.from(document.querySelectorAll("iframe"));
}

function applyOverridesToIframe(
  iframe: HTMLIFrameElement,
  overrides: Record<string, string>,
): void {
  try {
    const root = iframe.contentDocument?.documentElement;
    if (!root) return;
    for (const [variable, value] of Object.entries(overrides)) {
      root.style.setProperty(variable, value);
    }
  } catch {
    // cross-origin iframe — skip
  }
}

/** Called by HtmlPreview on load — applies current overrides to newly loaded iframe */
export function registerIframe(el: HTMLIFrameElement): void {
  const overrides = getOverrides();
  if (Object.keys(overrides).length > 0) {
    applyOverridesToIframe(el, overrides);
  }
}

/** No-op kept for API compatibility */
export function unregisterIframe(_el: HTMLIFrameElement): void {
  // No longer tracking a Set — using DOM queries instead
}

export function applyToAllIframes(variable: string, value: string): void {
  const overrides = getOverrides();
  overrides[variable] = value;
  for (const iframe of getAllIframes()) {
    applyOverridesToIframe(iframe, { [variable]: value });
  }
}

export function setGlobalOverrides(overrides: Record<string, string>): void {
  setOverridesStore({ ...overrides });
  for (const iframe of getAllIframes()) {
    applyOverridesToIframe(iframe, overrides);
  }
}

export function resetGlobalOverrides(): void {
  const keysToRemove = Object.keys(getOverrides());
  setOverridesStore({});
  for (const iframe of getAllIframes()) {
    try {
      const root = iframe.contentDocument?.documentElement;
      if (!root) continue;
      for (const variable of keysToRemove) {
        root.style.removeProperty(variable);
      }
    } catch {
      // cross-origin iframe — skip
    }
  }
}
