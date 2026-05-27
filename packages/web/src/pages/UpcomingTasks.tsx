import { getUpcomingMaintenance } from '@vehicle-vitals/shared';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  addReminder,
  completeReminder,
  dismissReminder,
  getReminders,
  getVehicle,
  getVehicles,
  markReminderDelivery,
  reopenReminder,
  snoozeReminder,
} from '../shared/firestoreService';
import { useFeatureFlag } from '../shared/useMonetization';
import { createMaintenanceCalendarEvent } from '../utils/calendarService';
import { sendReminderDeliveryEmail } from '../utils/reminderDeliveryService';

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
  deliveryStatus?: 'sent' | 'failed' | 'pending';
  lastDeliveredAt?: string;
  lastDeliveryError?: string;
}

const reminderFilterDescriptions: Record<
  'all' | 'active' | 'snoozed' | 'completed' | 'dismissed',
  string
> = {
  all: 'See every saved reminder across active, snoozed, completed, and dismissed states.',
  active:
    'Active reminders still need a next action such as email, snooze, complete, or dismiss.',
  snoozed:
    'Snoozed reminders are temporarily hidden until the selected date passes.',
  completed:
    'Completed reminders are finished service items kept for reference.',
  dismissed:
    'Dismissed reminders were intentionally removed from your working list and can be restored later.',
};

const calendarTargetOptionLabels = {
  google: 'Google Calendar (opens a new tab)',
  apple: 'Apple Calendar (.ics file)',
  ics: 'ICS file download',
} as const;

function getCalendarSuccessMessage(target: 'google' | 'apple' | 'ics') {
  switch (target) {
    case 'google':
      return 'Opened Google Calendar event details in a new tab.';
    case 'apple':
      return 'Downloaded an Apple Calendar-compatible event file.';
    case 'ics':
      return 'Downloaded an ICS calendar file.';
    default:
      return 'Prepared your calendar event.';
  }
}

export default function UpcomingTasks() {
  const location = useLocation();
  const hasAdvancedReminders = useFeatureFlag('advanced_reminders');
  const hasPlanning12mo = useFeatureFlag('maintenance_planning_12mo');
  const hasPlanning36mo = useFeatureFlag('maintenance_planning_36mo');
  const hasAiPredictions = useFeatureFlag('ai_predictions');
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
  const [deliveryEmail, setDeliveryEmail] = useState('');
  const [calendarTarget, setCalendarTarget] = useState<
    'google' | 'apple' | 'ics'
  >('google');
  const [savingCalendarKeys, setSavingCalendarKeys] = useState<Set<string>>(
    () => new Set()
  );
  const [sendingReminderIds, setSendingReminderIds] = useState<Set<string>>(
    () => new Set()
  );
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);
  const [vehicleLookup, setVehicleLookup] = useState<Record<string, Vehicle>>(
    {}
  );

  const buildReminderKey = (vin: string, serviceType?: string) =>
    `${vin}:${serviceType || 'maintenance'}`;

  const searchParams = new URLSearchParams(location.search);
  const selectedVin = searchParams.get('vin')?.trim().toUpperCase();
  const openedFromPush = searchParams.get('source') === 'push';

  const formatDateLabel = (value?: string) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString();
  };

  const effectiveLeadDays = hasAdvancedReminders ? preferredLeadDays : 14;
  const effectiveDailyMiles = hasAdvancedReminders ? preferredDailyMiles : 35;
  const leadMilesThreshold = effectiveLeadDays * effectiveDailyMiles;
  const planningHorizonMonths = hasPlanning36mo ? 36 : hasPlanning12mo ? 12 : 3;
  const planningHorizonMiles = effectiveDailyMiles * 30 * planningHorizonMonths;

  const estimateDueDateLabel = (milesUntilDue: number) => {
    const safeDailyMiles = Math.max(1, effectiveDailyMiles);
    const dayEstimate = Math.max(1, Math.ceil(milesUntilDue / safeDailyMiles));
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + dayEstimate);
    return dueDate.toLocaleDateString();
  };

  useEffect(() => {
    const loadUpcomingTasks = async () => {
      try {
        const preferenceDoc = await getVehicle('preferences');
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
        if (typeof preferenceDoc?.notificationEmail === 'string') {
          setDeliveryEmail(preferenceDoc.notificationEmail);
        }

        const vehicles = await getVehicles();
        const nextVehicleLookup: Record<string, Vehicle> = {};
        vehicles.forEach(vehicle => {
          nextVehicleLookup[vehicle.vin] = {
            vin: vehicle.vin,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            mileage: vehicle.mileage,
          };
        });

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
              deliveryStatus?: 'sent' | 'failed' | 'pending';
              lastDeliveredAt?: string;
              lastDeliveryError?: string;
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
                deliveryStatus: reminder.deliveryStatus,
                lastDeliveredAt: reminder.lastDeliveredAt,
                lastDeliveryError: reminder.lastDeliveryError,
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
        setVehicleLookup(nextVehicleLookup);
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

  const handleAddToCalendar = async (item: UpcomingItem) => {
    const actionKey = buildReminderKey(item.vehicle.vin, item.serviceType);
    setSavingCalendarKeys(prev => new Set(prev).add(actionKey));
    try {
      const dueDate = new Date();
      const milesUntilDue = Number(item.milesUntilDue || 0);
      const dayOffset = Math.max(
        1,
        Math.min(180, Math.ceil(milesUntilDue / 100))
      );
      dueDate.setDate(dueDate.getDate() + dayOffset);

      const startAt = dueDate.toISOString();
      const endAt = new Date(dueDate.getTime() + 60 * 60 * 1000).toISOString();

      const event = await createMaintenanceCalendarEvent({
        vehicleVin: item.vehicle.vin,
        title: item.description,
        description: `${item.vehicle.year} ${item.vehicle.make} ${item.vehicle.model} maintenance reminder`,
        startAt,
        endAt,
        target: calendarTarget,
      });

      const destination = event.actionUrl || event.downloadUrl;
      if (destination) {
        window.open(destination, '_blank', 'noopener,noreferrer');
      }

      alert(getCalendarSuccessMessage(calendarTarget));
    } catch (error) {
      alert(
        'Failed to create calendar event: ' +
          (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setSavingCalendarKeys(prev => {
        const next = new Set(prev);
        next.delete(actionKey);
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

  const handleSendReminderNow = async (reminder: ReminderItem) => {
    if (!reminder.id) return;

    const recipient = deliveryEmail.trim();
    if (!recipient || !recipient.includes('@')) {
      alert(
        'Enter the email address that should receive this reminder before sending.'
      );
      return;
    }

    const vehicle = vehicleLookup[reminder.vin];
    if (!vehicle) {
      alert('Vehicle details not found for this reminder.');
      return;
    }

    setSendingReminderIds(prev => new Set(prev).add(reminder.id));
    try {
      await sendReminderDeliveryEmail({
        email: recipient,
        vehicle,
        maintenanceItems: [
          {
            title: reminder.title,
            dueDate:
              typeof reminder.nextDueMileage === 'number'
                ? `${reminder.nextDueMileage.toLocaleString()} miles`
                : reminder.snoozedUntil
                  ? `Snoozed until ${formatDateLabel(reminder.snoozedUntil)}`
                  : 'Upcoming',
          },
        ],
      });

      const deliveredAt = new Date().toISOString();
      await markReminderDelivery(reminder.vin, reminder.id, {
        deliveryStatus: 'sent',
        lastDeliveredAt: deliveredAt,
        lastDeliveryError: null,
      });

      setSavedReminders(prev =>
        prev.map(item =>
          item.id === reminder.id
            ? {
                ...item,
                deliveryStatus: 'sent',
                lastDeliveredAt: deliveredAt,
                lastDeliveryError: undefined,
              }
            : item
        )
      );
      alert(`Reminder email sent to ${recipient}.`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to send reminder';

      try {
        await markReminderDelivery(reminder.vin, reminder.id, {
          deliveryStatus: 'failed',
          lastDeliveryError: message,
        });
      } catch (persistError) {
        console.error(
          'Failed to persist reminder delivery failure',
          persistError
        );
      }

      setSavedReminders(prev =>
        prev.map(item =>
          item.id === reminder.id
            ? {
                ...item,
                deliveryStatus: 'failed',
                lastDeliveryError: message,
              }
            : item
        )
      );
      alert(`Could not send reminder email to ${recipient}: ${message}`);
    } finally {
      setSendingReminderIds(prev => {
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
    if (selectedVin && reminder.vin.toUpperCase() !== selectedVin) {
      return false;
    }

    if (reminderFilter === 'all') return true;
    return (reminder.status || 'active') === reminderFilter;
  });

  const visibleUpcomingItems = alertsEnabled
    ? upcomingItems.filter(item => {
        if (selectedVin && item.vehicle.vin.toUpperCase() !== selectedVin) {
          return false;
        }

        if (item.milesUntilDue > planningHorizonMiles) {
          return false;
        }

        return (
          showAllRecommendations || item.milesUntilDue <= leadMilesThreshold
        );
      })
    : [];

  const selectedVehicle = selectedVin ? vehicleLookup[selectedVin] : undefined;
  const recommendationsOutsideWindow = upcomingItems.filter(item => {
    if (selectedVin && item.vehicle.vin.toUpperCase() !== selectedVin) {
      return false;
    }

    return (
      item.milesUntilDue > leadMilesThreshold &&
      item.milesUntilDue <= planningHorizonMiles
    );
  }).length;

  const recommendationsBeyondPlanWindow = upcomingItems.filter(item => {
    if (selectedVin && item.vehicle.vin.toUpperCase() !== selectedVin) {
      return false;
    }

    return item.milesUntilDue > planningHorizonMiles;
  }).length;

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
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-5 py-5">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
          <span className="ml-3 text-slate-600">Loading upcoming tasks...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-5 py-5">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif font-bold text-4xl text-slate-900 dark:text-slate-100 m-0 mb-2">
            Upcoming Tasks
          </h1>
          <p className="text-slate-600 dark:text-slate-400 m-0">
            Stay ahead of maintenance with upcoming service recommendations for
            all your vehicles.
          </p>
        </div>
      </div>

      {openedFromPush && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <div>
            Opened from a maintenance reminder notification.
            {selectedVehicle
              ? ` Showing items for ${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}.`
              : selectedVin
                ? ` Showing items for VIN ${selectedVin}.`
                : ''}
          </div>
          {selectedVin ? (
            <Link
              to="/app/upcoming"
              className="mt-2 inline-block font-medium text-blue-700 underline"
            >
              Show all vehicles
            </Link>
          ) : null}
        </div>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
          <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mt-0 mb-3 px-1">
            Reminder Center
          </h2>
          <p className="mb-3 px-1 text-sm text-slate-600 dark:text-slate-400">
            This page estimates when service should surface based on your lead
            time and average daily driving. You can still reveal everything and
            save a reminder early when you want more manual control.
          </p>
          {!hasAdvancedReminders && (
            <div className="mb-3 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-3 text-sm text-indigo-900 dark:border-indigo-900/40 dark:bg-indigo-950/30 dark:text-indigo-100">
              Advanced reminder timing controls are available on Pro and Premium
              plans.
              <div className="mt-2">
                <Link to="/app/subscription" className="font-medium underline">
                  Upgrade for advanced reminder controls
                </Link>
              </div>
            </div>
          )}
          <div className="mb-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-3 text-sm text-slate-700 dark:text-slate-300">
            Alerts: <strong>{alertsEnabled ? 'Enabled' : 'Disabled'}</strong>
            <br />
            Lead time: <strong>{effectiveLeadDays} days</strong>
            <br />
            Average driving: <strong>{effectiveDailyMiles} miles/day</strong>
            <br />
            Current reminder window:{' '}
            <strong>{leadMilesThreshold.toLocaleString()} miles</strong>
            <br />
            Planning horizon:{' '}
            <strong>{planningHorizonMonths}-month forecast</strong>
          </div>
          <div className="mb-3 rounded-lg border border-teal-200 bg-teal-50 px-3 py-3 text-sm text-teal-900 dark:border-teal-900/40 dark:bg-teal-950/30 dark:text-teal-100">
            <div>
              Tasks due within about <strong>{effectiveLeadDays} days</strong>{' '}
              at <strong>{effectiveDailyMiles} miles/day</strong> appear by
              default, and recommendations are capped to your{' '}
              <strong>{planningHorizonMonths}-month</strong> plan horizon.
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowAllRecommendations(current => !current)}
                className="rounded-md border border-teal-300 px-3 py-1.5 text-sm font-medium text-teal-800 hover:bg-teal-100 dark:border-teal-700 dark:text-teal-200 dark:hover:bg-teal-900/40"
              >
                {showAllRecommendations
                  ? 'Show only tasks due soon'
                  : 'Show all recommendations'}
              </button>
              <Link to="/app/profile" className="font-medium underline">
                Adjust reminder preferences
              </Link>
            </div>
          </div>
          <div className="mb-3">
            <label
              htmlFor="reminderDeliveryEmail"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
            >
              Send reminder email to
            </label>
            <input
              id="reminderDeliveryEmail"
              type="email"
              value={deliveryEmail}
              onChange={event => setDeliveryEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 dark:text-slate-100"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Use this for one-time reminder emails when you choose Send Email
              Now. It does not start an automatic email campaign.
            </p>
          </div>

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
          <p className="mb-3 px-1 text-xs text-slate-500 dark:text-slate-400">
            {reminderFilterDescriptions[reminderFilter]}
          </p>

          <div className="space-y-2 max-h-[70dvh] overflow-y-auto pr-1">
            {visibleReminders.map(reminder => (
              <div
                key={reminder.id}
                className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-3"
              >
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {reminder.title}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    VIN: {reminder.vin}
                    {typeof reminder.nextDueMileage === 'number' &&
                      ` • Due at ${reminder.nextDueMileage.toLocaleString()} miles`}
                    {reminder.status === 'snoozed' &&
                      reminder.snoozedUntil &&
                      ` • Snoozed until ${formatDateLabel(reminder.snoozedUntil)}`}
                    {reminder.status === 'completed' && ' • Completed'}
                    {reminder.status === 'dismissed' && ' • Dismissed'}
                    {reminder.deliveryStatus === 'sent' &&
                      reminder.lastDeliveredAt &&
                      ` • Email sent ${formatDateLabel(reminder.lastDeliveredAt)}`}
                    {reminder.deliveryStatus === 'failed' &&
                      ` • Delivery failed${
                        reminder.lastDeliveryError
                          ? `: ${reminder.lastDeliveryError}`
                          : ''
                      }`}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
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
                        onClick={() => void handleSendReminderNow(reminder)}
                        disabled={
                          reminder.status === 'completed' ||
                          reminder.status === 'dismissed' ||
                          actingReminderIds.has(reminder.id) ||
                          sendingReminderIds.has(reminder.id)
                        }
                        className="px-3 py-1.5 border border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-300 rounded-md text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {sendingReminderIds.has(reminder.id)
                          ? 'Sending...'
                          : 'Send Email Now'}
                      </button>
                      <button
                        onClick={() => void handleSnoozeReminder(reminder)}
                        disabled={
                          reminder.status === 'completed' ||
                          actingReminderIds.has(reminder.id)
                        }
                        className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Snooze 14 Days
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
                No saved reminders match this filter yet.
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3">
              <p className="m-0 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                In range now
              </p>
              <p className="m-0 mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {visibleUpcomingItems.length}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3">
              <p className="m-0 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Saved reminders
              </p>
              <p className="m-0 mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {savedReminders.length}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3">
              <p className="m-0 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Outside window
              </p>
              <p className="m-0 mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {recommendationsOutsideWindow}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3">
              <p className="m-0 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Beyond plan horizon
              </p>
              <p className="m-0 mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {recommendationsBeyondPlanWindow}
              </p>
            </div>
          </div>

          {visibleUpcomingItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                All caught up!
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {alertsEnabled
                  ? showAllRecommendations
                    ? 'No upcoming maintenance recommendations were found for the selected vehicles.'
                    : 'No upcoming maintenance tasks fall inside your current reminder window.'
                  : 'Maintenance alerts are disabled in Profile settings.'}
              </p>
              {alertsEnabled && !showAllRecommendations ? (
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAllRecommendations(true)}
                    className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Show all recommendations
                  </button>
                  <Link
                    to="/app/profile"
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    Edit reminder preferences
                  </Link>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="font-semibold text-xl text-slate-900 dark:text-slate-100 mt-0 mb-1">
                    Upcoming Maintenance Queue
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 m-0">
                    {visibleUpcomingItems.length} recommendation
                    {visibleUpcomingItems.length === 1 ? '' : 's'} in range
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Due dates are estimated from current mileage and your saved
                    driving pace. Save reminders whenever you want a manual
                    follow-up point, even if the task is still far out.
                  </p>
                  {!hasAiPredictions && (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      AI predicted maintenance due-date insights are available
                      on Premium and Enterprise plans.
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3">
                  <label
                    htmlFor="upcomingCalendarTarget"
                    className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                  >
                    Default calendar action
                  </label>
                  <select
                    id="upcomingCalendarTarget"
                    value={calendarTarget}
                    onChange={event =>
                      setCalendarTarget(
                        event.target.value as 'google' | 'apple' | 'ics'
                      )
                    }
                    className="mt-2 min-w-[15rem] px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-900"
                  >
                    <option value="google">
                      {calendarTargetOptionLabels.google}
                    </option>
                    <option value="apple">
                      {calendarTargetOptionLabels.apple}
                    </option>
                    <option value="ics">
                      {calendarTargetOptionLabels.ics}
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4">
                {visibleUpcomingItems.map((item, index) => (
                  <div
                    key={`${item.vehicle.vin}-${item.serviceType}-${index}`}
                    className={`border rounded-lg p-6 ${getUrgencyColor(item.milesUntilDue)}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="font-semibold text-lg m-0">
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700 dark:text-slate-300">
                          <div>
                            <span className="font-medium">Due at:</span>{' '}
                            {item.nextDueMileage.toLocaleString()} miles
                          </div>
                          <div>
                            <span className="font-medium">
                              Miles until due:
                            </span>{' '}
                            {item.milesUntilDue.toLocaleString()}
                          </div>
                        </div>
                        {hasAiPredictions && (
                          <p className="mt-2 mb-0 text-sm text-indigo-800 dark:text-indigo-200">
                            Predicted due date:{' '}
                            {estimateDueDateLabel(item.milesUntilDue)}
                          </p>
                        )}
                        {item.milesUntilDue > leadMilesThreshold ? (
                          <p className="mt-3 mb-0 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                            Outside your current reminder window. You can still
                            save it now if you want to track it early.
                          </p>
                        ) : null}
                      </div>

                      <div className="min-w-[14rem]">
                        <div className="flex flex-col items-stretch gap-2 sm:items-end">
                          <button
                            onClick={() => void handleSaveReminder(item)}
                            disabled={
                              savedReminderKeys.has(
                                buildReminderKey(
                                  item.vehicle.vin,
                                  item.serviceType
                                )
                              ) ||
                              savingReminderKeys.has(
                                buildReminderKey(
                                  item.vehicle.vin,
                                  item.serviceType
                                )
                              )
                            }
                            className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {savingReminderKeys.has(
                              buildReminderKey(
                                item.vehicle.vin,
                                item.serviceType
                              )
                            )
                              ? 'Saving...'
                              : savedReminderKeys.has(
                                    buildReminderKey(
                                      item.vehicle.vin,
                                      item.serviceType
                                    )
                                  )
                                ? 'Reminder Saved'
                                : item.milesUntilDue > leadMilesThreshold
                                  ? 'Save Reminder Anyway'
                                  : 'Save Reminder'}
                          </button>
                          <button
                            onClick={() => void handleAddToCalendar(item)}
                            disabled={savingCalendarKeys.has(
                              buildReminderKey(
                                item.vehicle.vin,
                                item.serviceType
                              )
                            )}
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {savingCalendarKeys.has(
                              buildReminderKey(
                                item.vehicle.vin,
                                item.serviceType
                              )
                            )
                              ? 'Adding...'
                              : 'Add to Calendar'}
                          </button>
                          <p className="m-0 text-xs text-slate-500 dark:text-slate-400 sm:text-right">
                            Save a reminder first if you want the item to stay
                            in your Reminder Center after you leave this page.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <h4 className="font-semibold mb-2 mt-0">Legend</h4>
                <div className="flex gap-4 text-sm flex-wrap">
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
            </>
          )}
        </div>
      </section>
    </div>
  );
}
