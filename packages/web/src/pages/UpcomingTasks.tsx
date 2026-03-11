import { getUpcomingMaintenance } from '@vehicle-vitals/shared';
import { useEffect, useState } from 'react';
import {
  addReminder,
  completeReminder,
  dismissReminder,
  getReminders,
  getVehicle,
  getVehicles,
  reopenReminder,
  snoozeReminder,
} from '../shared/firestoreService';

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

interface ReminderItem {
  id: string;
  vin: string;
  title: string;
  serviceType?: string;
  status?: string;
  snoozedUntil?: string;
  nextDueMileage?: number;
  milesUntilDue?: number;
}

export default function UpcomingTasks() {
  const [upcomingItems, setUpcomingItems] = useState<UpcomingItem[]>([]);
  const [savedReminders, setSavedReminders] = useState<ReminderItem[]>([]);
  const [savedReminderKeys, setSavedReminderKeys] = useState<Set<string>>(
    () => new Set()
  );
  const [savingReminderKeys, setSavingReminderKeys] = useState<Set<string>>(
    () => new Set()
  );
  const [actingReminderIds, setActingReminderIds] = useState<Set<string>>(
    () => new Set()
  );
  const [reminderFilter, setReminderFilter] = useState<
    'all' | 'active' | 'snoozed' | 'completed' | 'dismissed'
  >('all');
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [preferredLeadDays, setPreferredLeadDays] = useState(14);
  const [preferredDailyMiles, setPreferredDailyMiles] = useState(35);
  const [loading, setLoading] = useState(true);

  const buildReminderKey = (vin: string, serviceType?: string) =>
    `${vin}:${serviceType || 'maintenance'}`;

  const formatDateLabel = (value?: string) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString();
  };

  const leadMilesThreshold = preferredLeadDays * preferredDailyMiles;

  useEffect(() => {
    const loadUpcomingTasks = async () => {
      try {
        const preferenceDoc = await getVehicle('__preferences__');
        const enabledPreference = preferenceDoc?.maintenanceAlertsEnabled;
        const leadDays = Number(preferenceDoc?.preferredReminderTimingDays);
        const dailyMiles = Number(preferenceDoc?.preferredDailyMiles);
        if (typeof enabledPreference === 'boolean') {
          setAlertsEnabled(enabledPreference);
        }
        if (Number.isFinite(leadDays) && leadDays > 0) {
          setPreferredLeadDays(Math.round(leadDays));
        }
        if (Number.isFinite(dailyMiles) && dailyMiles > 0) {
          setPreferredDailyMiles(Math.round(dailyMiles));
        }

        const vehicles = await getVehicles();

        const allUpcoming: UpcomingItem[] = [];
        const nextSavedReminders: ReminderItem[] = [];
        const nextSavedReminderKeys = new Set<string>();

        for (const vehicle of vehicles) {
          const currentMileage = parseInt(vehicle.mileage || '0') || 0;
          const reminders = await getReminders(vehicle.vin);

          reminders.forEach(
            (reminder: {
              id: string;
              title?: string;
              serviceType?: string;
              status?: string;
              snoozedUntil?: string;
              nextDueMileage?: number;
              milesUntilDue?: number;
            }) => {
              nextSavedReminders.push({
                id: reminder.id,
                vin: vehicle.vin,
                title: reminder.title || 'Maintenance Reminder',
                serviceType: reminder.serviceType,
                status: reminder.status || 'active',
                snoozedUntil: reminder.snoozedUntil,
                nextDueMileage: reminder.nextDueMileage,
                milesUntilDue: reminder.milesUntilDue,
              });

              if ((reminder.status || 'active') !== 'completed') {
                if ((reminder.status || 'active') === 'dismissed') {
                  return;
                }
                nextSavedReminderKeys.add(
                  buildReminderKey(vehicle.vin, reminder.serviceType)
                );
              }
            }
          );

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
        setSavedReminders(nextSavedReminders);
        setSavedReminderKeys(nextSavedReminderKeys);
      } catch (error) {
        console.error('Error loading upcoming tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadUpcomingTasks();
  }, []);

  const handleSaveReminder = async (item: UpcomingItem) => {
    if (!alertsEnabled) {
      alert('Maintenance alerts are disabled in Profile settings.');
      return;
    }

    if (item.milesUntilDue > leadMilesThreshold) {
      alert(
        `This reminder is outside your preferred lead time (${preferredLeadDays} days at ${preferredDailyMiles} miles/day).`
      );
      return;
    }

    const reminderKey = buildReminderKey(item.vehicle.vin, item.serviceType);
    if (savedReminderKeys.has(reminderKey)) {
      return;
    }

    setSavingReminderKeys(prev => new Set(prev).add(reminderKey));
    try {
      const created = await addReminder(item.vehicle.vin, {
        title: item.description,
        description: `${item.vehicle.year} ${item.vehicle.make} ${item.vehicle.model}`,
        serviceType: item.serviceType,
        frequency: item.frequency,
        interval: item.interval,
        nextDueMileage: item.nextDueMileage,
        milesUntilDue: item.milesUntilDue,
        status: 'active',
      });

      setSavedReminders(prev => [
        {
          id: created.id,
          vin: item.vehicle.vin,
          title: item.description,
          serviceType: item.serviceType,
          status: 'active',
          nextDueMileage: item.nextDueMileage,
          milesUntilDue: item.milesUntilDue,
        },
        ...prev,
      ]);
      setSavedReminderKeys(prev => new Set(prev).add(reminderKey));
    } catch (error) {
      console.error('Error saving reminder:', error);
      alert('Failed to save reminder');
    } finally {
      setSavingReminderKeys(prev => {
        const next = new Set(prev);
        next.delete(reminderKey);
        return next;
      });
    }
  };

  const handleCompleteReminder = async (reminder: ReminderItem) => {
    if (!reminder.id) return;

    setActingReminderIds(prev => new Set(prev).add(reminder.id));
    try {
      await completeReminder(reminder.vin, reminder.id);
      const reminderKey = buildReminderKey(reminder.vin, reminder.serviceType);
      setSavedReminders(prev =>
        prev.map(item =>
          item.id === reminder.id ? { ...item, status: 'completed' } : item
        )
      );
      setSavedReminderKeys(prev => {
        const next = new Set(prev);
        next.delete(reminderKey);
        return next;
      });
    } catch (error) {
      console.error('Error completing reminder:', error);
      alert('Failed to complete reminder');
    } finally {
      setActingReminderIds(prev => {
        const next = new Set(prev);
        next.delete(reminder.id);
        return next;
      });
    }
  };

  const handleSnoozeReminder = async (reminder: ReminderItem) => {
    if (!reminder.id) return;

    const snoozedUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    setActingReminderIds(prev => new Set(prev).add(reminder.id));
    try {
      await snoozeReminder(reminder.vin, reminder.id, snoozedUntil);
      setSavedReminders(prev =>
        prev.map(item =>
          item.id === reminder.id
            ? { ...item, status: 'snoozed', snoozedUntil }
            : item
        )
      );
    } catch (error) {
      console.error('Error snoozing reminder:', error);
      alert('Failed to snooze reminder');
    } finally {
      setActingReminderIds(prev => {
        const next = new Set(prev);
        next.delete(reminder.id);
        return next;
      });
    }
  };

  const handleDismissReminder = async (reminder: ReminderItem) => {
    if (!reminder.id) return;

    setActingReminderIds(prev => new Set(prev).add(reminder.id));
    try {
      await dismissReminder(reminder.vin, reminder.id);
      const reminderKey = buildReminderKey(reminder.vin, reminder.serviceType);
      setSavedReminders(prev =>
        prev.map(item =>
          item.id === reminder.id ? { ...item, status: 'dismissed' } : item
        )
      );
      setSavedReminderKeys(prev => {
        const next = new Set(prev);
        next.delete(reminderKey);
        return next;
      });
    } catch (error) {
      console.error('Error dismissing reminder:', error);
      alert('Failed to dismiss reminder');
    } finally {
      setActingReminderIds(prev => {
        const next = new Set(prev);
        next.delete(reminder.id);
        return next;
      });
    }
  };

  const handleRestoreReminder = async (reminder: ReminderItem) => {
    if (!reminder.id) return;

    setActingReminderIds(prev => new Set(prev).add(reminder.id));
    try {
      await reopenReminder(reminder.vin, reminder.id);
      const reminderKey = buildReminderKey(reminder.vin, reminder.serviceType);
      setSavedReminders(prev =>
        prev.map(item =>
          item.id === reminder.id ? { ...item, status: 'active' } : item
        )
      );
      setSavedReminderKeys(prev => new Set(prev).add(reminderKey));
    } catch (error) {
      console.error('Error restoring reminder:', error);
      alert('Failed to restore reminder');
    } finally {
      setActingReminderIds(prev => {
        const next = new Set(prev);
        next.delete(reminder.id);
        return next;
      });
    }
  };

  const reminderCounts = {
    all: savedReminders.length,
    active: savedReminders.filter(
      reminder => (reminder.status || 'active') === 'active'
    ).length,
    snoozed: savedReminders.filter(reminder => reminder.status === 'snoozed')
      .length,
    completed: savedReminders.filter(
      reminder => reminder.status === 'completed'
    ).length,
    dismissed: savedReminders.filter(
      reminder => reminder.status === 'dismissed'
    ).length,
  } as const;

  const visibleReminders = savedReminders.filter(reminder => {
    if (reminderFilter === 'all') return true;
    return (reminder.status || 'active') === reminderFilter;
  });

  const visibleUpcomingItems = alertsEnabled
    ? upcomingItems.filter(item => item.milesUntilDue <= leadMilesThreshold)
    : [];

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
      <div className="w-full max-w-7xl mx-auto px-5 py-5">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
          <span className="ml-3 text-slate-600">Loading upcoming tasks...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-5 py-5">
      <div className="mb-6">
        <h1 className="font-serif font-bold text-4xl text-slate-900 dark:text-slate-100 m-0 mb-2">
          Upcoming Tasks
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Stay ahead of maintenance with upcoming service recommendations for
          all your vehicles.
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
        Alerts: <strong>{alertsEnabled ? 'Enabled' : 'Disabled'}</strong> •
        Preferred lead time: <strong>{preferredLeadDays} days</strong> • Average
        driving: <strong>{preferredDailyMiles} miles/day</strong> • Alert
        window: <strong>{leadMilesThreshold.toLocaleString()} miles</strong>
      </div>

      {savedReminders.length > 0 && (
        <div className="mb-6 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-0 mb-3">
            Saved Reminders
          </h2>
          <div className="mb-3 flex flex-wrap gap-2">
            {(
              [
                ['all', 'All'],
                ['active', 'Active'],
                ['snoozed', 'Snoozed'],
                ['completed', 'Completed'],
                ['dismissed', 'Dismissed'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setReminderFilter(value)}
                className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                  reminderFilter === value
                    ? 'border-slate-700 bg-slate-700 text-white dark:border-slate-200 dark:bg-slate-200 dark:text-slate-900'
                    : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {label} ({reminderCounts[value]})
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {visibleReminders.slice(0, 8).map(reminder => (
              <div
                key={reminder.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2"
              >
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {reminder.title}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    VIN: {reminder.vin}
                    {typeof reminder.nextDueMileage === 'number' &&
                      ` • Due at ${reminder.nextDueMileage.toLocaleString()} miles`}
                    {reminder.status === 'snoozed' &&
                      reminder.snoozedUntil &&
                      ` • Snoozed until ${formatDateLabel(reminder.snoozedUntil)}`}
                    {reminder.status === 'completed' && ' • Completed'}
                    {reminder.status === 'dismissed' && ' • Dismissed'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {reminder.status === 'dismissed' ? (
                    <button
                      onClick={() => void handleRestoreReminder(reminder)}
                      disabled={actingReminderIds.has(reminder.id)}
                      className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Restore
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => void handleSnoozeReminder(reminder)}
                        disabled={
                          reminder.status === 'completed' ||
                          actingReminderIds.has(reminder.id)
                        }
                        className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Snooze 2 Weeks
                      </button>
                      <button
                        onClick={() => void handleCompleteReminder(reminder)}
                        disabled={
                          reminder.status === 'completed' ||
                          actingReminderIds.has(reminder.id)
                        }
                        className="px-3 py-1.5 bg-slate-700 text-white rounded-md text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => void handleDismissReminder(reminder)}
                        disabled={
                          reminder.status === 'completed' ||
                          actingReminderIds.has(reminder.id)
                        }
                        className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Dismiss
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {visibleReminders.length === 0 && (
              <div className="rounded-md border border-dashed border-slate-300 dark:border-slate-600 p-3 text-sm text-slate-600 dark:text-slate-400">
                No reminders in this view.
              </div>
            )}
          </div>
        </div>
      )}

      {visibleUpcomingItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            All caught up!
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            {alertsEnabled
              ? 'No upcoming maintenance tasks found in your preferred lead-time window.'
              : 'Maintenance alerts are disabled in Profile settings.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {visibleUpcomingItems.map((item, index) => (
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
                  <button
                    onClick={() => void handleSaveReminder(item)}
                    disabled={
                      savedReminderKeys.has(
                        buildReminderKey(item.vehicle.vin, item.serviceType)
                      ) ||
                      savingReminderKeys.has(
                        buildReminderKey(item.vehicle.vin, item.serviceType)
                      )
                    }
                    className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {savingReminderKeys.has(
                      buildReminderKey(item.vehicle.vin, item.serviceType)
                    )
                      ? 'Saving...'
                      : savedReminderKeys.has(
                            buildReminderKey(item.vehicle.vin, item.serviceType)
                          )
                        ? 'Reminder Saved'
                        : 'Save Reminder'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {visibleUpcomingItems.length > 0 && (
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
