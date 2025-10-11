import React, { useState, useEffect } from 'react';
import { getVehicles, getMaintenanceEntries } from '../shared/firestoreService';

export default function TimelineDashboard() {
  const [maintenanceEntries, setMaintenanceEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const vehiclesList = await getVehicles();

        // Load maintenance entries for all vehicles
        const allEntries = [];
        for (const vehicle of vehiclesList) {
          const entries = await getMaintenanceEntries(vehicle.vin);
          allEntries.push(...entries.map(entry => ({
            ...entry,
            vehicle: {
              vin: vehicle.vin,
              make: vehicle.make,
              model: vehicle.model,
              year: vehicle.year
            }
          })));
        }

        // Sort by date (most recent first)
        allEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
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
      <div className="max-w-4xl mx-auto px-5 py-5">
        <h1 className="font-serif font-bold text-3xl text-slate-900 dark:text-slate-100 mb-6">Maintenance Timeline</h1>
        <div className="flex justify-center items-center h-64">
          <div className="text-slate-600 dark:text-slate-400">Loading timeline...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-5 py-5">
      <h1 className="font-serif font-bold text-3xl text-slate-900 dark:text-slate-100 mb-6">Maintenance Timeline</h1>

      {maintenanceEntries.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-slate-500 dark:text-slate-400 text-lg mb-2">No maintenance history yet</div>
          <div className="text-slate-400 dark:text-slate-500">Add maintenance entries to your vehicles to see the timeline</div>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-300 dark:bg-slate-600"></div>

          <div className="space-y-8">
            {maintenanceEntries.map((entry, index) => (
              <div key={entry.id || index} className="relative flex items-start">
                {/* Timeline dot */}
                <div className="flex-shrink-0 w-4 h-4 bg-slate-500 dark:bg-slate-400 rounded-full mt-6 ml-6 border-4 border-white dark:border-slate-800"></div>

                {/* Content card */}
                <div className="ml-12 flex-1">
                  <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                          {entry.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {entry.vehicle.make} {entry.vehicle.model} ({entry.vehicle.year}) • {entry.vehicle.vin}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                          ${entry.cost?.toFixed(2) || '0.00'}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {new Date(entry.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {entry.notes && (
                      <p className="text-slate-700 dark:text-slate-300 mb-3">{entry.notes}</p>
                    )}

                    {entry.attachments && entry.attachments.length > 0 && (
                      <div className="border-t border-slate-200 dark:border-slate-600 pt-3">
                        <div className="flex flex-wrap gap-2">
                          {entry.attachments.map((attachment, attIndex) => (
                            <div key={attIndex} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-700 rounded-md">
                              {attachment.type?.startsWith('image/') ? (
                                <img
                                  src={attachment.url}
                                  alt={attachment.name}
                                  className="w-8 h-8 object-cover rounded"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-slate-200 dark:bg-slate-600 rounded flex items-center justify-center">
                                  <span className="text-xs">📄</span>
                                </div>
                              )}
                              <span className="text-sm text-slate-700 dark:text-slate-300">{attachment.name}</span>
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
  );
}