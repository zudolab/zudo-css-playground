/**
 * Iframe registry for live demo token updates.
 *
 * State is stored on `window` instead of module scope because Astro
 * islands (client:load vs client:visible) may produce separate bundles
 * with separate module scopes. Using window ensures HtmlPreview and
 * DemoTweakPanel share the same iframe Set and overrides.
 */

interface IframeRegistryState {
  iframes: Set<HTMLIFrameElement>;
  overrides: Record<string, string>;
}

const REGISTRY_KEY = "__demoIframeRegistry";

function getState(): IframeRegistryState {
  const w = globalThis as unknown as Record<string, IframeRegistryState>;
  if (!w[REGISTRY_KEY]) {
    w[REGISTRY_KEY] = { iframes: new Set(), overrides: {} };
  }
  return w[REGISTRY_KEY];
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

export function registerIframe(el: HTMLIFrameElement): void {
  const state = getState();
  state.iframes.add(el);
  if (Object.keys(state.overrides).length > 0) {
    applyOverridesToIframe(el, state.overrides);
  }
}

export function unregisterIframe(el: HTMLIFrameElement): void {
  getState().iframes.delete(el);
}

export function applyToAllIframes(variable: string, value: string): void {
  for (const iframe of getState().iframes) {
    applyOverridesToIframe(iframe, { [variable]: value });
  }
}

export function setGlobalOverrides(overrides: Record<string, string>): void {
  const state = getState();
  state.overrides = { ...overrides };
  for (const iframe of state.iframes) {
    applyOverridesToIframe(iframe, state.overrides);
  }
}

export function resetGlobalOverrides(): void {
  const state = getState();
  const keysToRemove = Object.keys(state.overrides);
  state.overrides = {};
  for (const iframe of state.iframes) {
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
