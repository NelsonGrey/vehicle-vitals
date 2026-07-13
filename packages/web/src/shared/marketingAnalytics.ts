/**
 * Marketing funnel analytics.
 *
 * All events flow through window.gtag() → GTM → GA4 as the primary channel,
 * with firebaseConfig.trackEvent() as a secondary channel (Firebase Analytics).
 * UTM parameters are captured on landing and attached to every event so
 * attribution is available in GA4 reports without extra configuration.
 */

import { trackEvent as firebaseTrackEvent } from './firebaseConfig';
import { isProductionEnvironment } from './environment';

// ─── UTM capture ─────────────────────────────────────────────────────────────

const UTM_SESSION_KEY = 'vv_utm';

export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  landing_page?: string;
  referrer?: string;
}

/**
 * Call once on app boot (before any route renders).
 * Reads UTM params from the URL and writes them to sessionStorage so they
 * survive SPA navigations but reset on a new tab/session.
 * Only overwrites if the current URL has UTM params (allows mid-session
 * organic navigation without losing the original attribution).
 */
export function captureUtmParams(): void {
  try {
    const params = new URLSearchParams(window.location.search);
    const utmKeys = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_content',
      'utm_term',
    ] as const;

    const incoming: UtmParams = {};
    let hasIncoming = false;

    for (const key of utmKeys) {
      const val = params.get(key);
      if (val) {
        incoming[key] = val;
        hasIncoming = true;
      }
    }

    if (hasIncoming || !sessionStorage.getItem(UTM_SESSION_KEY)) {
      incoming.landing_page = window.location.pathname;
      if (document.referrer) {
        incoming.referrer = document.referrer;
      }
      sessionStorage.setItem(UTM_SESSION_KEY, JSON.stringify(incoming));
    }
  } catch {
    // sessionStorage unavailable (private mode, storage full) — non-fatal
  }
}

export function getUtmParams(): UtmParams {
  try {
    const raw = sessionStorage.getItem(UTM_SESSION_KEY);
    if (raw) return JSON.parse(raw) as UtmParams;
  } catch {
    // ignore
  }
  return {};
}

// ─── Event dispatch ───────────────────────────────────────────────────────────

type EventParams = Record<string, string | number | boolean | undefined>;

function dispatch(eventName: string, params: EventParams = {}): void {
  const utm = getUtmParams();

  const payload: EventParams = {
    ...params,
    // Attach UTM fields that are present so GA4 can use them for attribution
    ...(utm.utm_source && { utm_source: utm.utm_source }),
    ...(utm.utm_medium && { utm_medium: utm.utm_medium }),
    ...(utm.utm_campaign && { utm_campaign: utm.utm_campaign }),
    ...(utm.utm_content && { utm_content: utm.utm_content }),
    ...(utm.utm_term && { utm_term: utm.utm_term }),
  };

  // Dev: surface events in console so they're visible without GTM/GA access
  if (!isProductionEnvironment) {
    console.info(`[Marketing Analytics] ${eventName}`, payload);
  }

  // Primary: GTM dataLayer → GA4
  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, payload);
    }
  } catch {
    // never throw from analytics
  }

  // Secondary: Firebase Analytics (async init — safe to call even before ready)
  try {
    firebaseTrackEvent(eventName, payload);
  } catch {
    // never throw from analytics
  }
}

// ─── Marketing page views ─────────────────────────────────────────────────────

export function trackMarketingPageView(
  pagePath: string,
  pageTitle: string
): void {
  dispatch('marketing_page_view', { page_path: pagePath, page_title: pageTitle });
}

export function trackPersonaPageView(
  personaId: string,
  pagePath: string,
  pageTitle: string
): void {
  dispatch('persona_page_view', {
    persona_id: personaId,
    page_path: pagePath,
    page_title: pageTitle,
  });
}

export function trackPricingPageView(ctaLocation?: string): void {
  dispatch('pricing_page_view', {
    ...(ctaLocation && { cta_location: ctaLocation }),
    page_path: '/subscription',
  });
}

// ─── CTA and interaction events ───────────────────────────────────────────────

export function trackPersonaCtaClick(
  personaId: string,
  ctaLabel: string,
  destination: string,
  ctaLocation: string
): void {
  dispatch('persona_cta_click', {
    persona_id: personaId,
    cta_label: ctaLabel,
    destination,
    cta_location: ctaLocation,
  });
}

export function trackPricingPlanClick(
  planTier: string,
  billingPeriod: 'monthly' | 'annual',
  ctaLabel: string
): void {
  dispatch('pricing_plan_click', {
    plan_tier: planTier,
    billing_period: billingPeriod,
    cta_label: ctaLabel,
  });
}

export function trackPricingBillingToggle(
  billingPeriod: 'monthly' | 'annual'
): void {
  dispatch('pricing_billing_toggle', { billing_period: billingPeriod });
}

export function trackSignupStart(
  ctaLocation: string,
  personaId?: string
): void {
  dispatch('signup_start', {
    cta_location: ctaLocation,
    ...(personaId && { persona_id: personaId }),
  });
}

export function trackBeginCheckout(
  planTier: string,
  billingPeriod: 'monthly' | 'annual'
): void {
  dispatch('begin_checkout', { plan_tier: planTier, billing_period: billingPeriod });
}

/**
 * GA4's standard ecommerce 'purchase' event — required for GA4 revenue
 * reporting and for importing subscription conversions into Google Ads.
 * Fire once, on confirmed return from a successful Stripe Checkout
 * redirect (see SubscriptionPage's pending-checkout handoff); there's no
 * Stripe session/invoice ID available client-side here to dedupe against,
 * so the synthetic transaction_id below is best-effort, not authoritative.
 */
export function trackPurchase(
  planTier: string,
  billingPeriod: 'monthly' | 'annual',
  value: number,
  currency = 'USD'
): void {
  dispatch('purchase', {
    transaction_id: `${planTier}_${billingPeriod}_${Date.now()}`,
    value,
    currency,
    plan_tier: planTier,
    billing_period: billingPeriod,
  });
}

export function trackContactSalesClick(ctaLocation: string): void {
  dispatch('contact_sales_click', { cta_location: ctaLocation });
}

// ─── Navigation events ────────────────────────────────────────────────────────

export function trackHeaderNavClick(
  label: string,
  destination: string,
  capabilityId?: string
): void {
  dispatch('header_nav_click', {
    cta_label: label,
    destination,
    ...(capabilityId && { capability_id: capabilityId }),
  });
}

export function trackFooterNavClick(
  label: string,
  destination: string,
  capabilityId?: string
): void {
  dispatch('footer_nav_click', {
    cta_label: label,
    destination,
    ...(capabilityId && { capability_id: capabilityId }),
  });
}

export function trackHelpSearch(query: string, resultCount: number): void {
  dispatch('help_search', { query, result_count: resultCount });
}

export function trackOnboardingStepAction(
  stepId: string,
  actionLabel: string
): void {
  dispatch('onboarding_step_action', {
    step_id: stepId,
    cta_label: actionLabel,
  });
}
