// -----------------------------
// File: web/pages/Home.jsx
import { getUpcomingMaintenance } from '@vehicle-vitals/shared';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdPlacement from '../components/AdPlacement';
import CostAnalysisReportlet from '../components/CostAnalysisReportlet';
import { useAuth } from '../shared/AuthContext';
import { bobDemoVehicleCount, seedBobDemo } from '../shared/devSeed';
import { showDemoSeedControls } from '../shared/environment';
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

interface UpcomingItem {
  id: string;
  description: string;
  milesUntilDue: number;
  nextDueMileage: number;
}

type AlertLevel = 'urgent' | 'soon' | null;

interface VehicleAlert {
  level: AlertLevel;
  items: UpcomingItem[];
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
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isBackfillingInsights, setIsBackfillingInsights] = useState(false);
  const [backfillMessage, setBackfillMessage] = useState<string | null>(null);
  const [isSeedingDemo, setIsSeedingDemo] = useState(false);
  const [selectedVin, setSelectedVin] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicleAlerts, setVehicleAlerts] = useState<
    Record<string, VehicleAlert>
  >({});

  const refreshVehicles = async () => {
    const list = await getVehicles();
    setVehicles(list);
  };

  const normalizedSearch = searchTerm.toLowerCase();
  const filteredVehicles = vehicles.filter(v => {
    if (!normalizedSearch) return true;
    const yearText = String(v.year ?? '').toLowerCase();
    const makeText = String(v.make ?? '').toLowerCase();
    const modelText = String(v.model ?? '').toLowerCase();
    const vinText = String(v.vin ?? '').toLowerCase();

    return (
      yearText.includes(normalizedSearch) ||
      makeText.includes(normalizedSearch) ||
      modelText.includes(normalizedSearch) ||
      vinText.includes(normalizedSearch)
    );
  });

  useEffect(() => {
    const fetchVehicles = async () => {
      await refreshVehicles();
    };
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (vehicles.length === 0) return;
    const alerts: Record<string, VehicleAlert> = {};
    for (const v of vehicles) {
      const mileage = parseInt(v.mileage || '0', 10);
      if (!mileage || !v.make || !v.model) continue;
      const items = getUpcomingMaintenance(
        v.make,
        v.model,
        mileage,
        mileage + 10000
      ) as UpcomingItem[];
      if (items.length === 0) continue;
      let level: AlertLevel = null;
      for (const item of items) {
        if (item.milesUntilDue <= 1000) {
          level = 'urgent';
          break;
        }
        if (item.milesUntilDue <= 5000) level = 'soon';
      }
      alerts[v.vin] = { level, items: items.slice(0, 3) };
    }
    setVehicleAlerts(alerts);
  }, [vehicles]);

  useEffect(() => {
    if (vehicles.length === 0) {
      if (selectedVin !== null) {
        setSelectedVin(null);
      }
      return;
    }

    const hasSelectedVehicle = vehicles.some(
      vehicle => vehicle.vin === selectedVin
    );
    if (!hasSelectedVehicle) {
      setSelectedVin(vehicles[0].vin);
    }
  }, [selectedVin, vehicles]);

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

    await refreshVehicles();

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
      await refreshVehicles();
    } catch (err) {
      alert(
        'Error deleting vehicle: ' +
          (err instanceof Error ? err.message : String(err))
      );
    }
  };

  const handleSeedDemo = async () => {
    try {
      setIsSeedingDemo(true);
      setBackfillMessage(null);
      const details = await seedBobDemo({
        uid: user?.uid || '',
        email: user?.email,
      });
      await refreshVehicles();
      if (details.seededPdfs > 0) {
        setBackfillMessage(
          `Loaded Bob Demo data: ${details.vehiclesCount} vehicles now in garage with ${details.seededPdfs} real PDF attachments.`
        );
      } else {
        const uploadHint =
          details.pdfUploadErrors?.length > 0
            ? ` Upload diagnostics: ${details.pdfUploadErrors.join(' | ')}`
            : ` Upload status: ${details.pdfUploadStatus || 'unknown'}.`;
        setBackfillMessage(
          `Loaded Bob Demo data: ${details.vehiclesCount} vehicles now in garage. Using synthetic attachment fallback (hosted PDF upload unavailable).${uploadHint}`
        );
      }
    } catch (error) {
      setBackfillMessage(
        'Unable to load demo data: ' +
          (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setIsSeedingDemo(false);
    }
  };

  const statusText = backfillMessage
    ? backfillMessage
    : showDemoSeedControls
      ? 'No recent status yet. Click "Load Bob Demo Data" to run document seeding and show upload diagnostics here.'
      : 'No recent status yet. Demo seed controls are disabled in this environment.';

  return (
    <div className="w-full max-w-7xl mx-auto px-5 py-5">
      <main>
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="font-serif font-bold text-4xl text-slate-900 dark:text-slate-100 m-0">
              Vehicle Vitals
            </h1>
            {vehicles.length > 0 && (
              <p className="text-slate-600 dark:text-slate-400 mt-2 mb-0">
                {vehicles.length} vehicle{vehicles.length === 1 ? '' : 's'} in
                garage
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {showDemoSeedControls && (
              <button
                onClick={() => void handleSeedDemo()}
                disabled={isSeedingDemo}
                className="px-4 py-2.5 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSeedingDemo
                  ? 'Loading demo data...'
                  : `Load Bob Demo Data (${bobDemoVehicleCount} vehicles)`}
              </button>
            )}
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
        <div className="mb-4 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-300">
          <p className="m-0 font-semibold text-slate-900 dark:text-slate-100">
            Status
          </p>
          <p className="m-0 mt-1">{statusText}</p>
        </div>
        {vehicles.length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 my-4">
            <h3 className="font-serif font-semibold text-xl text-slate-900 dark:text-slate-100 mb-2">
              No vehicles yet
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-3">
              Get started by adding your first vehicle. You can use VIN decode
              to speed things up.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/add-vehicle"
                className="inline-block px-4 py-2.5 bg-slate-700 text-white dark:bg-slate-300 dark:text-slate-900 rounded-lg border border-slate-700 dark:border-slate-300 hover:opacity-90 transition-opacity no-underline font-medium"
              >
                Add your first vehicle
              </Link>
              {showDemoSeedControls && (
                <button
                  onClick={() => void handleSeedDemo()}
                  disabled={isSeedingDemo}
                  className="inline-block px-4 py-2.5 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSeedingDemo
                    ? 'Loading demo data...'
                    : `Load Bob Demo Data (${bobDemoVehicleCount} vehicles)`}
                </button>
              )}
            </div>
          </div>
        ) : (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Column: Vehicle List */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
              <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mt-0 mb-3 px-1">
                Vehicles
              </h2>
              <div className="mb-3">
                <input
                  type="search"
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                  placeholder="Search by year, make, model, or VIN"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="space-y-2 max-h-[70dvh] overflow-y-auto pr-1">
                {filteredVehicles.map((v, index) => {
                  const isSelected = v.vin === selectedVin;
                  const portfolioProgress = getPortfolioRequiredProgress(v);
                  return (() => {
                    const vinText = String(v.vin ?? '').trim();
                    const makeText = String(v.make ?? '').trim();
                    const modelText = String(v.model ?? '').trim();
                    const yearText = String(v.year ?? '').trim();
                    const isPhantom =
                      !vinText || !makeText || !modelText || !yearText;

                    if (isPhantom) {
                      return (
                        <div
                          key={vinText || `phantom-${index}`}
                          className="w-full text-left rounded-lg border border-dashed border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-3"
                        >
                          <div className="font-medium text-red-700 dark:text-red-400 text-sm line-clamp-1">
                            Corrupted entry
                          </div>
                          <div className="text-xs text-red-500 dark:text-red-500 line-clamp-1 mb-2">
                            ID: {vinText || 'Missing document ID'}
                          </div>
                          <div className="text-xs text-red-600 dark:text-red-400 mb-2">
                            Missing vehicle year/make/model fields
                          </div>
                          <button
                            type="button"
                            className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 rounded transition-colors cursor-pointer"
                            onClick={() => handleDelete(vinText)}
                            disabled={!vinText}
                          >
                            Delete
                          </button>
                        </div>
                      );
                    }
                    return (
                      <button
                        key={vinText}
                        type="button"
                        onClick={() => setSelectedVin(vinText)}
                        className={`w-full text-left rounded-lg border p-3 transition-colors ${
                          isSelected
                            ? 'border-slate-500 bg-slate-100 dark:bg-slate-700'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/70'
                        }`}
                      >
                        <div className="font-medium text-slate-900 dark:text-slate-100 line-clamp-1">
                          {yearText} {makeText} {modelText}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                          {vinText}
                          {v.mileage ? ` • ${v.mileage} mi` : ''}
                        </div>
                        {Number(v.recallsCount || 0) > 0 && (
                          <div className="mt-1.5 text-xs">
                            <span className="inline-block rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 px-2 py-0.5">
                              {v.recallsCount} recall
                              {Number(v.recallsCount) === 1 ? '' : 's'}
                            </span>
                          </div>
                        )}
                        {portfolioProgress.required > 0 && (
                          <div className="mt-1 text-xs">
                            <span className="inline-block rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 px-2 py-0.5">
                              Records: {portfolioProgress.complete}/
                              {portfolioProgress.required}
                            </span>
                          </div>
                        )}
                        {vehicleAlerts[v.vin]?.level === 'urgent' && (
                          <div className="mt-1 text-xs">
                            <span className="inline-block rounded-full bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200 px-2 py-0.5">
                              ⚠ Maintenance due!
                            </span>
                          </div>
                        )}
                        {vehicleAlerts[v.vin]?.level === 'soon' && (
                          <div className="mt-1 text-xs">
                            <span className="inline-block rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200 px-2 py-0.5">
                              Service due soon
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })();
                })}
                {filteredVehicles.length === 0 && (
                  <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 p-4 text-sm text-slate-600 dark:text-slate-400">
                    No vehicles match this search.
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Vehicle Details */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              {!selectedVin ? (
                <p className="text-slate-600 dark:text-slate-400 m-0">
                  Select a vehicle to view details.
                </p>
              ) : (
                (() => {
                  const selectedVehicle = vehicles.find(
                    v => v.vin === selectedVin
                  );
                  if (!selectedVehicle) {
                    return (
                      <p className="text-slate-600 dark:text-slate-400 m-0">
                        Vehicle not found.
                      </p>
                    );
                  }

                  const portfolioProgress =
                    getPortfolioRequiredProgress(selectedVehicle);

                  return (
                    <>
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <h3 className="font-semibold text-xl text-slate-900 dark:text-slate-100 mt-0 mb-1">
                            {selectedVehicle.year} {selectedVehicle.make}{' '}
                            {selectedVehicle.model}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 m-0">
                            VIN: {selectedVehicle.vin}
                            {selectedVehicle.mileage
                              ? ` • ${selectedVehicle.mileage} mi`
                              : ''}
                          </p>
                        </div>
                      </div>

                      {/* Vehicle Status Badges */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {Number(selectedVehicle.recallsCount || 0) > 0 && (
                          <span className="inline-block rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 px-2.5 py-1 text-xs font-medium">
                            {selectedVehicle.recallsCount} open recall
                            {Number(selectedVehicle.recallsCount) === 1
                              ? ''
                              : 's'}
                          </span>
                        )}
                        {portfolioProgress.required > 0 && (
                          <span className="inline-block rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 px-2.5 py-1 text-xs font-medium">
                            Records: {portfolioProgress.complete}/
                            {portfolioProgress.required} required complete
                          </span>
                        )}
                        {selectedVehicle.vinInsights && (
                          <span className="inline-block rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200 px-2.5 py-1 text-xs font-medium">
                            VIN insights loaded
                          </span>
                        )}
                      </div>

                      {/* Upcoming Maintenance */}
                      {vehicleAlerts[selectedVehicle.vin] && (
                        <div className="mb-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 m-0">
                              Upcoming Maintenance
                            </h4>
                            <Link
                              to="/app/upcoming"
                              className="text-xs text-blue-600 dark:text-blue-400 no-underline hover:underline"
                            >
                              View all →
                            </Link>
                          </div>
                          <ul className="space-y-1.5 m-0 p-0 list-none">
                            {vehicleAlerts[selectedVehicle.vin].items.map(
                              item => {
                                const isUrgent = item.milesUntilDue <= 1000;
                                const isSoon = item.milesUntilDue <= 5000;
                                return (
                                  <li
                                    key={item.id}
                                    className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300"
                                  >
                                    <span
                                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                        isUrgent
                                          ? 'bg-red-500'
                                          : isSoon
                                            ? 'bg-orange-400'
                                            : 'bg-slate-300'
                                      }`}
                                    />
                                    <span className="flex-1">
                                      {item.description}
                                    </span>
                                    <span
                                      className={`font-medium ${
                                        isUrgent
                                          ? 'text-red-600 dark:text-red-400'
                                          : isSoon
                                            ? 'text-orange-600 dark:text-orange-400'
                                            : 'text-slate-500 dark:text-slate-400'
                                      }`}
                                    >
                                      {item.milesUntilDue <= 0
                                        ? 'Due now'
                                        : `${item.milesUntilDue.toLocaleString()} mi`}
                                    </span>
                                  </li>
                                );
                              }
                            )}
                          </ul>
                        </div>
                      )}

                      {/* Cost of Ownership */}
                      <div className="mb-1">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                          Cost of Ownership
                        </p>
                        <CostAnalysisReportlet vehicle={selectedVehicle} />
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Link
                          to={`/edit-vehicle/${selectedVehicle.vin}`}
                          className="inline-block px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors no-underline text-sm font-medium"
                        >
                          Edit Vehicle
                        </Link>
                        <Link
                          to={`/app/records/${selectedVehicle.vin}`}
                          className="inline-block px-3 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors no-underline text-sm font-medium"
                        >
                          View Records
                        </Link>
                        <button
                          className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 rounded-lg transition-colors text-sm font-medium cursor-pointer"
                          onClick={() => handleDelete(selectedVehicle.vin)}
                        >
                          Delete Vehicle
                        </button>
                      </div>
                      <AdPlacement
                        placement="sidebar"
                        className="mt-4 hidden lg:block"
                      />
                    </>
                  );
                })()
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
