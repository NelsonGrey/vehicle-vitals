import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { coerceFirestoreTimestamp } from '../shared/firestoreTimestamp';
import { formatFileDisplay } from '../shared/fileUtils';
import { getMaintenanceEntries, getVehicles } from '../shared/firestoreService';
import { formatCurrency } from '../utils/currency';
import { buildDocumentSummary } from '../utils/documentAnalysisSummary';

interface Vehicle {
  vin: string;
  make: string;
  model: string;
  year: string;
  licensePlate?: string;
}

interface MaintenanceEntry {
  id?: string;
  title: string;
  notes?: string;
  cost?: string;
  date: string;
  attachments?: Array<{
    name: string;
    url: string;
    type?: string;
    analysis?: {
      extracted?: {
        serviceType?: string;
        totalCost?: number;
        serviceDate?: string;
        mileage?: number;
        documentCategory?: string;
      };
      confidence?: number;
      sourceText?: string;
    };
  }>;
  vehicle: Vehicle;
}

interface DocumentInsight {
  key: string;
  vehicleLabel: string;
  eventDate: string;
  confidence?: number;
  category?: string;
  summary: string;
  extractedCost?: number;
}

function getAnalysisBadge(confidence: number | undefined): {
  label: string;
  className: string;
} {
  if (typeof confidence !== 'number') {
    return {
      label: 'Unscored',
      className:
        'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
    };
  }

  if (confidence >= 0.7) {
    return {
      label: 'Auto-Verified',
      className:
        'bg-accent-100 text-accent-800 dark:bg-accent-900 dark:text-accent-200',
    };
  }

  if (confidence >= 0.4) {
    return {
      label: 'Review Suggested',
      className:
        'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200',
    };
  }

  return {
    label: 'Needs Review',
    className: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
  };
}

// Type for raw data from Firestore service
interface FirestoreMaintenanceEntry {
  id: string;
  title: string;
  notes?: string;
  cost?: number;
  date?: string | any; // ISO string or Firestore Timestamp
  createdAt?: any;
  updatedAt?: any;
}

function resolveVehiclePlate(vehicle: any): string | undefined {
  const candidates = [
    vehicle?.licensePlate,
    vehicle?.plateNumber,
    vehicle?.plate,
  ];

  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

/**
 * Resolves the actual maintenance date from a Firestore entry.
 * Prefers the service date (entry.date) over creation timestamp.
 * Handles Firestore Timestamps, ISO strings, and invalid dates.
 */
function resolveMaintenanceDate(entry: FirestoreMaintenanceEntry): string {
  // Priority 1: Use entry.date if it exists (the actual service date)
  const dateFromEntry = entry.date
    ? coerceFirestoreTimestamp(entry.date)
    : null;
  if (dateFromEntry) {
    return dateFromEntry.toISOString();
  }

  // Priority 2: Fall back to createdAt timestamp
  const dateFromCreatedAt = coerceFirestoreTimestamp(entry.createdAt);
  if (dateFromCreatedAt) {
    return dateFromCreatedAt.toISOString();
  }

  // Priority 3: Last resort - use current time (should not happen in practice)
  console.warn(
    'Maintenance entry has no valid date or createdAt field:',
    entry
  );
  return new Date().toISOString();
}

type TimeFilter = 'all' | 'past' | 'future';

function parseTimeFilter(raw: string | null): TimeFilter {
  return raw === 'past' || raw === 'future' ? raw : 'all';
}

function parseVehicleFilter(raw: string | null): string[] {
  if (raw === null) {
    return [];
  }

  return raw
    .split(',')
    .map(vin => vin.trim())
    .filter(Boolean);
}

export default function TimelineDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const hasVehicleFilterParam = searchParams.has('vins');

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [maintenanceEntries, setMaintenanceEntries] = useState<
    MaintenanceEntry[]
  >([]);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(() =>
    parseTimeFilter(searchParams.get('time'))
  );
  const [selectedVehicleVins, setSelectedVehicleVins] = useState<string[]>(() =>
    parseVehicleFilter(searchParams.get('vins'))
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const vehiclesList = await getVehicles();
        setVehicles(vehiclesList);
        setSelectedVehicleVins(current => {
          const availableVins = new Set(
            vehiclesList.map(vehicle => vehicle.vin)
          );
          const validSelection = current.filter(vin => availableVins.has(vin));

          if (hasVehicleFilterParam) {
            return validSelection;
          }

          return vehiclesList.map(vehicle => vehicle.vin);
        });

        // Load maintenance entries for all vehicles
        const allEntries: MaintenanceEntry[] = [];
        for (const vehicle of vehiclesList) {
          const entries = await getMaintenanceEntries(vehicle.vin);
          allEntries.push(
            ...entries.map(
              (entry: FirestoreMaintenanceEntry): MaintenanceEntry => ({
                ...entry,
                date: resolveMaintenanceDate(entry),
                cost: entry.cost?.toString(),
                vehicle: {
                  vin: vehicle.vin,
                  make: vehicle.make,
                  model: vehicle.model,
                  year: vehicle.year,
                  licensePlate: resolveVehiclePlate(vehicle),
                },
              })
            )
          );
        }

        // Sort by date (most recent first)
        allEntries.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setMaintenanceEntries(allEntries);
      } catch (error) {
        console.error('Error loading timeline data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [hasVehicleFilterParam]);

  useEffect(() => {
    if (loading) {
      return;
    }

    const nextParams = new URLSearchParams();
    if (timeFilter !== 'all') {
      nextParams.set('time', timeFilter);
    }
    if (selectedVehicleVins.length > 0 || hasVehicleFilterParam) {
      nextParams.set('vins', selectedVehicleVins.join(','));
    }

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [
    hasVehicleFilterParam,
    loading,
    searchParams,
    selectedVehicleVins,
    setSearchParams,
    timeFilter,
  ]);

  const now = Date.now();
  const filteredEntries = maintenanceEntries.filter(entry => {
    const vehicleMatch = selectedVehicleVins.includes(entry.vehicle.vin);

    const entryTimestamp = new Date(entry.date).getTime();
    const isFuture = Number.isFinite(entryTimestamp) && entryTimestamp > now;
    const isPast = !isFuture;

    const timeMatch =
      timeFilter === 'all' ||
      (timeFilter === 'past' && isPast) ||
      (timeFilter === 'future' && isFuture);

    return vehicleMatch && timeMatch;
  });

  const documentInsights: DocumentInsight[] = filteredEntries.flatMap(entry =>
    (entry.attachments ?? []).map((attachment, index) => {
      const extracted = attachment.analysis?.extracted;
      const fallbackEventDate = new Date(entry.date).toISOString().slice(0, 10);
      const eventDate = extracted?.serviceDate || fallbackEventDate;
      return {
        key: `${entry.id || entry.date}-${attachment.url}-${index}`,
        vehicleLabel: `${entry.vehicle.year} ${entry.vehicle.make} ${entry.vehicle.model}`,
        eventDate,
        confidence: attachment.analysis?.confidence,
        category: extracted?.documentCategory,
        summary: buildDocumentSummary(
          extracted,
          attachment.analysis?.sourceText
        ),
        extractedCost:
          typeof extracted?.totalCost === 'number'
            ? extracted.totalCost
            : undefined,
      };
    })
  );

  const analyzedDocumentCount = documentInsights.filter(
    insight =>
      insight.summary !== 'No analysis summary available yet' ||
      typeof insight.confidence === 'number'
  ).length;

  const lowConfidenceCount = documentInsights.filter(
    insight =>
      typeof insight.confidence === 'number' && insight.confidence < 0.4
  ).length;

  const extractedDocumentCostTotal = documentInsights.reduce(
    (sum, insight) => sum + (insight.extractedCost ?? 0),
    0
  );

  const documentCategoryCounts = documentInsights.reduce(
    (acc, insight) => {
      const category = (insight.category || 'uncategorized').toLowerCase();
      acc[category] = (acc[category] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const topDocumentCategories = Object.entries(documentCategoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const recentDocumentInsights = [...documentInsights]
    .sort(
      (a, b) =>
        new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
    )
    .slice(0, 8);

  const hasAllVehiclesSelected =
    vehicles.length > 0 && selectedVehicleVins.length === vehicles.length;

  const toggleVehicleSelection = (vin: string) => {
    setSelectedVehicleVins(current =>
      current.includes(vin)
        ? current.filter(selectedVin => selectedVin !== vin)
        : [...current, vin]
    );
  };

  const selectAllVehicles = () => {
    setSelectedVehicleVins(vehicles.map(vehicle => vehicle.vin));
  };

  const clearVehicleSelection = () => {
    setSelectedVehicleVins([]);
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-5 py-5">
        <div className="flex justify-center items-center h-64">
          <div className="text-slate-600 dark:text-slate-400">
            Loading timeline...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-5 py-5">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif font-bold text-3xl text-slate-900 dark:text-slate-100 m-0">
            Maintenance Timeline
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 mb-0">
            Review completed work across the garage in reverse chronological
            order.
          </p>
        </div>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:items-start">
        <div className="lg:col-span-4 lg:sticky lg:top-4 max-h-[calc(100dvh-6rem)] overflow-y-auto bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mt-0 mb-4">
            Timeline Summary
          </h2>

          <div className="space-y-3 mb-4">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0 mb-2">
                Time Range
              </p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ['all', 'All'],
                    ['past', 'Past'],
                    ['future', 'Future'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTimeFilter(value)}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                      timeFilter === value
                        ? 'border-slate-700 bg-slate-700 text-white dark:border-slate-200 dark:bg-slate-200 dark:text-slate-900'
                        : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0 mb-2">
                Vehicles
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                <button
                  type="button"
                  onClick={selectAllVehicles}
                  className="px-2.5 py-1 text-xs rounded-full border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  All Vehicles
                </button>
                <button
                  type="button"
                  onClick={clearVehicleSelection}
                  className="px-2.5 py-1 text-xs rounded-full border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Clear
                </button>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                {vehicles.map(vehicle => {
                  const selected = selectedVehicleVins.includes(vehicle.vin);
                  return (
                    <button
                      key={vehicle.vin}
                      type="button"
                      onClick={() => toggleVehicleSelection(vehicle.vin)}
                      className={`w-full text-left px-2.5 py-2 text-xs rounded-lg border transition-colors ${
                        selected
                          ? 'border-slate-700 bg-slate-100 dark:border-slate-300 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {vehicle.year} {vehicle.make} {vehicle.model}
                      {vehicle.licensePlate ? ` • ${vehicle.licensePlate}` : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0 mb-1">
                Entries logged
              </p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100 m-0">
                {filteredEntries.length}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0 mb-1">
                Latest activity
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 m-0">
                {filteredEntries[0]
                  ? new Date(filteredEntries[0].date).toLocaleDateString()
                  : 'No history yet'}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 text-sm text-slate-600 dark:text-slate-400">
              Each event includes its vehicle, recorded cost, notes, and any
              uploaded attachments.
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 text-xs text-slate-500 dark:text-slate-400">
              Showing:{' '}
              {timeFilter === 'all'
                ? 'All'
                : timeFilter === 'past'
                  ? 'Past'
                  : 'Future'}{' '}
              •{' '}
              {hasAllVehiclesSelected
                ? 'All vehicles'
                : `${selectedVehicleVins.length} selected`}
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0 mb-1">
                Document intelligence
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 m-0">
                {analyzedDocumentCount}/{documentInsights.length} analyzed •{' '}
                {lowConfidenceCount} need review
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-0">
                Extracted document costs:{' '}
                {formatCurrency(extractedDocumentCostTotal)}
              </p>
              {topDocumentCategories.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {topDocumentCategories.map(([category, count]) => (
                    <span
                      key={category}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-[11px]"
                    >
                      {category.replace(/_/g, ' ')}
                      <span className="font-semibold">{count}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 lg:sticky lg:top-4 max-h-[calc(100dvh-6rem)] overflow-y-auto bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          {recentDocumentInsights.length > 0 && (
            <div className="mb-4 rounded-lg border border-slate-200 dark:border-slate-700 p-3">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mt-0 mb-2">
                Recent Document Insights
              </h3>
              <div className="space-y-2">
                {recentDocumentInsights.map(insight => (
                  <div
                    key={insight.key}
                    className="text-xs rounded-md border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-2 py-1.5"
                  >
                    <div className="text-slate-700 dark:text-slate-300">
                      {insight.summary}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {insight.vehicleLabel} • {insight.eventDate} • Confidence:{' '}
                      {typeof insight.confidence === 'number'
                        ? `${Math.round(insight.confidence * 100)}%`
                        : 'n/a'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-slate-500 dark:text-slate-400 text-lg mb-2">
                No timeline entries match the current filters
              </div>
              <div className="text-slate-400 dark:text-slate-500">
                Try switching time range or selecting different vehicles.
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-24 top-0 bottom-0 w-0.5 bg-slate-300 dark:bg-slate-600"></div>

              <div className="space-y-8">
                {filteredEntries.map((entry, index) => (
                  <div
                    key={entry.id || index}
                    className="relative flex items-start"
                  >
                    <div className="w-20 shrink-0 pt-6 pr-2 text-right text-xs font-medium text-slate-500 dark:text-slate-400">
                      {new Date(entry.date).toLocaleDateString()}
                    </div>

                    <div className="shrink-0 w-4 h-4 bg-slate-500 dark:bg-slate-400 rounded-full mt-6 ml-2 border-4 border-white dark:border-slate-800"></div>

                    <div className="ml-8 flex-1">
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-start mb-3 gap-4">
                          <div>
                            <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mt-0 mb-1">
                              {entry.title}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 m-0">
                              {entry.vehicle.make} {entry.vehicle.model} (
                              {entry.vehicle.year}) • {entry.vehicle.vin}
                              {entry.vehicle.licensePlate
                                ? ` • Plate: ${entry.vehicle.licensePlate}`
                                : ''}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                              {formatCurrency(
                                Number((entry as MaintenanceEntry).cost) || 0
                              )}
                            </div>
                          </div>
                        </div>

                        {entry.notes && (
                          <p className="text-slate-700 dark:text-slate-300 mb-3">
                            {entry.notes}
                          </p>
                        )}

                        {entry.attachments && entry.attachments.length > 0 && (
                          <div className="border-t border-slate-200 dark:border-slate-600 pt-3">
                            <div className="flex flex-wrap gap-2">
                              {entry.attachments.map((attachment, attIndex) => {
                                const fileDisplay = formatFileDisplay(
                                  attachment.name,
                                  undefined,
                                  attachment.type
                                );
                                const badge = getAnalysisBadge(
                                  attachment.analysis?.confidence
                                );
                                const extracted =
                                  attachment.analysis?.extracted;
                                const summaryText = buildDocumentSummary(
                                  extracted,
                                  undefined
                                );
                                return (
                                  <div
                                    key={attIndex}
                                    className="flex items-start gap-2 p-2 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700"
                                  >
                                    {attachment.type?.startsWith('image/') ? (
                                      <img
                                        src={attachment.url}
                                        alt={attachment.name}
                                        className="w-8 h-8 object-cover rounded"
                                      />
                                    ) : (
                                      <span className="text-base">
                                        {fileDisplay.icon}
                                      </span>
                                    )}
                                    <div>
                                      <span className="text-sm text-slate-700 dark:text-slate-300">
                                        {attachment.name}
                                      </span>
                                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                                        <span
                                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${badge.className}`}
                                        >
                                          {badge.label}
                                        </span>
                                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                          {summaryText}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
