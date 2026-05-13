import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  trackPaymentInitiated,
  trackSubscriptionPageView,
} from '../shared/adAnalytics';
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
    return 'Up to 3 vehicles';
  }
  if (tier === 'pro') {
    return 'Up to 10 vehicles';
  }
  return 'Unlimited vehicles';
}

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { subscription, tier, isLoading } = useSubscription();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>(
    'monthly'
  );

  useEffect(() => {
    trackSubscriptionPageView('direct_navigation', tier);
  }, [tier]);

  const summary = useMemo(
    () => (subscription ? getSubscriptionSummary(subscription) : null),
    [subscription]
  );

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-5 py-6">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Loading subscription details...
        </p>
      </div>
    );
  }

  const tiers: UserTier[] = ['free', 'pro', 'premium'];

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Plans and billing
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Choose the plan that matches your garage. Free supports core tracking,
          Pro unlocks advanced workflows, and Premium removes ads with full
          power-user capability.
        </p>

        {summary && (
          <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50 p-4 dark:border-teal-800 dark:bg-teal-950/30">
            <p className="text-sm font-semibold text-teal-800 dark:text-teal-200">
              Current plan: {getTierDisplayName(summary.tier)}
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

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {tiers.map(planTier => {
          const pricing = getTierPricing(planTier);
          const isCurrent = tier === planTier;
          const ctaText = isCurrent
            ? 'Current plan'
            : planTier === 'free'
              ? 'Switch to Free'
              : planTier === 'pro'
                ? 'Choose Pro'
                : 'Choose Premium';

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
                {billingPeriod === 'monthly'
                  ? pricing.monthlyDisplayPrice
                  : pricing.annualDisplayPrice}
              </p>
              {billingPeriod === 'annual' && pricing.annualSavings && (
                <p className="mt-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  {pricing.annualSavings}
                </p>
              )}

              <button
                type="button"
                disabled={isCurrent}
                onClick={() => {
                  if (isCurrent) {
                    return;
                  }

                  if (planTier === 'free') {
                    navigate('/app/profile');
                    return;
                  }

                  trackPaymentInitiated(
                    planTier,
                    billingPeriod,
                    'subscription_page'
                  );
                  window.alert(
                    'Payment integration comes next. This action has been tracked for checkout wiring.'
                  );
                }}
                className={`mt-4 w-full rounded-md px-4 py-2 text-sm font-semibold ${
                  isCurrent
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
