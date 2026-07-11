import { Link } from 'react-router-dom';

import { computeVehicleHealthSnapshot } from '@vehicle-vitals/shared';
import type { UserTier } from '../shared/featureFlags';
import { formatCurrencyRange } from '../utils/currency';
import {
  getGarageCompletenessTierFlag,
  getGarageCompletenessTierLabel,
  type GarageCompletenessResult,
} from '../utils/garageCompleteness';
import GaugeDial from './charts/GaugeDial';

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
  /** This vehicle's required-document completeness — drives forecast confidence. */
  vehicleCompleteness?: { complete: number; required: number };
  /** Garage-wide completeness, shown as a small secondary tier chip. */
  garageCompleteness?: GarageCompletenessResult;
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
      return 'border-danger-200 bg-danger-50 text-danger-700 dark:border-danger-900/50 dark:bg-danger-950/30 dark:text-danger-200';
    case 'service_soon':
      return 'border-warning-200 bg-warning-50 text-warning-700 dark:border-warning-900/50 dark:bg-warning-950/30 dark:text-warning-200';
    case 'watch':
      return 'border-warning-200 bg-warning-50 text-warning-700 dark:border-warning-900/50 dark:bg-warning-950/30 dark:text-warning-200';
    default:
      return 'border-accent-200 bg-accent-50 text-accent-700 dark:border-accent-900/50 dark:bg-accent-950/30 dark:text-accent-200';
  }
}

export default function VehicleHealthPanel({
  vehicle,
  maintenanceEntries,
  tier,
  hasPlanning12mo,
  hasPlanning36mo,
  loading = false,
  vehicleCompleteness,
  garageCompleteness,
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
          <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Vehicle Health
            {garageCompleteness && garageCompleteness.requiredTotal > 0 && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium normal-case tracking-normal text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                {getGarageCompletenessTierFlag(garageCompleteness.tier)}{' '}
                {getGarageCompletenessTierLabel(garageCompleteness.tier)} garage
              </span>
            )}
          </p>
          <h4 className="m-0 text-lg font-semibold text-slate-900 dark:text-slate-100">
            Remaining-life forecast
          </h4>
          <p className="mb-0 mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Estimated from mileage and recorded service history. Keep this
            vehicle's records current to improve forecast accuracy.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
          <GaugeDial
            size="md"
            value={snapshot.overallHealthScore}
            formatValue={v => `${Math.round(v)}`}
            label="Health Score"
            sublabel={`${snapshot.overallConfidenceBand} confidence`}
          />
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
            Record Completeness
          </div>
          <div className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">
            {vehicleCompleteness && vehicleCompleteness.required > 0
              ? `${vehicleCompleteness.complete}/${vehicleCompleteness.required} required`
              : 'No required records yet'}
          </div>
          {vehicleCompleteness && vehicleCompleteness.required > 0 && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-accent-500"
                style={{
                  width: `${Math.round(
                    (vehicleCompleteness.complete / vehicleCompleteness.required) *
                      100
                  )}%`,
                }}
              />
            </div>
          )}
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
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
                  <span
                    className={`mt-1 inline-block rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusClasses(
                      component.status
                    )}`}
                  >
                    {component.status.replace('_', ' ')}
                  </span>
                </div>
                <GaugeDial
                  size="sm"
                  value={Math.max(
                    0,
                    Math.min(100, Math.round((component.remainingLifePercent || 0) * 100))
                  )}
                  formatValue={() => formatPercent(component.remainingLifePercent)}
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
