import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  trackPaymentInitiated,
  trackSubscriptionPageView,
} from '../shared/adAnalytics';
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
  }, [tier]);

  const summary = useMemo(
    () => (subscription ? getSubscriptionSummary(subscription) : null),
    [subscription]
  );
  const isPastDue = subscription?.status === 'past_due';

  const checkoutStatus = useMemo(() => {
    const searchParams = new URLSearchParams(location.search || '');
    const status = (searchParams.get('checkout') || '').toLowerCase();
    return status === 'success' || status === 'cancelled' ? status : '';
  }, [location.search]);

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
    <div className="mx-auto w-full max-w-7xl px-5 py-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Subscriptions and billing
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Choose the subscription tier that matches your garage. Free supports
          core tracking, Pro unlocks advanced workflows, and Premium removes ads
          with full power-user capability.
        </p>

        {checkoutStatus === 'success' && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-200">
            Checkout completed. Your subscription is being finalized.
          </div>
        )}
        {checkoutStatus === 'cancelled' && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
            Checkout was cancelled. No subscription change was applied.
          </div>
        )}

        {summary && (
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

        {isPastDue && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 dark:border-rose-800 dark:bg-rose-950/20">
            <p className="text-sm font-semibold text-rose-800 dark:text-rose-200">
              Billing action needed
            </p>
            <p className="mt-1 text-sm text-rose-900/90 dark:text-rose-100/90">
              {subscription?.lastPaymentError ===
              'stripe_invoice_payment_failed'
                ? 'Your card was declined. Update your payment details or contact support if the issue continues.'
                : subscription?.lastPaymentError === 'stripe_charge_disputed'
                  ? 'A dispute is open on this payment. Contact support to review the next steps.'
                  : subscription?.lastPaymentError === 'stripe_charge_refunded'
                    ? 'This charge was refunded. Contact support to restore access.'
                    : 'Please review your billing details and contact support if you need help restoring access.'}
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link
                to="/contact"
                className="inline-flex rounded-md bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800"
              >
                Contact support
              </Link>
              <a
                href="mailto:support@vehicle-vitals.com"
                className="inline-flex rounded-md border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-100 dark:border-rose-700 dark:text-rose-200 dark:hover:bg-rose-950/40"
              >
                Email support
              </a>
            </div>
          </div>
        )}

        <div className="mt-5 inline-flex rounded-lg border border-slate-300 p-1 dark:border-slate-600">
          <button
            type="button"
            onClick={() => setBillingPeriod('monthly')}
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
            onClick={() => setBillingPeriod('annual')}
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
          const isCurrent = tier === planTier;
          const ctaText = isCurrent
            ? 'Current subscription'
            : planTier === 'free'
              ? 'Switch to Free'
              : planTier === 'pro'
                ? 'Choose Pro'
                : planTier === 'premium'
                  ? 'Choose Premium'
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
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {formatVehicleLimit(planTier)}
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
                  <p className="mt-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    {pricing.annualSavings}
                  </p>
                )}

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
                    window.location.href =
                      'mailto:sales@vehicle-vitals.com?subject=Enterprise%20Plan%20Inquiry&body=I%20am%20interested%20in%20an%20Enterprise%20plan%20for%20my%20fleet.';
                    return;
                  }

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
            </article>
          );
        })}
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
