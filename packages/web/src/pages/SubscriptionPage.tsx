import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PageSEO from '../components/PageSEO';
import {
  trackPaymentCompleted,
  trackPaymentInitiated,
  trackSubscriptionPageView,
} from '../shared/adAnalytics';
import {
  trackBeginCheckout,
  trackPricingBillingToggle,
  trackPricingPageView,
  trackPricingPlanClick,
  trackPurchase,
} from '../shared/marketingAnalytics';
import { ROUTE_SEO } from '../shared/seoMeta';
import {
  changeSubscriptionTier,
  createSubscriptionCheckoutSession,
} from '../shared/entitlementsService';
import {
  compareFeatures,
  FEATURE_FLAGS,
  getTierDisplayName,
  getTierPricing,
  TIER_PRICING,
  type UserTier,
} from '../shared/featureFlags';
import {
  getSubscriptionSummary,
  isInTrial,
} from '../shared/subscriptionService';
import { useSubscription } from '../shared/useMonetization';
import { personaPages } from '../data/personas';

// Stripe's success_url here carries only `?checkout=success` (no session ID),
// so the plan/price picked before the full-page redirect to Checkout has to
// be handed to ourselves across that redirect some other way. sessionStorage
// survives it; consuming (not just reading) it on return means a page
// refresh on the success page won't re-fire the purchase event. Only tier
// and billing period are persisted — price is a static lookup
// (getTierPricing), recomputed on return rather than stored, so nothing
// resembling a payment amount ever sits in sessionStorage.
const PENDING_CHECKOUT_KEY = 'vv_pending_checkout';

interface PendingCheckout {
  tier: UserTier;
  billingPeriod: 'monthly' | 'annual';
}

function persistPendingCheckout(checkout: PendingCheckout): void {
  try {
    sessionStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(checkout));
  } catch {
    // sessionStorage unavailable (private mode, storage full) — the
    // purchase event just won't fire on return; non-fatal.
  }
}

function consumePendingCheckout(): PendingCheckout | null {
  try {
    const raw = sessionStorage.getItem(PENDING_CHECKOUT_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
    return JSON.parse(raw) as PendingCheckout;
  } catch {
    return null;
  }
}

const featureOrder = [
  'vehicle_limit',
  'advanced_reminders',
  'calendar_sync',
  'ai_analysis',
  'ai_predictions',
  'pdf_export',
  'excel_export',
  'cloud_sync',
  'maintenance_planning_12mo',
  'maintenance_planning_36mo',
  'ad_free',
  'priority_support',
  'api_access',
];

const planPositioning: Record<
  UserTier,
  {
    audience: string;
    capacity: string;
    promise: string;
    highlights: string[];
  }
> = {
  free: {
    audience: 'Learn and document',
    capacity: 'Capacity: up to 2 vehicles',
    promise:
      'Build the habit with core maintenance records, basic reminders, and enough structure to understand ownership.',
    highlights: [
      'Save service history, costs, receipts, and notes',
      'Use basic reminders to prevent record gaps',
      'Good fit for first owners, new drivers, and simple personal tracking',
    ],
  },
  pro: {
    audience: 'Plan and coordinate',
    capacity: 'Capacity: up to 10 vehicles',
    promise:
      'Turn maintenance into a coordinated plan with better reminders, calendar sync, exports, and shared-garage-ready workflows.',
    highlights: [
      'Advanced reminders and 12-month maintenance planning',
      'Calendar sync plus PDF and Excel exports',
      'Good fit for shared garages and hands-on maintenance',
    ],
  },
  premium: {
    audience: 'Forecast and automate',
    capacity: 'Capacity: up to 25 vehicles',
    promise:
      'Add deeper forecasts, AI-powered help, integrations, cloud sync, and an ad-free workspace for complex garages.',
    highlights: [
      '36-month forecasts and AI predictions',
      'Cloud sync, API access, and automation options',
      'Good fit for power users, hands-on maintenance, and work vehicles',
    ],
  },
  enterprise: {
    audience: 'Govern and integrate',
    capacity: 'Capacity: contract-defined',
    promise:
      'Move beyond individual workflows into org controls, integration planning, policy support, and dedicated service.',
    highlights: [
      'Custom capacity, roles, policies, and support model',
      'Vendor, accounting, ERP, and reporting integration options',
      'Good fit for teams that need governance and operational visibility',
    ],
  },
};

function formatVehicleLimit(tier: UserTier): string {
  if (tier === 'free') {
    return 'Up to 2 vehicles';
  }
  if (tier === 'pro') {
    return 'Up to 10 vehicles';
  }
  if (tier === 'premium') {
    return 'Up to 25 vehicles';
  }
  return '25+ vehicles (contract)';
}

const pricingDimensions = [
  {
    label: 'Record depth',
    free: 'Core history',
    pro: 'Export-ready records',
    premium: 'AI-assisted context',
    enterprise: 'Operational reporting',
  },
  {
    label: 'Planning',
    free: 'Basic reminders',
    pro: 'Advanced reminders and 12-month planning',
    premium: '36-month forecasts and predictions',
    enterprise: 'Policy-aligned planning',
  },
  {
    label: 'Coordination',
    free: 'Personal use',
    pro: 'Shared garage and hands-on workflows',
    premium: 'Power-user automation',
    enterprise: 'Team controls and governance',
  },
  {
    label: 'Support',
    free: 'Self-service',
    pro: 'Priority email support',
    premium: 'Priority support plus ad-free workspace',
    enterprise: 'Dedicated support and SLAs',
  },
  {
    label: 'Capacity',
    free: formatVehicleLimit('free'),
    pro: formatVehicleLimit('pro'),
    premium: formatVehicleLimit('premium'),
    enterprise: formatVehicleLimit('enterprise'),
  },
];

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { subscription, tier, isLoading } = useSubscription();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>(
    'monthly'
  );
  const [isSubmittingTierChange, setIsSubmittingTierChange] = useState(false);

  useEffect(() => {
    trackSubscriptionPageView('direct_navigation', tier);
    trackPricingPageView();
  }, [tier]);

  const summary = useMemo(
    () => (subscription ? getSubscriptionSummary(subscription) : null),
    [subscription]
  );
  const isPastDue = subscription?.status === 'past_due';
  const isBillingRoute = location.pathname.startsWith('/app');

  const checkoutStatus = useMemo(() => {
    const searchParams = new URLSearchParams(location.search || '');
    const status = (searchParams.get('checkout') || '').toLowerCase();
    return status === 'success' || status === 'cancelled' ? status : '';
  }, [location.search]);

  useEffect(() => {
    if (checkoutStatus !== 'success') return;
    const pending = consumePendingCheckout();
    if (!pending) return;
    const amount =
      pending.billingPeriod === 'annual'
        ? getTierPricing(pending.tier).annualPrice
        : getTierPricing(pending.tier).monthlyPrice;
    trackPurchase(pending.tier, pending.billingPeriod, amount);
    trackPaymentCompleted(pending.tier, amount, 'USD', pending.billingPeriod);
  }, [checkoutStatus]);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-5 py-6">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Loading subscription details...
        </p>
      </div>
    );
  }

  const tiers: UserTier[] = ['free', 'pro', 'premium', 'enterprise'];

  return (
    <div className="marketing-pricing-page mx-auto w-full max-w-7xl px-5 py-6">
      <PageSEO meta={ROUTE_SEO['/subscription']} />
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          {isBillingRoute
            ? 'Subscriptions and billing'
            : 'Pricing for every kind of garage'}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {isBillingRoute
            ? 'Choose the subscription tier that matches the job your garage needs to do. Capacity matters, but each plan also adds stronger planning, coordination, automation, and support.'
            : 'Free helps people learn and document. Pro helps them plan and coordinate. Premium adds forecasting and automation. Enterprise adds governance, integrations, and dedicated support.'}
        </p>

        {!isBillingRoute && (
          <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
            {personaPages.map(persona => (
              <Link
                key={persona.id}
                to={persona.path}
                className={`rounded-xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${persona.accent}`}
              >
                <p className="font-semibold">{persona.label}</p>
                <p className="mt-1">{persona.recommendedPlan}</p>
              </Link>
            ))}
          </div>
        )}

        {checkoutStatus === 'success' && (
          <div className="mt-4 rounded-lg border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-800 dark:border-accent-800 dark:bg-accent-950/20 dark:text-accent-200">
            Checkout completed. Your subscription is being finalized.
          </div>
        )}
        {checkoutStatus === 'cancelled' && (
          <div className="mt-4 rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-800 dark:border-warning-800 dark:bg-warning-950/20 dark:text-warning-200">
            Checkout was cancelled. No subscription change was applied.
          </div>
        )}

        {isBillingRoute && summary && (
          <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50 p-4 dark:border-teal-800 dark:bg-teal-950/30">
            <p className="text-sm font-semibold text-teal-800 dark:text-teal-200">
              Current subscription: {getTierDisplayName(summary.tier)}
            </p>
            <p className="mt-1 text-sm text-teal-900/90 dark:text-teal-100/90">
              {summary.displayStatus}
            </p>
            {subscription && isInTrial(subscription) && (
              <p className="mt-1 text-xs font-medium text-teal-900 dark:text-teal-100">
                Trial active. Billing begins automatically after trial ends.
              </p>
            )}
          </div>
        )}

        {isBillingRoute && isPastDue && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 dark:border-rose-800 dark:bg-rose-950/20">
            <p className="text-sm font-semibold text-rose-800 dark:text-rose-200">
              Billing action needed
            </p>
            <p className="mt-1 text-sm text-rose-900/90 dark:text-rose-100/90">
              {subscription?.lastPaymentError ===
              'stripe_invoice_payment_failed'
                ? 'Your card was declined. Update your payment details or visit Support if the issue continues.'
                : subscription?.lastPaymentError === 'stripe_charge_disputed'
                  ? 'A dispute is open on this payment. Visit Support to review the next steps.'
                  : subscription?.lastPaymentError === 'stripe_charge_refunded'
                    ? 'This charge was refunded. Visit Support to restore access.'
                    : 'Please review your billing details and visit Support if you need help restoring access.'}
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link
                to="/support"
                className="inline-flex rounded-md bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800"
              >
                Support
              </Link>
            </div>
          </div>
        )}

        <div className="mt-5 inline-flex rounded-lg border border-slate-300 p-1 dark:border-slate-600">
          <button
            type="button"
            onClick={() => { setBillingPeriod('monthly'); trackPricingBillingToggle('monthly'); }}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              billingPeriod === 'monthly'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => { setBillingPeriod('annual'); trackPricingBillingToggle('annual'); }}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              billingPeriod === 'annual'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Annual
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-4">
        {tiers.map(planTier => {
          const pricing = getTierPricing(planTier);
          const isCurrent = isBillingRoute && tier === planTier;
          const positioning = planPositioning[planTier];
          const ctaText = isCurrent
            ? 'Current subscription'
            : planTier === 'free'
              ? isBillingRoute
                ? 'Switch to Free'
                : 'Start Free'
              : planTier === 'pro'
                ? isBillingRoute
                  ? 'Choose Pro'
                  : 'Start Pro'
                : planTier === 'premium'
                  ? isBillingRoute
                    ? 'Choose Premium'
                    : 'Start Premium'
                  : 'Contact Sales';

          return (
            <article
              key={planTier}
              className={`rounded-xl border p-5 shadow-sm ${
                isCurrent
                  ? 'border-teal-500 bg-teal-50 dark:border-teal-500 dark:bg-teal-950/20'
                  : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
              }`}
            >
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {getTierDisplayName(planTier)}
              </h2>
              <p className="mt-2 text-sm font-semibold text-teal-700 dark:text-teal-300">
                {positioning.audience}
              </p>

              <p className="mt-4 text-2xl font-bold text-slate-900 dark:text-slate-100">
                {planTier === 'enterprise'
                  ? pricing.monthlyDisplayPrice
                  : billingPeriod === 'monthly'
                    ? pricing.monthlyDisplayPrice
                    : pricing.annualDisplayPrice}
              </p>
              {planTier !== 'enterprise' &&
                billingPeriod === 'annual' &&
                pricing.annualSavings && (
                  <p className="mt-1 text-xs font-medium text-accent-700 dark:text-accent-400">
                    {pricing.annualSavings}
                  </p>
                )}

              <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                {positioning.promise}
              </p>

              <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {positioning.capacity}
              </p>

              <ul className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                {positioning.highlights.map(highlight => (
                  <li key={highlight} className="flex gap-2">
                    <span
                      aria-hidden="true"
                      className="mt-1 size-1.5 rounded-full bg-teal-600"
                    />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>

              {isBillingRoute ? (
                <button
                  type="button"
                  disabled={isCurrent || isSubmittingTierChange}
                  onClick={async () => {
                    if (isCurrent) {
                      return;
                    }

                    if (planTier === 'free') {
                      setIsSubmittingTierChange(true);
                      try {
                        await changeSubscriptionTier('free', billingPeriod);
                        window.alert(
                          'Your subscription has been changed to Free.'
                        );
                        navigate('/app/profile');
                      } catch (error) {
                        window.alert(
                          `Unable to change subscription: ${error instanceof Error ? error.message : String(error)}`
                        );
                      } finally {
                        setIsSubmittingTierChange(false);
                      }
                      return;
                    }

                    if (planTier === 'enterprise') {
                      trackPricingPlanClick(planTier, billingPeriod, 'Contact sales');
                      window.location.href =
                        'mailto:sales@vehicle-vitals.com?subject=Enterprise%20Plan%20Inquiry&body=I%20am%20interested%20in%20an%20Enterprise%20plan%20for%20my%20fleet.';
                      return;
                    }

                    trackPricingPlanClick(planTier, billingPeriod, 'Upgrade');
                    trackBeginCheckout(planTier, billingPeriod);
                    setIsSubmittingTierChange(true);
                    try {
                      trackPaymentInitiated(
                        planTier,
                        billingPeriod,
                        'subscription_page'
                      );

                      const checkoutResult =
                        await createSubscriptionCheckoutSession(
                          planTier,
                          billingPeriod
                        );

                      if (
                        checkoutResult.mode === 'redirect' &&
                        checkoutResult.checkoutUrl
                      ) {
                        persistPendingCheckout({
                          tier: planTier,
                          billingPeriod,
                        });
                        window.location.href = checkoutResult.checkoutUrl;
                        return;
                      }

                      if (checkoutResult.mode === 'activated') {
                        window.alert(
                          `${getTierDisplayName(planTier)} is now active on your account.`
                        );
                      } else {
                        window.alert(
                          'Checkout session created, but no redirect URL was returned.'
                        );
                      }
                    } catch (error) {
                      window.alert(
                        `Unable to change subscription: ${error instanceof Error ? error.message : String(error)}`
                      );
                    } finally {
                      setIsSubmittingTierChange(false);
                    }
                  }}
                  className={`mt-4 w-full rounded-md px-4 py-2 text-sm font-semibold ${
                    isCurrent || isSubmittingTierChange
                      ? 'cursor-not-allowed bg-slate-300 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                      : 'bg-teal-700 text-white hover:bg-teal-800'
                  }`}
                >
                  {ctaText}
                </button>
              ) : planTier === 'enterprise' ? (
                <a
                  href="mailto:sales@vehicle-vitals.com?subject=Enterprise%20Plan%20Inquiry&body=I%20am%20interested%20in%20an%20Enterprise%20plan%20for%20my%20fleet."
                  className="mt-4 inline-flex w-full justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
                >
                  {ctaText}
                </a>
              ) : (
                <Link
                  to="/auth/signup"
                  className="mt-4 inline-flex w-full justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
                >
                  {ctaText}
                </Link>
              )}
            </article>
          );
        })}
      </div>

      {!isBillingRoute && (
        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            How to choose
          </h2>
          <div className="mt-3 grid gap-3 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-3">
            <p>
              Choose Free when you need one reliable place to learn the habit,
              document service, and keep the basics visible.
            </p>
            <p>
              Choose Pro when planning and coordination become the value:
              advanced reminders, calendar sync, exports, and shared ownership.
            </p>
            <p>
              Choose Premium or Enterprise when forecasts, automation,
              integrations, governance, and support save more time than simple
              tracking.
            </p>
          </div>
        </div>
      )}

      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Value by tier
        </h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Vehicle capacity still affects cost, but the upgrade reason should be
          the workflow value unlocked at each tier.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
                  Dimension
                </th>
                {tiers.map(planTier => (
                  <th
                    key={planTier}
                    className="border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                  >
                    {getTierDisplayName(planTier)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pricingDimensions.map(row => (
                <tr key={row.label}>
                  <td className="border-b border-slate-100 px-3 py-2 font-medium text-slate-700 dark:border-slate-800 dark:text-slate-200">
                    {row.label}
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                    {row.free}
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                    {row.pro}
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                    {row.premium}
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                    {row.enterprise}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Feature comparison
        </h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
                  Feature
                </th>
                {tiers.map(planTier => (
                  <th
                    key={planTier}
                    className="border-b border-slate-200 px-3 py-2 text-center font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                  >
                    {getTierDisplayName(planTier)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {featureOrder
                .filter(featureName => Boolean(FEATURE_FLAGS[featureName]))
                .map(featureName => {
                  const availability = compareFeatures(featureName);
                  return (
                    <tr key={featureName}>
                      <td className="border-b border-slate-100 px-3 py-2 text-slate-700 dark:border-slate-800 dark:text-slate-200">
                        {FEATURE_FLAGS[featureName].description}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2 text-center dark:border-slate-800">
                        {availability.free ? 'Included' : 'No'}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2 text-center dark:border-slate-800">
                        {availability.pro ? 'Included' : 'No'}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2 text-center dark:border-slate-800">
                        {availability.premium ? 'Included' : 'No'}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2 text-center dark:border-slate-800">
                        {availability.enterprise ? 'Included' : 'No'}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
        Pricing source: {TIER_PRICING.pro.monthlyDisplayPrice} and{' '}
        {TIER_PRICING.premium.monthlyDisplayPrice} from monetization feature
        configuration.
      </p>
    </div>
  );
}
