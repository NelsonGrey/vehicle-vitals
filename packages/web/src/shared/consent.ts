const STORAGE_KEY = 'vv_cookie_consent';

type ConsentChoice = 'granted' | 'denied';

interface ConsentState {
  decided: boolean;
  analytics: ConsentChoice;
  ads: ConsentChoice;
}

function pushConsent(analytics: ConsentChoice, ads: ConsentChoice): void {
  const params = {
    analytics_storage: analytics,
    ad_storage: ads,
    ad_user_data: ads,
    ad_personalization: ads,
    functionality_storage: analytics,
  };

  // Prefer window.gtag() which is defined in index.html before GTM loads.
  // It correctly pushes an Arguments object to dataLayer which GTM understands.
  if (typeof window.gtag === 'function') {
    window.gtag('consent', 'update', params);
    return;
  }

  // Fallback: re-create the same Arguments-object push that gtag() uses internally,
  // so GTM can process it correctly when it initialises later.
  window.dataLayer = window.dataLayer || [];
  // eslint-disable-next-line prefer-rest-params
  (function () { (window.dataLayer as unknown[]).push(arguments); })(
    'consent',
    'update',
    params
  );
}

export function getConsentState(): ConsentState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ConsentState;
  } catch {
    // ignore parse errors
  }
  return { decided: false, analytics: 'denied', ads: 'denied' };
}

export function hasDecided(): boolean {
  return getConsentState().decided;
}

export function grantConsent(): void {
  const state: ConsentState = { decided: true, analytics: 'granted', ads: 'granted' };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  pushConsent('granted', 'granted');
}

export function denyConsent(): void {
  const state: ConsentState = { decided: true, analytics: 'denied', ads: 'denied' };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  pushConsent('denied', 'denied');
}

/** Call once on app boot to replay the stored consent decision into GTM. */
export function replayStoredConsent(): void {
  const state = getConsentState();
  if (state.decided) {
    pushConsent(state.analytics, state.ads);
  }
}
