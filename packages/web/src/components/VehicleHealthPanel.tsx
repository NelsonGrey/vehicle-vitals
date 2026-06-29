import { Link } from 'react-router-dom';

import { computeVehicleHealthSnapshot } from '@vehicle-vitals/shared';
import type { UserTier } from '../shared/featureFlags';

interface MaintenanceEntry {
  id?: string;
  title?: string;
  serviceType?: string;
  description?: string;
  date?: string;
  mileage?: string | number;
  notes?: string;
}

interface VehicleInfo {
  vin: string;
  mileage?: string;
  purchaseDate?: string;
}

interface Props {
  vehicle: VehicleInfo;
  maintenanceEntries: MaintenanceEntry[];
  tier: UserTier;
  hasPlanning12mo: boolean;
  hasPlanning36mo: boolean;
  loading?: boolean;
}

function formatCurrencyRange(low?: number | null, high?: number | null) {
  const safeLow = Math.max(0, Math.round(low || 0));
  const safeHigh = Math.max(safeLow, Math.round(high || 0));
  return `$${safeLow.toLocaleString()}-$${safeHigh.toLocaleString()}`;
}

function formatPercent(value?: number | null) {
  if (typeof value !== 'number') {
    return 'Unknown';
  }
  return `${Math.max(0, Math.round(value * 100))}%`;
}

function formatDue(component: {
  remainingDays?: number | null;
  remainingMiles?: number | null;
}) {
  if (typeof component.remainingDays === 'number' && component.remainingDays <= 0) {
    return 'Now';
  }
  if (
    typeof component.remainingMiles === 'number' &&
    Number.isFinite(component.remainingMiles)
  ) {
    return `${Math.max(0, Math.round(component.remainingMiles)).toLocaleString()} mi`;
  }
  if (typeof component.remainingDays === 'number') {
    return `${Math.max(0, Math.round(component.remainingDays))} days`;
  }
  return 'Estimate only';
}

function statusClasses(status: string) {
  switch (status) {
    case 'overdue':
      return 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200';
    case 'service_soon':
      return 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-200';
    case 'watch':
      return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200';
    default:
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200';
  }
}

export default function VehicleHealthPanel({
  vehicle,
  maintenanceEntries,
  tier,
  hasPlanning12mo,
  hasPlanning36mo,
  loading = false,
}: Props) {
  const snapshot = computeVehicleHealthSnapshot(vehicle, maintenanceEntries);
  const visibleComponents =
    tier === 'free' ? snapshot.components.slice(0, 3) : snapshot.components.slice(0, 6);
  const hiddenCount = Math.max(0, snapshot.components.length - visibleComponents.length);
  const planningLabel = hasPlanning36mo
    ? '36-month forecast'
    : hasPlanning12mo
      ? '12-month forecast'
      : '90-day preview';
  const spendLabel = hasPlanning36mo
    ? formatCurrencyRange(
        snapshot.estimatedSpend36mLow,
        snapshot.estimatedSpend36mHigh
      )
    : hasPlanning12mo
      ? formatCurrencyRange(
          snapshot.estimatedSpend12mLow,
          snapshot.estimatedSpend12mHigh
        )
      : formatCurrencyRange(
          snapshot.estimatedSpend90dLow,
          snapshot.estimatedSpend90dHigh
        );

  return (
    <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Vehicle Health
          </p>
          <h4 className="m-0 text-lg font-semibold text-slate-900 dark:text-slate-100">
            Remaining-life forecast
          </h4>
          <p className="mb-0 mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Estimated from mileage and recorded service history. Keep your data
            current to improve forecast accuracy.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-right dark:border-slate-700 dark:bg-slate-900">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Health Score
          </div>
          <div className="mt-1 text-3xl font-bold text-slate-900 dark:text-slate-100">
            {snapshot.overallHealthScore}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {snapshot.overallConfidenceBand} confidence
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Next likely service
          </div>
          <div className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">
            {snapshot.nextLikelyService || 'No forecast yet'}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Based on about {snapshot.estimatedMilesPerMonth.toLocaleString()} mi/month
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {planningLabel}
          </div>
          <div className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">
            {spendLabel}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Estimated spend window for likely due work
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Accuracy Tip
          </div>
          <div className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
            {snapshot.accuracyTip}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Loading recent service history…
          </div>
        ) : (
          visibleComponents.map(component => (
            <article
              key={component.componentId}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {component.label}
                  </div>
                  <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {formatPercent(component.remainingLifePercent)}
                  </div>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusClasses(
                    component.status
                  )}`}
                >
                  {component.status.replace('_', ' ')}
                </span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className={`h-full rounded-full ${
                    component.status === 'overdue'
                      ? 'bg-red-500'
                      : component.status === 'service_soon'
                        ? 'bg-orange-500'
                        : component.status === 'watch'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                  }`}
                  style={{
                    width: `${Math.max(
                      5,
                      Math.min(
                        100,
                        Math.round((component.remainingLifePercent || 0) * 100)
                      )
                    )}%`,
                  }}
                />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Due in
                  </div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {formatDue(component)}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Confidence
                  </div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {component.confidenceBand}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Estimated cost
                  </div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {formatCurrencyRange(
                      component.estimatedCostLow,
                      component.estimatedCostHigh
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {tier === 'free' && (
        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                Unlock the full vehicle health forecast
              </div>
              <div className="mt-1 text-sm text-blue-800 dark:text-blue-200">
                View {hiddenCount} more lifespan cards, 12-month forecast depth,
                and clearer budget planning with Pro.
              </div>
            </div>
            <Link
              to="/app/subscription"
              className="inline-flex items-center rounded-lg bg-blue-700 px-3 py-2 text-sm font-medium text-white no-underline hover:bg-blue-800"
            >
              See plans
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
