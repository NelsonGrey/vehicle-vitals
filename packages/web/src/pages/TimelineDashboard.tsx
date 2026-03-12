import { useEffect, useState } from 'react';
import { getMaintenanceEntries, getVehicles } from '../shared/firestoreService';

interface Vehicle {
  vin: string;
  make: string;
  model: string;
  year: string;
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
  }>;
  vehicle: Vehicle;
}

// Type for raw data from Firestore service
interface FirestoreMaintenanceEntry {
  id: string;
  title: string;
  notes?: string;
  cost?: number;
  createdAt?: any;
  updatedAt?: any;
}

export default function TimelineDashboard() {
  const [maintenanceEntries, setMaintenanceEntries] = useState<
    MaintenanceEntry[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const vehiclesList = await getVehicles();

        // Load maintenance entries for all vehicles
        const allEntries: MaintenanceEntry[] = [];
        for (const vehicle of vehiclesList) {
          const entries = await getMaintenanceEntries(vehicle.vin);
          allEntries.push(
            ...entries.map(
              (entry: FirestoreMaintenanceEntry): MaintenanceEntry => ({
                ...entry,
                date:
                  entry.createdAt?.toDate?.()?.toISOString() ||
                  new Date().toISOString(),
                cost: entry.cost?.toString(),
                vehicle: {
                  vin: vehicle.vin,
                  make: vehicle.make,
                  model: vehicle.model,
                  year: vehicle.year,
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
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-5 py-5">
        <div className="flex justify-center items-center h-64">
          <div className="text-slate-600 dark:text-slate-400">
            Loading timeline...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-5 py-5">
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

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mt-0 mb-4">
            Timeline Summary
          </h2>
          <div className="space-y-3">
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0 mb-1">
                Entries logged
              </p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100 m-0">
                {maintenanceEntries.length}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0 mb-1">
                Latest activity
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 m-0">
                {maintenanceEntries[0]
                  ? new Date(maintenanceEntries[0].date).toLocaleDateString()
                  : 'No history yet'}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 text-sm text-slate-600 dark:text-slate-400">
              Each event includes its vehicle, recorded cost, notes, and any
              uploaded attachments.
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          {maintenanceEntries.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-slate-500 dark:text-slate-400 text-lg mb-2">
                No maintenance history yet
              </div>
              <div className="text-slate-400 dark:text-slate-500">
                Add maintenance entries to your vehicles to see the timeline
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-300 dark:bg-slate-600"></div>

              <div className="space-y-8">
                {maintenanceEntries.map((entry, index) => (
                  <div
                    key={entry.id || index}
                    className="relative flex items-start"
                  >
                    <div className="flex-shrink-0 w-4 h-4 bg-slate-500 dark:bg-slate-400 rounded-full mt-6 ml-6 border-4 border-white dark:border-slate-800"></div>

                    <div className="ml-12 flex-1">
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-start mb-3 gap-4">
                          <div>
                            <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mt-0 mb-1">
                              {entry.title}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 m-0">
                              {entry.vehicle.make} {entry.vehicle.model} (
                              {entry.vehicle.year}) • {entry.vehicle.vin}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                              ${(entry as MaintenanceEntry).cost || '0.00'}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              {new Date(entry.date).toLocaleDateString()}
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
                              {entry.attachments.map((attachment, attIndex) => (
                                <div
                                  key={attIndex}
                                  className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded-md"
                                >
                                  {attachment.type?.startsWith('image/') ? (
                                    <img
                                      src={attachment.url}
                                      alt={attachment.name}
                                      className="w-8 h-8 object-cover rounded"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 bg-slate-200 dark:bg-slate-600 rounded flex items-center justify-center">
                                      <span className="text-xs">DOC</span>
                                    </div>
                                  )}
                                  <span className="text-sm text-slate-700 dark:text-slate-300">
                                    {attachment.name}
                                  </span>
                                </div>
                              ))}
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
