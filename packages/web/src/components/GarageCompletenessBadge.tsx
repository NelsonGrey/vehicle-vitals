import GaugeDial from './charts/GaugeDial';
import {
  getGarageCompletenessTierLabel,
  type GarageCompletenessResult,
} from '../utils/garageCompleteness';

interface GarageCompletenessBadgeProps {
  result: GarageCompletenessResult;
}

const TIER_FLAG: Record<GarageCompletenessResult['tier'], string> = {
  rookie: '🏁',
  pro: '🏎️',
  champion: '🏆',
};

export default function GarageCompletenessBadge({
  result,
}: GarageCompletenessBadgeProps) {
  if (result.requiredTotal === 0) {
    return null;
  }

  return (
    <div className="mb-4 flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <GaugeDial
        size="sm"
        value={result.completenessPercent}
        formatValue={v => `${Math.round(v)}%`}
      />
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Garage Completeness
        </p>
        <h4 className="m-0 text-lg font-semibold text-slate-900 dark:text-slate-100">
          {TIER_FLAG[result.tier]} {getGarageCompletenessTierLabel(result.tier)}
        </h4>
        <p className="mb-0 mt-1 text-sm text-slate-600 dark:text-slate-400">
          {result.requiredComplete}/{result.requiredTotal} required documents
          ready across your garage
          {result.vehiclesNotStarted > 0
            ? ` • ${result.vehiclesNotStarted} vehicle${result.vehiclesNotStarted === 1 ? '' : 's'} not started`
            : ''}
        </p>
      </div>
    </div>
  );
}
