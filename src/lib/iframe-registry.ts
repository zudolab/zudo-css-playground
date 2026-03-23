/**
 * Iframe registry for live demo token updates.
 *
 * Uses direct DOM queries (document.querySelectorAll("iframe")) to find
 * all iframes on the page. This avoids issues with Astro's client:visible
 * directive where iframes exist in the DOM but their React components
 * haven't hydrated yet (so registerIframe was never called).
 *
 * Overrides are stored on `window` so all Astro island bundles share state.
 *
 * Two sync mechanisms are used:
 * 1. Direct DOM access (same-origin) — immediate style.setProperty
 * 2. postMessage (cross-origin safe) — sends overrides via window.postMessage
 */

const OVERRIDES_KEY = "__demoTokenOverrides";
export const TOKEN_MESSAGE_TYPE = "cssp-token-override";

export interface TokenOverrideMessage {
  type: typeof TOKEN_MESSAGE_TYPE;
  overrides: Record<string, string>;
}

function postOverridesToIframe(
  iframe: HTMLIFrameElement,
  overrides: Record<string, string>,
): void {
  try {
    iframe.contentWindow?.postMessage(
      { type: TOKEN_MESSAGE_TYPE, overrides } satisfies TokenOverrideMessage,
      "*",
    );
  } catch {
    // iframe not ready — skip
  }
}

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
  // Method 1: Direct DOM access (same-origin)
  try {
    const root = iframe.contentDocument?.documentElement;
    if (root) {
      for (const [variable, value] of Object.entries(overrides)) {
        root.style.setProperty(variable, value);
      }
    }
  } catch {
    // cross-origin — fall through to postMessage
  }
  // Method 2: postMessage (works cross-origin)
  postOverridesToIframe(iframe, overrides);
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
    // Also notify via postMessage with empty overrides
    postOverridesToIframe(iframe, {});
  }
}
