export type RuntimeBrowser = 'safari' | 'ios' | 'firefox' | 'chromium' | 'other';

export function detectRuntimeBrowser(): RuntimeBrowser {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent;
  const platform = navigator.platform || '';
  const maxTouchPoints = navigator.maxTouchPoints || 0;
  const isiPadOS = platform === 'MacIntel' && maxTouchPoints > 1;
  const isIOS = /iPad|iPhone|iPod/i.test(ua) || isiPadOS;
  if (isIOS) return 'ios';
  if (/Firefox\//i.test(ua)) return 'firefox';
  if (/Edg\//i.test(ua) || /Chrome\//i.test(ua) || /Chromium\//i.test(ua)) return 'chromium';
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return 'safari';
  return 'other';
}

export function installBrowserSupportAttributes(): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  const browser = detectRuntimeBrowser();
  const html = document.documentElement;
  html.setAttribute('data-runtime-browser', browser);
  html.setAttribute('data-touch-device', String(navigator.maxTouchPoints > 0));

  const updateViewportHeight = () => {
    const height = window.visualViewport?.height ?? window.innerHeight;
    html.style.setProperty('--app-viewport-height', `${Math.round(height)}px`);
  };

  updateViewportHeight();
  window.addEventListener('resize', updateViewportHeight, { passive: true });
  window.visualViewport?.addEventListener('resize', updateViewportHeight, { passive: true });
  window.visualViewport?.addEventListener('scroll', updateViewportHeight, { passive: true });
}
