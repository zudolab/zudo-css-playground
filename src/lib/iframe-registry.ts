const iframes = new Set<HTMLIFrameElement>();
let currentOverrides: Record<string, string> = {};

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
  iframes.add(el);
  if (Object.keys(currentOverrides).length > 0) {
    applyOverridesToIframe(el, currentOverrides);
  }
}

export function unregisterIframe(el: HTMLIFrameElement): void {
  iframes.delete(el);
}

export function applyToAllIframes(variable: string, value: string): void {
  for (const iframe of iframes) {
    applyOverridesToIframe(iframe, { [variable]: value });
  }
}

export function setGlobalOverrides(overrides: Record<string, string>): void {
  currentOverrides = { ...overrides };
  for (const iframe of iframes) {
    applyOverridesToIframe(iframe, currentOverrides);
  }
}

export function resetGlobalOverrides(): void {
  const keysToRemove = Object.keys(currentOverrides);
  currentOverrides = {};
  for (const iframe of iframes) {
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
