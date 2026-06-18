const STORAGE_KEY = 'vv_cookie_consent';

type ConsentChoice = 'granted' | 'denied';

interface ConsentState {
  decided: boolean;
  analytics: ConsentChoice;
  ads: ConsentChoice;
}

function pushConsent(analytics: ConsentChoice, ads: ConsentChoice) {
  window.dataLayer = window.dataLayer || [];
  // GTM consent update — three-argument form per Consent Mode v2 spec.
  (window.dataLayer as unknown[]).push('consent', 'update', {
    analytics_storage: analytics,
    ad_storage: ads,
    ad_user_data: ads,
    ad_personalization: ads,
    functionality_storage: analytics,
  });
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
