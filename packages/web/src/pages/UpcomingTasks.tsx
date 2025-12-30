import { getUpcomingMaintenance } from '@vehicle-vitals/shared';
import { useEffect, useState } from 'react';
import { getVehicles } from '../shared/firestoreService';

interface UpcomingMaintenanceItem {
  id: string;
  description: string;
  frequency: string;
  interval: number;
  nextDueMileage: number;
  milesUntilDue: number;
}

interface Vehicle {
  vin: string;
  make: string;
  model: string;
  year: string;
  mileage?: string;
}

interface UpcomingItem {
  id: string;
  serviceType?: string;
  description: string;
  frequency: string;
  interval: number;
  nextDueMileage: number;
  milesUntilDue: number;
  vehicle: Vehicle;
}

export default function UpcomingTasks() {
  const [upcomingItems, setUpcomingItems] = useState<UpcomingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUpcomingTasks = async () => {
      try {
        const vehicles = await getVehicles();

        const allUpcoming: UpcomingItem[] = [];

        for (const vehicle of vehicles) {
          const currentMileage = parseInt(vehicle.mileage || '0') || 0;
          const upcoming = getUpcomingMaintenance(
            vehicle.make,
            vehicle.model,
            currentMileage
          );

          allUpcoming.push(
            ...upcoming.map((item: UpcomingMaintenanceItem) => ({
              id: item.id,
              serviceType: item.id,
              description: item.description,
              frequency: item.frequency,
              interval: item.interval,
              nextDueMileage: item.nextDueMileage,
              milesUntilDue: item.milesUntilDue,
              vehicle: {
                vin: vehicle.vin,
                make: vehicle.make,
                model: vehicle.model,
                year: vehicle.year,
              },
            }))
          );
        }

        // Sort by miles until due (most urgent first)
        allUpcoming.sort((a, b) => a.milesUntilDue - b.milesUntilDue);

        setUpcomingItems(allUpcoming);
      } catch (error) {
        console.error('Error loading upcoming tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUpcomingTasks();
  }, []);

  const getUrgencyColor = (milesUntilDue: number) => {
    if (milesUntilDue <= 1000) return 'text-red-600 bg-red-50 border-red-200';
    if (milesUntilDue <= 5000)
      return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getUrgencyLabel = (milesUntilDue: number) => {
    if (milesUntilDue <= 1000) return 'Urgent';
    if (milesUntilDue <= 5000) return 'Soon';
    return 'Upcoming';
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-5 py-5">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
          <span className="ml-3 text-slate-600">Loading upcoming tasks...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-5 py-5">
      <div className="mb-6">
        <h1 className="font-serif font-bold text-4xl text-slate-900 dark:text-slate-100 m-0 mb-2">
          Upcoming Tasks
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Stay ahead of maintenance with upcoming service recommendations for
          all your vehicles.
        </p>
      </div>

      {upcomingItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            All caught up!
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            No upcoming maintenance tasks found. Your vehicles are well
            maintained.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {upcomingItems.map((item, index) => (
            <div
              key={`${item.vehicle.vin}-${item.serviceType}-${index}`}
              className={`border rounded-lg p-6 ${getUrgencyColor(item.milesUntilDue)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">
                      {item.description}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        item.milesUntilDue <= 1000
                          ? 'bg-red-100 text-red-800'
                          : item.milesUntilDue <= 5000
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {getUrgencyLabel(item.milesUntilDue)}
                    </span>
                  </div>

                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    <span className="font-medium">
                      {item.vehicle.year} {item.vehicle.make}{' '}
                      {item.vehicle.model}
                    </span>
                    <span className="mx-2">•</span>
                    <span>{item.frequency}</span>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="font-medium">Due at:</span>{' '}
                      {item.nextDueMileage.toLocaleString()} miles
                    </div>
                    <div>
                      <span className="font-medium">Miles until due:</span>{' '}
                      {item.milesUntilDue.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="ml-4">
                  <button className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors">
                    Mark Complete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {upcomingItems.length > 0 && (
        <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <h4 className="font-semibold mb-2">Legend</h4>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-200 rounded"></div>
              <span>Urgent (≤1,000 miles)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-200 rounded"></div>
              <span>Soon (≤5,000 miles)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-200 rounded"></div>
              <span>Upcoming (&gt;5,000 miles)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
