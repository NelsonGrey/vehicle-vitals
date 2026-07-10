import { CachedImage } from './CachedImage';

interface Vehicle {
  vin: string;
  make: string;
  model: string;
  year: string;
  mileage?: string;
  photoUrl?: string;
  purchaseDate?: string;
}

interface VehicleDetailsProps {
  vehicle: Vehicle;
  onEdit: () => void;
  onDelete: () => void;
}

export const VehicleDetails: React.FC<VehicleDetailsProps> = ({
  vehicle,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="h-20 w-28 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 flex-shrink-0">
          {vehicle.photoUrl ? (
            <CachedImage
              src={vehicle.photoUrl}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              className="h-full w-full object-cover"
              width={112}
              height={80}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-slate-400 text-2xl">
              🚗
            </div>
          )}
        </div>
        <div>
          <h3 className="font-semibold text-xl text-slate-900 dark:text-slate-100 mt-0 mb-1">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 m-0">
            VIN: {vehicle.vin}
            {vehicle.mileage ? ` • ${vehicle.mileage} mi` : ''}
          </p>
          {vehicle.purchaseDate && (
            <p className="text-xs text-slate-500 dark:text-slate-400 m-0 mt-1">
              Purchased: {vehicle.purchaseDate}
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="px-3 py-1.5 text-sm font-medium text-danger-700 bg-white border border-danger-300 rounded-md hover:bg-danger-50 dark:bg-slate-800 dark:text-danger-400 dark:border-danger-900 dark:hover:bg-danger-900/20"
        >
          Delete
        </button>
      </div>
    </div>
  );
};
