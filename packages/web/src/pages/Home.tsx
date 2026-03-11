// -----------------------------
// File: web/pages/Home.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdBanner from '../components/AdBanner';
import { deleteVehicle, getVehicles } from '../shared/firestoreService';

interface Vehicle {
  vin: string;
  make: string;
  model: string;
  year: string;
  mileage?: string;
  recallsCount?: number;
}

export default function Home() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    const fetchVehicles = async () => {
      const list = await getVehicles();
      setVehicles(list);
    };
    fetchVehicles();
  }, []);

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
    <div className="max-w-6xl mx-auto px-5 py-5">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        <main>
          <div className="flex items-end justify-between mb-3">
            <h1 className="font-serif font-bold text-4xl text-slate-900 dark:text-slate-100 m-0">
              Vehicle Vitals
            </h1>
            <Link
              to="/add-vehicle"
              className="inline-block px-4 py-2.5 bg-slate-700 text-white dark:bg-slate-300 dark:text-slate-900 rounded-lg border border-slate-700 dark:border-slate-300 hover:opacity-90 transition-opacity no-underline font-medium"
            >
              Add Vehicle
            </Link>
          </div>
          <div className="my-3">
            <AdBanner />
          </div>
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
              {vehicles.map(v => (
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
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <Link
                      to={`/edit-vehicle/${v.vin}`}
                      className="inline-block px-3 py-2 bg-transparent border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors no-underline text-sm"
                    >
                      Open
                    </Link>
                    <button
                      className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white border border-red-500 rounded-lg hover:opacity-90 transition-opacity text-sm font-medium cursor-pointer"
                      onClick={() => handleDelete(v.vin)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <AdBanner />
          </div>
        </aside>
      </div>
    </div>
  );
}
