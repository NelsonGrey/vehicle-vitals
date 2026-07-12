// -----------------------------
// File: web/pages/Home.jsx
import {
  computeVehicleHealthSnapshot,
  getUpcomingMaintenance,
} from '@vehicle-vitals/shared';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import CostAnalysisReportlet from '../components/CostAnalysisReportlet';
import { CachedImage } from '../components/CachedImage';
import VehicleHealthPanel from '../components/VehicleHealthPanel';
import { VehicleListItem } from '../components/VehicleListItem';
import { useAuth } from '../shared/AuthContext';
import { bobDemoVehicleCount, seedBobDemo } from '../shared/devSeed';
import { resolveVehicleHealthSnapshot } from '../utils/vehicleHealthSnapshot';
import {
  isDemonstrationEnvironment,
  showDemoSeedControls,
} from '../shared/environment';
import {
  deleteVehicle,
  getMaintenanceEntries,
  getVehicles,
  updateVehicle,
} from '../shared/firestoreService';
import { useFeatureFlag, useSubscription } from '../shared/useMonetization';
import { computeGarageCompleteness } from '../utils/garageCompleteness';
import { getHouseholdGarageStatus } from '../utils/householdGarageService';
import {
  buildPersistedVinInsights,
  getVehicleInsights,
} from '../utils/vehicleService';

interface Vehicle {
  vin: string;
  make: string;
  model: string;
  year: string;
  vehicleStatus?: 'active' | 'stored';
  photoUrl?: string;
  photoSource?: string;
  photoAttributionUrl?: string;
  photoAttributionText?: string;
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

interface MaintenanceEntry {
  id?: string;
  title?: string;
  serviceType?: string;
  description?: string;
  date?: string;
  mileage?: string;
  notes?: string;
}

type AlertLevel = 'urgent' | 'soon' | null;

interface VehicleAlert {
  level: AlertLevel;
  items: UpcomingItem[];
}

function getVehicleStatus(vehicle: Vehicle): 'active' | 'stored' {
  return vehicle.vehicleStatus === 'stored' ? 'stored' : 'active';
}

function getPortfolioRequiredProgress(vehicle: Vehicle) {
  const categories = vehicle.documentPortfolio?.categories || [];
  let required = 0;
  let complete = 0;
  let optionalTotal = 0;
  let optionalComplete = 0;

  categories.forEach(category => {
    (category.items || []).forEach(item => {
      if (item.required) {
        required += 1;
        if (item.status === 'ready') {
          complete += 1;
        }
      } else {
        optionalTotal += 1;
        if (item.status === 'ready') {
          optionalComplete += 1;
        }
      }
    });
  });

  return { complete, required, optionalComplete, optionalTotal };
}

export default function Home() {
  const { user } = useAuth();
  const { tier } = useSubscription();
  const hasPlanning12mo = useFeatureFlag('maintenance_planning_12mo');
  const hasPlanning36mo = useFeatureFlag('maintenance_planning_36mo');
  const showBobDemoSeedControls =
    showDemoSeedControls && isDemonstrationEnvironment;
  const VEHICLE_PAGE_SIZE = 50;
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLastDoc, setVehiclesLastDoc] = useState<unknown>(null);
  const [hasMoreVehicles, setHasMoreVehicles] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isBackfillingInsights, setIsBackfillingInsights] = useState(false);
  const [backfillMessage, setBackfillMessage] = useState<string | null>(null);
  const [isSeedingDemo, setIsSeedingDemo] = useState(false);
  const [selectedVin, setSelectedVin] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicleAlerts, setVehicleAlerts] = useState<
    Record<string, VehicleAlert>
  >({});
  const [maintenanceEntriesByVin, setMaintenanceEntriesByVin] = useState<
    Record<string, MaintenanceEntry[]>
  >({});
  const [loadingHealthVin, setLoadingHealthVin] = useState<string | null>(null);
  const [householdName, setHouseholdName] = useState<string | null>(null);
  // Cap on how many vehicles get a fetched health badge per Home load, same
  // "reasonable effort" cap used on mobile -- large garages shouldn't
  // trigger dozens of parallel maintenance-entry fetches just to render
  // the list.
  const MAX_HEALTH_BADGE_FETCHES = 50;
  const healthFetchInFlightRef = useRef<Set<string>>(new Set());
  const garageCompleteness = useMemo(
    () => computeGarageCompleteness(vehicles),
    [vehicles]
  );

  const applyVehiclePage = useCallback(
    (
      result:
        Vehicle[] | { data: Vehicle[]; lastDoc: unknown; hasMore: boolean },
      append = false
    ) => {
      if (Array.isArray(result)) {
        setVehicles(result);
        setVehiclesLastDoc(null);
        setHasMoreVehicles(false);
        return;
      }

      setVehicles(current =>
        append ? [...current, ...result.data] : result.data
      );
      setVehiclesLastDoc(result.lastDoc);
      setHasMoreVehicles(result.hasMore);
    },
    []
  );

  const refreshVehicles = useCallback(async () => {
    const result = await getVehicles({ pageSize: VEHICLE_PAGE_SIZE });
    applyVehiclePage(
      result as
        | Vehicle[]
        | {
            data: Vehicle[];
            lastDoc: unknown;
            hasMore: boolean;
          }
    );
  }, [VEHICLE_PAGE_SIZE, applyVehiclePage]);

  const loadMoreVehicles = useCallback(async () => {
    if (!hasMoreVehicles || !vehiclesLastDoc || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);
    try {
      const result = await getVehicles({
        pageSize: VEHICLE_PAGE_SIZE,
        startAfter: vehiclesLastDoc,
      });
      applyVehiclePage(
        result as
          | Vehicle[]
          | {
              data: Vehicle[];
              lastDoc: unknown;
              hasMore: boolean;
            },
        true
      );
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    VEHICLE_PAGE_SIZE,
    applyVehiclePage,
    hasMoreVehicles,
    isLoadingMore,
    vehiclesLastDoc,
  ]);

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
  const activeVehicles = filteredVehicles.filter(
    vehicle => getVehicleStatus(vehicle) === 'active'
  );
  const storedVehicles = filteredVehicles.filter(
    vehicle => getVehicleStatus(vehicle) === 'stored'
  );

  useEffect(() => {
    const fetchVehicles = async () => {
      await refreshVehicles();
    };
    fetchVehicles();
  }, [refreshVehicles]);

  useEffect(() => {
    let isActive = true;

    const loadHouseholdBadge = async () => {
      try {
        const status = await getHouseholdGarageStatus();
        if (!isActive) return;
        setHouseholdName(
          status.orgType === 'household' ? status.name || null : null
        );
      } catch (error) {
        console.warn('Unable to load household garage badge', error);
      }
    };

    void loadHouseholdBadge();

    return () => {
      isActive = false;
    };
  }, [user]);

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

    const hasSelectedVehicle = filteredVehicles.some(
      vehicle => vehicle.vin === selectedVin
    );
    if (!hasSelectedVehicle) {
      setSelectedVin(filteredVehicles[0]?.vin || null);
    }
  }, [filteredVehicles, selectedVin, vehicles.length]);

  useEffect(() => {
    if (!selectedVin || maintenanceEntriesByVin[selectedVin]) {
      return;
    }

    let isActive = true;
    setLoadingHealthVin(selectedVin);

    void getMaintenanceEntries(selectedVin)
      .then(entries => {
        if (!isActive) {
          return;
        }

        setMaintenanceEntriesByVin(current => ({
          ...current,
          [selectedVin]: Array.isArray(entries) ? entries : [],
        }));
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setMaintenanceEntriesByVin(current => ({
          ...current,
          [selectedVin]: [],
        }));
      })
      .finally(() => {
        if (isActive) {
          setLoadingHealthVin(current =>
            current === selectedVin ? null : current
          );
        }
      });

    return () => {
      isActive = false;
    };
  }, [maintenanceEntriesByVin, selectedVin]);

  // Fetch maintenance entries for every visible vehicle (not just the
  // selected one) so the garage list can show a health badge per row and an
  // aggregate "Garage Health" banner, without a second/duplicate calculation.
  useEffect(() => {
    const inFlight = healthFetchInFlightRef.current;
    const missing = filteredVehicles
      .slice(0, MAX_HEALTH_BADGE_FETCHES)
      .map(v => v.vin)
      .filter(
        vin => vin && !maintenanceEntriesByVin[vin] && !inFlight.has(vin)
      );
    if (missing.length === 0) return;

    missing.forEach(vin => inFlight.add(vin));
    let isActive = true;

    void Promise.all(
      missing.map(vin =>
        getMaintenanceEntries(vin)
          .then(entries => ({
            vin,
            entries: Array.isArray(entries) ? entries : [],
          }))
          .catch(() => ({ vin, entries: [] as MaintenanceEntry[] }))
      )
    ).then(results => {
      missing.forEach(vin => inFlight.delete(vin));
      if (!isActive) return;
      setMaintenanceEntriesByVin(current => {
        const next = { ...current };
        for (const { vin, entries } of results) {
          next[vin] = entries;
        }
        return next;
      });
    });

    return () => {
      isActive = false;
    };
  }, [filteredVehicles, maintenanceEntriesByVin]);

  const healthSnapshotByVin: Record<
    string,
    ReturnType<typeof computeVehicleHealthSnapshot>
  > = {};
  for (const vehicle of filteredVehicles) {
    const entries = maintenanceEntriesByVin[vehicle.vin];
    if (!entries) continue;
    healthSnapshotByVin[vehicle.vin] = resolveVehicleHealthSnapshot(
      vehicle,
      entries
    );
  }

  const healthScores = Object.values(healthSnapshotByVin).map(
    snapshot => snapshot.overallHealthScore
  );
  const garageHealthSummary =
    healthScores.length === 0
      ? null
      : {
          total: healthScores.length,
          attentionCount: healthScores.filter(score => score < 80).length,
        };

  const backfillVinInsights = useCallback(
    async (automatic = false) => {
      const candidates = vehicles.filter(
        vehicle => vehicle.vin?.length === 17 && !vehicle.vinInsights
      );

      if (candidates.length === 0) {
        if (!automatic) {
          setBackfillMessage('All vehicles already have full VIN insights.');
        }
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
          console.error(
            `VIN insight backfill failed for ${vehicle.vin}`,
            error
          );
          failureCount += 1;
        }
      }

      await refreshVehicles();

      const modeLabel = automatic ? 'Auto VIN sync' : 'VIN insights backfill';
      if (failureCount === 0) {
        setBackfillMessage(
          `${modeLabel} complete: ${successCount} vehicle${successCount === 1 ? '' : 's'} updated.`
        );
      } else {
        setBackfillMessage(
          `${modeLabel} finished: ${successCount} updated, ${failureCount} failed. Automatic retry will continue.`
        );
      }

      setIsBackfillingInsights(false);
    },
    [refreshVehicles, vehicles]
  );

  useEffect(() => {
    const hasCandidates = vehicles.some(
      vehicle => vehicle.vin?.length === 17 && !vehicle.vinInsights
    );

    if (!hasCandidates || isBackfillingInsights) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      if (cancelled || isBackfillingInsights) {
        return;
      }
      await backfillVinInsights(true);
    };

    void run();
    const intervalId = window.setInterval(() => {
      void run();
    }, 45000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [backfillVinInsights, isBackfillingInsights, vehicles]);

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
    : showBobDemoSeedControls
      ? 'No recent status yet. Use "Load Bob Demo Data" to seed demonstration fixtures. VIN insight sync runs automatically.'
      : 'No recent status yet. Demo seed controls are disabled in this environment.';

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-5 py-5">
      <main>
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="font-serif font-bold text-4xl text-slate-900 dark:text-slate-100 m-0">
              Garage
            </h1>
            {householdName && (
              <p className="mt-1 mb-0 inline-flex items-center gap-1 text-xs font-medium text-accent-700 dark:text-accent-300">
                <span aria-hidden="true">🏠</span>
                {householdName} — shared household garage
              </p>
            )}
            {vehicles.length > 0 && (
              <p className="text-slate-600 dark:text-slate-400 mt-2 mb-0">
                {activeVehicles.length} active vehicle
                {activeVehicles.length === 1 ? '' : 's'} in garage
                {storedVehicles.length > 0
                  ? ` • ${storedVehicles.length} in storage`
                  : ''}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {showBobDemoSeedControls && (
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
              Get started by adding your first vehicle. We can look up details
              for some vehicles to make setup quicker.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/add-vehicle"
                className="inline-block px-4 py-2.5 bg-slate-700 text-white dark:bg-slate-300 dark:text-slate-900 rounded-lg border border-slate-700 dark:border-slate-300 hover:opacity-90 transition-opacity no-underline font-medium"
              >
                Add your first vehicle
              </Link>
              {showBobDemoSeedControls && (
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

            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 m-0 mb-3">
                Add a vehicle &rarr; Track service and costs &rarr; Stay on top
                of what&apos;s next
              </p>
              <ol className="list-none p-0 m-0 space-y-3">
                <li className="flex items-start gap-3">
                  <span className="flex-none w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <div>
                    <Link
                      to="/app/add-vehicle"
                      className="font-medium text-teal-700 dark:text-teal-400 no-underline hover:underline"
                    >
                      Add your first vehicle
                    </Link>
                    <p className="text-sm text-slate-500 dark:text-slate-400 m-0 mt-0.5">
                      Enter a VIN or vehicle details to start your garage.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-none w-6 h-6 rounded-full bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <div>
                    <p className="font-medium text-slate-700 dark:text-slate-300 m-0">
                      Log your first service record
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 m-0 mt-0.5">
                      Unlocks once you&apos;ve added a vehicle — track costs,
                      dates, and documents.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-none w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center">
                    3
                  </span>
                  <div>
                    <Link
                      to="/app/upcoming"
                      className="font-medium text-teal-700 dark:text-teal-400 no-underline hover:underline"
                    >
                      Review upcoming maintenance
                    </Link>
                    <p className="text-sm text-slate-500 dark:text-slate-400 m-0 mt-0.5">
                      See what&apos;s due next once your garage has vehicles.
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        ) : (
          <>
            {garageHealthSummary && (
              <div className="mb-4">
                <div
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                    garageHealthSummary.attentionCount > 0
                      ? 'bg-warning-50 text-warning-700 dark:bg-warning-950/30 dark:text-warning-200'
                      : 'bg-accent-50 text-accent-700 dark:bg-accent-950/30 dark:text-accent-200'
                  }`}
                >
                  <span aria-hidden="true">❤</span>
                  <span>
                    Garage Health:{' '}
                    {garageHealthSummary.attentionCount > 0
                      ? `${garageHealthSummary.attentionCount} of ${garageHealthSummary.total} vehicle${garageHealthSummary.total === 1 ? '' : 's'} may need attention`
                      : `all ${garageHealthSummary.total} vehicle${garageHealthSummary.total === 1 ? '' : 's'} looking good`}
                  </span>
                </div>
                <p className="mb-0 mt-1 px-1 text-xs text-slate-500 dark:text-slate-400">
                  Each score estimates remaining life on key maintenance items
                  (oil, brakes, tires, fluids) from mileage and logged service
                  history — a vehicle needs attention below a score of 80.
                  Logging services as you do them is what keeps this accurate;
                  select a vehicle below to see exactly what's due.
                </p>
              </div>
            )}
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
                  {[
                    {
                      key: 'active',
                      title: 'Active Garage',
                      description: 'Daily and regularly used vehicles.',
                      items: activeVehicles,
                    },
                    {
                      key: 'stored',
                      title: 'Storage',
                      description:
                        'Special-use, seasonal, barn, or shed vehicles kept out of the main garage.',
                      items: storedVehicles,
                    },
                  ].map(section => (
                    <div key={section.key}>
                      <div className="px-1 pb-2 pt-1">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          {section.title}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {section.description}
                        </div>
                      </div>
                      <div className="space-y-2">
                        {section.items.map((v, index) => {
                          const isSelected = v.vin === selectedVin;
                          const portfolioProgress =
                            getPortfolioRequiredProgress(v);
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
                                  key={
                                    vinText || `phantom-${section.key}-${index}`
                                  }
                                  className="w-full text-left rounded-lg border border-dashed border-danger-300 dark:border-danger-700 bg-danger-50 dark:bg-danger-900/20 p-3"
                                >
                                  <div className="font-medium text-danger-700 dark:text-danger-400 text-sm line-clamp-1">
                                    Corrupted entry
                                  </div>
                                  <div className="text-xs text-danger-500 dark:text-danger-500 line-clamp-1 mb-2">
                                    ID: {vinText || 'Missing document ID'}
                                  </div>
                                  <div className="text-xs text-danger-600 dark:text-danger-400 mb-2">
                                    Missing vehicle year/make/model fields
                                  </div>
                                  <button
                                    type="button"
                                    className="text-xs px-2 py-1 bg-danger-100 hover:bg-danger-200 text-danger-700 border border-danger-300 rounded transition-colors cursor-pointer"
                                    onClick={() => handleDelete(vinText)}
                                    disabled={!vinText}
                                  >
                                    Delete
                                  </button>
                                </div>
                              );
                            }
                            return (
                              <VehicleListItem
                                key={vinText}
                                vehicle={v}
                                isSelected={isSelected}
                                onSelect={setSelectedVin}
                                alertLevel={vehicleAlerts[v.vin]?.level ?? null}
                                portfolioComplete={portfolioProgress.complete}
                                portfolioRequired={portfolioProgress.required}
                                healthScore={
                                  healthSnapshotByVin[v.vin]?.overallHealthScore
                                }
                              />
                            );
                          })();
                        })}
                        {section.items.length === 0 && (
                          <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 p-4 text-sm text-slate-600 dark:text-slate-400">
                            {section.key === 'stored'
                              ? 'No stored vehicles match this search.'
                              : 'No active vehicles match this search.'}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredVehicles.length === 0 && (
                    <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 p-4 text-sm text-slate-600 dark:text-slate-400">
                      No vehicles match this search.
                    </div>
                  )}
                  {hasMoreVehicles && !normalizedSearch && (
                    <button
                      type="button"
                      onClick={loadMoreVehicles}
                      disabled={isLoadingMore}
                      className="w-full mt-3 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-60"
                    >
                      {isLoadingMore
                        ? 'Loading more vehicles…'
                        : 'Load more vehicles'}
                    </button>
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
                    const selectedVehicle = filteredVehicles.find(
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
                    const healthEntries =
                      maintenanceEntriesByVin[selectedVehicle.vin] ?? [];
                    const isLoadingHealth =
                      loadingHealthVin === selectedVehicle.vin &&
                      !maintenanceEntriesByVin[selectedVehicle.vin];

                    return (
                      <>
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex items-start gap-3">
                            <div className="h-20 w-28 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 flex-shrink-0">
                              {selectedVehicle.photoUrl ? (
                                <CachedImage
                                  src={selectedVehicle.photoUrl}
                                  alt={`${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`}
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
                                {selectedVehicle.year} {selectedVehicle.make}{' '}
                                {selectedVehicle.model}
                              </h3>
                              <p className="text-sm text-slate-600 dark:text-slate-400 m-0">
                                VIN: {selectedVehicle.vin}
                                {selectedVehicle.mileage
                                  ? ` • ${selectedVehicle.mileage} mi`
                                  : ''}
                              </p>
                              {selectedVehicle.photoSource === 'wikimedia' && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-0">
                                  Image source: Wikimedia
                                  {selectedVehicle.photoAttributionUrl && (
                                    <>
                                      {' '}
                                      <a
                                        href={
                                          selectedVehicle.photoAttributionUrl
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 dark:text-blue-400 hover:underline"
                                      >
                                        View source
                                      </a>
                                    </>
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Vehicle Status Badges */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {getVehicleStatus(selectedVehicle) === 'stored' && (
                            <span className="inline-block rounded-full bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 px-2.5 py-1 text-xs font-medium">
                              In storage
                            </span>
                          )}
                          {Number(selectedVehicle.recallsCount || 0) > 0 && (
                            <span className="inline-block rounded-full bg-warning-100 text-warning-800 dark:bg-warning-900/40 dark:text-warning-200 px-2.5 py-1 text-xs font-medium">
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
                            <span className="inline-block rounded-full bg-accent-100 text-accent-800 dark:bg-accent-900/40 dark:text-accent-200 px-2.5 py-1 text-xs font-medium">
                              VIN insights loaded
                            </span>
                          )}
                        </div>

                        <VehicleHealthPanel
                          vehicle={selectedVehicle}
                          maintenanceEntries={healthEntries}
                          tier={tier}
                          hasPlanning12mo={hasPlanning12mo}
                          hasPlanning36mo={hasPlanning36mo}
                          loading={isLoadingHealth}
                          vehicleCompleteness={portfolioProgress}
                          garageCompleteness={garageCompleteness}
                        />

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
                                            ? 'bg-danger-500'
                                            : isSoon
                                              ? 'bg-warning-400'
                                              : 'bg-slate-300'
                                        }`}
                                      />
                                      <span className="flex-1">
                                        {item.description}
                                      </span>
                                      <span
                                        className={`font-medium ${
                                          isUrgent
                                            ? 'text-danger-600 dark:text-danger-400'
                                            : isSoon
                                              ? 'text-warning-600 dark:text-warning-400'
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
                            className="px-3 py-2 bg-danger-100 hover:bg-danger-200 text-danger-700 border border-danger-300 rounded-lg transition-colors text-sm font-medium cursor-pointer"
                            onClick={() => handleDelete(selectedVehicle.vin)}
                          >
                            Delete Vehicle
                          </button>
                        </div>
                      </>
                    );
                  })()
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
