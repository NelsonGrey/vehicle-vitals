import { CachedImage } from './CachedImage';

interface Vehicle {
  vin: string;
  make: string;
  model: string;
  year: string;
  vehicleStatus?: 'active' | 'stored';
  photoUrl?: string;
  mileage?: string;
  recallsCount?: number;
}

interface VehicleListItemProps {
  vehicle: Vehicle;
  isSelected: boolean;
  onSelect: (vin: string) => void;
  alertLevel: 'urgent' | 'soon' | null;
  portfolioComplete?: number;
  portfolioRequired?: number;
  healthScore?: number;
}

function healthScoreClasses(score: number) {
  if (score >= 80) {
    return 'bg-accent-100 text-accent-800 dark:bg-accent-900/40 dark:text-accent-200';
  }
  if (score >= 50) {
    return 'bg-warning-100 text-warning-800 dark:bg-warning-900/40 dark:text-warning-200';
  }
  return 'bg-danger-100 text-danger-800 dark:bg-danger-900/40 dark:text-danger-200';
}

export const VehicleListItem: React.FC<VehicleListItemProps> = ({
  vehicle,
  isSelected,
  onSelect,
  alertLevel,
  portfolioComplete = 0,
  portfolioRequired = 0,
  healthScore,
}) => {
  const vinText = vehicle.vin || '';
  const yearText = vehicle.year || '';
  const makeText = vehicle.make || '';
  const modelText = vehicle.model || '';
  const isStored = vehicle.vehicleStatus === 'stored';

  return (
    <button
      type="button"
      data-testid={`vehicle-list-item-${vinText}`}
      onClick={() => onSelect(vinText)}
      className={`w-full text-left rounded-lg border p-3 transition-colors ${
        isSelected
          ? 'border-slate-500 bg-slate-100 dark:bg-slate-700'
          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/70'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="h-12 w-16 rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 flex-shrink-0">
          {vehicle.photoUrl ? (
            <CachedImage
              src={vehicle.photoUrl}
              alt={`${yearText} ${makeText} ${modelText}`}
              className="h-full w-full object-cover"
              width={64}
              height={48}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-slate-400 text-lg">
              🚗
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="font-medium text-slate-900 dark:text-slate-100 line-clamp-1">
            {yearText} {makeText} {modelText}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
            {vinText}
            {vehicle.mileage ? ` • ${vehicle.mileage} mi` : ''}
          </div>
        </div>
      </div>
      <div className="mt-1 flex flex-wrap gap-1">
        {typeof healthScore === 'number' && (
          <span
            title={`Vehicle health score: ${healthScore} out of 100`}
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${healthScoreClasses(healthScore)}`}
          >
            Health: {healthScore}/100
          </span>
        )}
        {isStored && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200">
            Stored
          </span>
        )}
        {Number(vehicle.recallsCount || 0) > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-warning-100 text-warning-800 dark:bg-warning-900/40 dark:text-warning-200">
            {vehicle.recallsCount} recall
            {Number(vehicle.recallsCount) === 1 ? '' : 's'}
          </span>
        )}
        {portfolioRequired > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
            Records: {portfolioComplete}/{portfolioRequired}
          </span>
        )}
      </div>
      {alertLevel === 'urgent' && (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-danger-100 text-danger-800 dark:bg-danger-900 dark:text-danger-200 mt-2">
          ⚠ Maintenance due!
        </span>
      )}
      {alertLevel === 'soon' && (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200 mt-2">
          Service due soon
        </span>
      )}
    </button>
  );
};
