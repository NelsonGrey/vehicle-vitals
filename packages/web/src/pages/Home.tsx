// -----------------------------
// File: web/pages/Home.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  deleteVehicle,
  getVehicles,
  updateVehicle,
} from '../shared/firestoreService';
import {
  buildPersistedVinInsights,
  getVehicleInsights,
} from '../utils/vehicleService';

interface Vehicle {
  vin: string;
  make: string;
  model: string;
  year: string;
  mileage?: string;
  recallsCount?: number;
  vinInsights?: {
    fetchedAt?: string;
  };
  documentPortfolio?: {
    categories?: Array<{
      items?: Array<{ required?: boolean; status?: string }>;
    }>;
  };
}

function getPortfolioRequiredProgress(vehicle: Vehicle) {
  const categories = vehicle.documentPortfolio?.categories || [];
  let required = 0;
  let complete = 0;

  categories.forEach(category => {
    (category.items || []).forEach(item => {
      if (item.required) {
        required += 1;
        if (item.status === 'ready') {
          complete += 1;
        }
      }
    });
  });

  return { complete, required };
}

export default function Home() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isBackfillingInsights, setIsBackfillingInsights] = useState(false);
  const [backfillMessage, setBackfillMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      const list = await getVehicles();
      setVehicles(list);
    };
    fetchVehicles();
  }, []);

  const backfillVinInsights = async () => {
    const candidates = vehicles.filter(
      vehicle => vehicle.vin?.length === 17 && !vehicle.vinInsights
    );

    if (candidates.length === 0) {
      setBackfillMessage('All vehicles already have full VIN insights.');
      return;
    }

    setIsBackfillingInsights(true);
    setBackfillMessage(null);

    let successCount = 0;
    let failureCount = 0;

    for (const vehicle of candidates) {
      try {
        const insights = await getVehicleInsights(vehicle.vin);
        await updateVehicle(vehicle.vin, buildPersistedVinInsights(insights));
        successCount += 1;
      } catch (error) {
        console.error(`VIN insight backfill failed for ${vehicle.vin}`, error);
        failureCount += 1;
      }
    }

    const list = await getVehicles();
    setVehicles(list);

    if (failureCount === 0) {
      setBackfillMessage(
        `VIN insights backfill complete: ${successCount} vehicle${successCount === 1 ? '' : 's'} updated.`
      );
    } else {
      setBackfillMessage(
        `VIN insights backfill finished: ${successCount} updated, ${failureCount} failed.`
      );
    }

    setIsBackfillingInsights(false);
  };

  const handleDelete = async (vin: string) => {
    const ok = window.confirm('Delete this vehicle? This cannot be undone.');
    if (!ok) return;
    try {
      await deleteVehicle(vin);
      const list = await getVehicles();
      setVehicles(list);
    } catch (err) {
      alert(
        'Error deleting vehicle: ' +
          (err instanceof Error ? err.message : String(err))
      );
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-5 py-5">
      <main>
        <div className="flex items-end justify-between mb-3">
          <h1 className="font-serif font-bold text-4xl text-slate-900 dark:text-slate-100 m-0">
            Vehicle Vitals
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void backfillVinInsights()}
              disabled={isBackfillingInsights || vehicles.length === 0}
              className="px-4 py-2.5 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isBackfillingInsights
                ? 'Backfilling VIN...'
                : 'Backfill VIN Data'}
            </button>
            <Link
              to="/add-vehicle"
              className="inline-block px-4 py-2.5 bg-slate-700 text-white dark:bg-slate-300 dark:text-slate-900 rounded-lg border border-slate-700 dark:border-slate-300 hover:opacity-90 transition-opacity no-underline font-medium"
            >
              Add Vehicle
            </Link>
          </div>
        </div>
        {backfillMessage && (
          <div className="mb-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-300">
            {backfillMessage}
          </div>
        )}
        {vehicles.length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 my-4">
            <h3 className="font-serif font-semibold text-xl text-slate-900 dark:text-slate-100 mb-2">
              No vehicles yet
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-3">
              Get started by adding your first vehicle. You can use VIN decode
              to speed things up.
            </p>
            <Link
              to="/add-vehicle"
              className="inline-block px-4 py-2.5 bg-slate-700 text-white dark:bg-slate-300 dark:text-slate-900 rounded-lg border border-slate-700 dark:border-slate-300 hover:opacity-90 transition-opacity no-underline font-medium"
            >
              Add your first vehicle
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-4">
            {vehicles.map(v =>
              (() => {
                const portfolioProgress = getPortfolioRequiredProgress(v);
                return (
                  <div
                    key={v.vin}
                    className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col gap-2"
                  >
                    <div>
                      <div className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                        {v.year} {v.make} {v.model}
                      </div>
                      <div className="text-slate-600 dark:text-slate-400 text-sm">
                        VIN: {v.vin}
                        {v.mileage ? ` • ${v.mileage} mi` : ''}
                      </div>
                      {Number(v.recallsCount || 0) > 0 && (
                        <div className="mt-1 inline-block rounded-full bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200 px-2 py-1 text-xs font-medium">
                          {v.recallsCount} open recall
                          {Number(v.recallsCount) === 1 ? '' : 's'}
                        </div>
                      )}
                      {portfolioProgress.required > 0 && (
                        <div className="mt-1 inline-block rounded-full bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-200 px-2 py-1 text-xs font-medium">
                          Records: {portfolioProgress.complete}/
                          {portfolioProgress.required} required complete
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-auto">
                      <Link
                        to={`/edit-vehicle/${v.vin}`}
                        className="inline-block px-3 py-2 bg-transparent border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors no-underline text-sm"
                      >
                        Open
                      </Link>
                      <Link
                        to={`/app/records/${v.vin}`}
                        className="inline-block px-3 py-2 bg-transparent border border-blue-200 dark:border-blue-700 text-blue-900 dark:text-blue-200 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors no-underline text-sm"
                      >
                        Records
                      </Link>
                      <button
                        className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white border border-red-500 rounded-lg hover:opacity-90 transition-opacity text-sm font-medium cursor-pointer"
                        onClick={() => handleDelete(v.vin)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        )}
      </main>
    </div>
  );
}
