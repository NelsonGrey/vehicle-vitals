import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getVehicle } from '../shared/firestoreService';
import { getOwnerManuals, getWarrantySummary } from '../utils/vehicleService';
import {
  formatCoverageTypeLabel,
  type WarrantySummary,
} from '../utils/warranty';

type VehicleRecord = {
  vin: string;
  year: string | number;
  make: string;
  model: string;
  mileage?: number;
};

type OwnerManualDocument = {
  id: string;
  title: string;
  url: string;
};

export default function Coverage() {
  const { vin } = useParams();
  const [vehicle, setVehicle] = useState<VehicleRecord | null>(null);
  const [warranty, setWarranty] = useState<WarrantySummary | null>(null);
  const [manuals, setManuals] = useState<OwnerManualDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!vin) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const v = await getVehicle(vin);
        if (cancelled) return;
        if (!v) {
          setError('Vehicle not found.');
          setLoading(false);
          return;
        }
        setVehicle(v);

        const [warrantyResult, manualsResult] = await Promise.all([
          getWarrantySummary(
            v.vin,
            typeof v.mileage === 'number' && v.mileage > 0
              ? v.mileage
              : undefined
          ),
          getOwnerManuals(v.vin),
        ]);

        if (cancelled) return;
        setWarranty(warrantyResult);
        setManuals(manualsResult);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : 'Coverage and manuals could not be loaded.'
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [vin]);

  if (loading) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-5 py-5">
        <p className="text-slate-500 dark:text-slate-400">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-5 py-5">
        <p className="text-danger-600 dark:text-danger-400">{error}</p>
        <Link
          to="/"
          className="text-blue-700 dark:text-blue-400 hover:underline"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-5 py-5">
      {vehicle && (
        <h1 className="font-serif font-bold text-3xl text-slate-900 dark:text-slate-100 m-0 mb-1">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h1>
      )}
      <p className="text-slate-500 dark:text-slate-400 mb-5">
        Coverage & Manuals
      </p>

      {warranty && (
        <section className="mb-6 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-xl text-slate-900 dark:text-slate-100 m-0">
              Warranty Coverage
            </h2>
            <span
              className={`text-xs font-semibold px-2 py-1 rounded-full ${
                warranty.status === 'active'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-danger-100 text-danger-700 dark:bg-danger-900/40 dark:text-danger-300'
              }`}
            >
              {warranty.status === 'active' ? 'Active' : 'Expired'}
            </span>
          </div>

          {!warranty.brandSpecific && (
            <p className="text-xs italic text-slate-500 dark:text-slate-400 mb-3">
              No manufacturer data on file for this make — showing a generic
              estimate.
            </p>
          )}

          <ul className="space-y-3 mb-4">
            {warranty.coverages.map(coverage => (
              <li
                key={coverage.type}
                className="border-b border-slate-100 dark:border-slate-700 pb-3 last:border-b-0 last:pb-0"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {formatCoverageTypeLabel(coverage.type)}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {coverage.maxMileage !== null
                      ? `${coverage.maxMileage.toLocaleString()} mi cap`
                      : 'Unlimited miles'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
                  {coverage.startDate} to {coverage.endDate}
                  {coverage.remainingMileage !== null &&
                    ` • ${coverage.remainingMileage.toLocaleString()} mi remaining`}
                </p>
                {coverage.note && (
                  <p className="text-xs italic text-slate-500 dark:text-slate-400 mt-1 m-0">
                    {coverage.note}
                  </p>
                )}
              </li>
            ))}
          </ul>

          <p className="text-xs text-slate-400 dark:text-slate-500 m-0">
            {warranty.notes}
          </p>
        </section>
      )}

      <section className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
        <h2 className="font-semibold text-xl text-slate-900 dark:text-slate-100 mt-0 mb-3">
          Owner&apos;s Manual
        </h2>
        {manuals.length === 0 ? (
          <p className="text-sm italic text-slate-500 dark:text-slate-400">
            No owner manual link is available for this vehicle yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {manuals.map(manual => (
              <li key={manual.id}>
                <a
                  href={manual.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 dark:text-blue-400 hover:underline"
                >
                  {manual.title} ↗
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
