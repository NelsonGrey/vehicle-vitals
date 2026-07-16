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
import { userFacingError } from '../shared/userFacingError';
import { createMaintenanceCalendarEvent } from '../utils/calendarService';
import {
  formatServiceTypeLabel,
  type MaintenancePlanItem,
} from '../utils/maintenancePlan';
import { sendReminderDeliveryEmail } from '../utils/reminderDeliveryService';
import { getMaintenancePlan } from '../utils/vehicleService';

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
  const [vehicleList, setVehicleList] = useState<Vehicle[]>([]);
  const [selectedVehicleVins, setSelectedVehicleVins] = useState<string[]>([]);
  // Vehicles whose make/model has no manufacturer interval data on file
  // (getMaintenancePlanCallable's plan.modelSpecific is false, so the
  // items shown are a generic estimate, not real manufacturer data).
  // Tracked separately so the empty state can say "we don't have
  // manufacturer data for this vehicle" instead of the indistinguishable
  // "all caught up, well maintained."
  const [unsupportedVehicles, setUnsupportedVehicles] = useState<Vehicle[]>([]);

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
  const planningHorizonUpgrade = hasPlanning36mo
    ? null
    : hasPlanning12mo
      ? { planName: 'Premium', months: 36 }
      : { planName: 'Pro', months: 12 };

  const estimateDueDate = (milesUntilDue: number) => {
    const safeDailyMiles = Math.max(1, effectiveDailyMiles);
    const dayEstimate = Math.max(1, Math.ceil(milesUntilDue / safeDailyMiles));
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + dayEstimate);
    return dueDate;
  };

  const estimateDueDateLabel = (milesUntilDue: number) =>
    estimateDueDate(milesUntilDue).toLocaleDateString();

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
        const nextVehicleList: Vehicle[] = [];
        vehicles.forEach(vehicle => {
          const summary = {
            vin: vehicle.vin,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            mileage: vehicle.mileage,
          };
          nextVehicleLookup[vehicle.vin] = summary;
          nextVehicleList.push(summary);
        });
        setVehicleList(nextVehicleList);
        setSelectedVehicleVins(current => {
          if (selectedVin) {
            return [selectedVin];
          }
          if (current.length > 0) {
            return current;
          }
          return nextVehicleList.map(vehicle => vehicle.vin);
        });

        const allUpcoming: UpcomingItem[] = [];
        const nextSavedReminders: ReminderItem[] = [];
        const nextSavedReminderKeys = new Set<string>();
        const nextUnsupportedVehicles: Vehicle[] = [];

        for (const vehicle of vehicles) {
          const currentMileage = parseInt(vehicle.mileage || '0') || 0;

          let plan: {
            modelSpecific: boolean;
            items: MaintenancePlanItem[];
          } | null = null;
          if (currentMileage > 0) {
            try {
              plan = await getMaintenancePlan(
                vehicle.vin,
                currentMileage,
                vehicle.make,
                vehicle.model
              );
            } catch (error) {
              console.warn(
                'Unable to load maintenance plan',
                vehicle.vin,
                error
              );
            }
          }
          if (!plan?.modelSpecific) {
            nextUnsupportedVehicles.push({
              vin: vehicle.vin,
              make: vehicle.make,
              model: vehicle.model,
              year: vehicle.year,
              mileage: vehicle.mileage,
            });
          }
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

          const upcoming = plan?.items ?? [];

          allUpcoming.push(
            ...upcoming.map((item: MaintenancePlanItem) => ({
              id: item.serviceType,
              serviceType: item.serviceType,
              description: formatServiceTypeLabel(item.serviceType),
              frequency: `Every ${item.intervalMiles.toLocaleString()} miles or ${item.intervalMonths} months`,
              interval: item.intervalMiles,
              nextDueMileage: item.nextDueMileage,
              milesUntilDue: Math.max(0, item.nextDueMileage - currentMileage),
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
        setUnsupportedVehicles(nextUnsupportedVehicles);
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
      alert('Maintenance alerts are disabled in Account settings.');
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
      const milesUntilDue = Number(item.milesUntilDue || 0);
      // Reuse the same daily-mileage assumption as the "Predicted due date"
      // shown elsewhere on this page — a separate hardcoded 100 mi/day
      // constant here previously produced a visibly different calendar
      // date than the prediction shown two lines above the button.
      const dueDate = estimateDueDate(milesUntilDue);
      const maxDueDate = new Date();
      maxDueDate.setDate(maxDueDate.getDate() + 180);
      if (dueDate > maxDueDate) {
        dueDate.setTime(maxDueDate.getTime());
      }

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
        userFacingError(
          error,
          'The calendar event could not be created. Please try again.'
        )
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
      const message = userFacingError(
        error,
        'The reminder email could not be sent. Please try again.'
      );

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
      alert(message);
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

  const selectedVehicleVinSet = new Set(
    selectedVehicleVins.map(vin => vin.toUpperCase())
  );
  const isVehicleSelected = (vin: string) =>
    selectedVehicleVinSet.has(vin.toUpperCase());

  const visibleReminders = savedReminders.filter(reminder => {
    if (!isVehicleSelected(reminder.vin)) {
      return false;
    }

    if (reminderFilter === 'all') return true;
    return (reminder.status || 'active') === reminderFilter;
  });

  const visibleUpcomingItems = alertsEnabled
    ? upcomingItems.filter(item => {
        if (!isVehicleSelected(item.vehicle.vin)) {
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
    if (!isVehicleSelected(item.vehicle.vin)) {
      return false;
    }

    return (
      item.milesUntilDue > leadMilesThreshold &&
      item.milesUntilDue <= planningHorizonMiles
    );
  }).length;

  const recommendationsBeyondPlanWindow = upcomingItems.filter(item => {
    if (!isVehicleSelected(item.vehicle.vin)) {
      return false;
    }

    return item.milesUntilDue > planningHorizonMiles;
  }).length;

  type TimelineEntry =
    | {
        kind: 'recommendation';
        key: string;
        date: Date | null;
        item: UpcomingItem;
      }
    | { kind: 'reminder'; key: string; date: Date | null; item: ReminderItem };

  const timelineEntries: TimelineEntry[] = [
    ...visibleUpcomingItems.map((item): TimelineEntry => ({
      kind: 'recommendation',
      key: `rec-${item.vehicle.vin}-${item.serviceType}`,
      date: estimateDueDate(item.milesUntilDue),
      item,
    })),
    ...visibleReminders.map((reminder): TimelineEntry => {
      const date =
        typeof reminder.milesUntilDue === 'number'
          ? estimateDueDate(reminder.milesUntilDue)
          : reminder.snoozedUntil
            ? new Date(reminder.snoozedUntil)
            : null;
      return {
        kind: 'reminder',
        key: `rem-${reminder.id}`,
        date: date && !Number.isNaN(date.getTime()) ? date : null,
        item: reminder,
      };
    }),
  ].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.getTime() - b.date.getTime();
  });

  const toggleVehicleSelection = (vin: string) => {
    setSelectedVehicleVins(current =>
      current.includes(vin)
        ? current.filter(selectedVin => selectedVin !== vin)
        : [...current, vin]
    );
  };

  const selectAllVehicles = () => {
    setSelectedVehicleVins(vehicleList.map(vehicle => vehicle.vin));
  };

  const clearVehicleSelection = () => {
    setSelectedVehicleVins([]);
  };

  const getUrgencyColor = (milesUntilDue: number) => {
    if (milesUntilDue <= 1000)
      return 'text-danger-600 bg-danger-50 border-danger-200';
    if (milesUntilDue <= 5000)
      return 'text-warning-600 bg-warning-50 border-warning-200';
    return 'text-accent-600 bg-accent-50 border-accent-200';
  };

  const getUrgencyLabel = (milesUntilDue: number) => {
    if (milesUntilDue <= 1000) return 'Urgent';
    if (milesUntilDue <= 5000) return 'Soon';
    return 'Upcoming';
  };

  const getUrgencyDotColor = (milesUntilDue: number) => {
    if (milesUntilDue <= 1000) return 'bg-danger-500';
    if (milesUntilDue <= 5000) return 'bg-warning-500';
    return 'bg-accent-500';
  };

  const getReminderStatusBadge = (status?: string) => {
    switch (status) {
      case 'completed':
        return {
          label: 'Completed',
          badgeClassName: 'bg-accent-100 text-accent-800',
          cardClassName:
            'text-accent-700 bg-accent-50 border-accent-200 dark:text-accent-200 dark:bg-accent-950/20 dark:border-accent-900/40',
          dotColor: 'bg-accent-500',
        };
      case 'dismissed':
        return {
          label: 'Dismissed',
          badgeClassName:
            'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
          cardClassName:
            'text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-300 dark:bg-slate-900/40 dark:border-slate-700',
          dotColor: 'bg-slate-400',
        };
      case 'snoozed':
        return {
          label: 'Snoozed',
          badgeClassName: 'bg-warning-100 text-warning-800',
          cardClassName:
            'text-warning-700 bg-warning-50 border-warning-200 dark:text-warning-200 dark:bg-warning-950/20 dark:border-warning-900/40',
          dotColor: 'bg-warning-500',
        };
      default:
        return {
          label: 'Active',
          badgeClassName: 'bg-blue-100 text-blue-800',
          cardClassName:
            'text-slate-700 bg-white border-slate-200 dark:text-slate-200 dark:bg-slate-900 dark:border-slate-700',
          dotColor: 'bg-blue-500',
        };
    }
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
            Maintenance Plan
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

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:items-start">
        <div className="lg:col-span-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
          <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mt-0 mb-3 px-1">
            Planning Center
          </h2>
          <p className="mb-3 px-1 text-sm text-slate-600 dark:text-slate-400">
            This page estimates when service should surface based on your lead
            time and average daily driving. You can still reveal everything and
            save a reminder early when you want more manual control.
          </p>

          {vehicleList.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0 mb-2 px-1">
                Vehicles
              </p>
              <div className="flex flex-wrap gap-2 mb-2 px-1">
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
              <div className="max-h-40 overflow-y-auto space-y-1 px-1 pr-2">
                {vehicleList.map(vehicle => {
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
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
          {planningHorizonUpgrade && (
            <div className="mb-3 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-3 text-sm text-indigo-900 dark:border-indigo-900/40 dark:bg-indigo-950/30 dark:text-indigo-100">
              You're seeing the next{' '}
              <strong>{planningHorizonMonths} months</strong> of maintenance
              planning.{' '}
              <Link to="/app/subscription" className="font-medium underline">
                Upgrade to {planningHorizonUpgrade.planName}
              </Link>{' '}
              to plan {planningHorizonUpgrade.months} months ahead.
            </div>
          )}
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
          <p className="mb-0 px-1 text-xs text-slate-500 dark:text-slate-400">
            {reminderFilterDescriptions[reminderFilter]}
          </p>
        </div>

        <div className="lg:col-span-8 lg:sticky lg:top-4 max-h-[calc(100dvh-6rem)] overflow-y-auto bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Detail
          </p>
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
                {visibleReminders.length}
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
              {planningHorizonUpgrade &&
                recommendationsBeyondPlanWindow > 0 && (
                  <p className="m-0 mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Past your {planningHorizonMonths}-month horizon.{' '}
                    <Link
                      to="/app/subscription"
                      className="font-medium underline"
                    >
                      Upgrade
                    </Link>{' '}
                    to see further ahead.
                  </p>
                )}
            </div>
          </div>

          {timelineEntries.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                All caught up!
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {alertsEnabled
                  ? showAllRecommendations
                    ? 'No upcoming maintenance recommendations or saved reminders were found for the selected vehicles.'
                    : 'No upcoming maintenance tasks fall inside your current reminder window.'
                  : 'Maintenance alerts are disabled in Account settings.'}
              </p>
              {unsupportedVehicles.length > 0 && (
                <p className="mt-2 text-sm text-warning-700 dark:text-warning-400 max-w-md mx-auto">
                  We don't have manufacturer maintenance data for{' '}
                  {unsupportedVehicles
                    .map(v => `${v.year} ${v.make} ${v.model}`)
                    .join(', ')}
                  , so this isn't a confirmed clean bill of health for{' '}
                  {unsupportedVehicles.length === 1 ? 'it' : 'them'} — log your
                  own service history to get personalized reminders.
                </p>
              )}
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
                    Upcoming Timeline
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 m-0">
                    {timelineEntries.length} item
                    {timelineEntries.length === 1 ? '' : 's'} — recommendations
                    and saved reminders, ordered by estimated due date
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Due dates are estimated from current mileage and your saved
                    driving pace. Save a reminder whenever you want a manual
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

              <div className="relative">
                <div className="absolute left-24 top-0 bottom-0 w-0.5 bg-slate-300 dark:bg-slate-600"></div>

                <div className="space-y-6">
                  {timelineEntries.map(entry => (
                    <div key={entry.key} className="relative flex items-start">
                      <div className="w-20 shrink-0 pt-6 pr-2 text-right text-xs font-medium text-slate-500 dark:text-slate-400">
                        {entry.date ? entry.date.toLocaleDateString() : '—'}
                      </div>

                      <div
                        className={`shrink-0 w-4 h-4 rounded-full mt-6 ml-2 border-4 border-white dark:border-slate-800 ${
                          entry.kind === 'recommendation'
                            ? getUrgencyDotColor(entry.item.milesUntilDue)
                            : getReminderStatusBadge(entry.item.status).dotColor
                        }`}
                      ></div>

                      <div className="ml-8 flex-1">
                        {entry.kind === 'recommendation' ? (
                          <div
                            className={`border rounded-lg p-6 ${getUrgencyColor(entry.item.milesUntilDue)}`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                  <h3 className="font-semibold text-lg m-0">
                                    {entry.item.description}
                                  </h3>
                                  <span
                                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                                      entry.item.milesUntilDue <= 1000
                                        ? 'bg-danger-100 text-danger-800'
                                        : entry.item.milesUntilDue <= 5000
                                          ? 'bg-warning-100 text-warning-800'
                                          : 'bg-accent-100 text-accent-800'
                                    }`}
                                  >
                                    {getUrgencyLabel(entry.item.milesUntilDue)}
                                  </span>
                                </div>

                                <div className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                  <span className="font-medium">
                                    {entry.item.vehicle.year}{' '}
                                    {entry.item.vehicle.make}{' '}
                                    {entry.item.vehicle.model}
                                  </span>
                                  <span className="mx-2">•</span>
                                  <span>{entry.item.frequency}</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700 dark:text-slate-300">
                                  <div>
                                    <span className="font-medium">Due at:</span>{' '}
                                    {entry.item.nextDueMileage.toLocaleString()}{' '}
                                    miles
                                  </div>
                                  <div>
                                    <span className="font-medium">
                                      Miles until due:
                                    </span>{' '}
                                    {entry.item.milesUntilDue.toLocaleString()}
                                  </div>
                                </div>
                                {hasAiPredictions && (
                                  <p className="mt-2 mb-0 text-sm text-indigo-800 dark:text-indigo-200">
                                    Predicted due date:{' '}
                                    {estimateDueDateLabel(
                                      entry.item.milesUntilDue
                                    )}
                                  </p>
                                )}
                                {entry.item.milesUntilDue >
                                leadMilesThreshold ? (
                                  <p className="mt-3 mb-0 rounded-md border border-warning-200 bg-warning-50 px-3 py-2 text-sm text-warning-900">
                                    Outside your current reminder window. You
                                    can still save it now if you want to track
                                    it early.
                                  </p>
                                ) : null}
                              </div>

                              <div className="min-w-[14rem]">
                                <div className="flex flex-col items-stretch gap-2 sm:items-end">
                                  <button
                                    onClick={() =>
                                      void handleSaveReminder(entry.item)
                                    }
                                    disabled={
                                      savedReminderKeys.has(
                                        buildReminderKey(
                                          entry.item.vehicle.vin,
                                          entry.item.serviceType
                                        )
                                      ) ||
                                      savingReminderKeys.has(
                                        buildReminderKey(
                                          entry.item.vehicle.vin,
                                          entry.item.serviceType
                                        )
                                      )
                                    }
                                    className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                  >
                                    {savingReminderKeys.has(
                                      buildReminderKey(
                                        entry.item.vehicle.vin,
                                        entry.item.serviceType
                                      )
                                    )
                                      ? 'Saving...'
                                      : savedReminderKeys.has(
                                            buildReminderKey(
                                              entry.item.vehicle.vin,
                                              entry.item.serviceType
                                            )
                                          )
                                        ? 'Reminder Saved'
                                        : entry.item.milesUntilDue >
                                            leadMilesThreshold
                                          ? 'Save Reminder Anyway'
                                          : 'Save Reminder'}
                                  </button>
                                  <button
                                    onClick={() =>
                                      void handleAddToCalendar(entry.item)
                                    }
                                    disabled={savingCalendarKeys.has(
                                      buildReminderKey(
                                        entry.item.vehicle.vin,
                                        entry.item.serviceType
                                      )
                                    )}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                  >
                                    {savingCalendarKeys.has(
                                      buildReminderKey(
                                        entry.item.vehicle.vin,
                                        entry.item.serviceType
                                      )
                                    )
                                      ? 'Adding...'
                                      : 'Add to Calendar'}
                                  </button>
                                  <p className="m-0 text-xs text-slate-500 dark:text-slate-400 sm:text-right">
                                    Save a reminder to keep this item tracked
                                    after you leave this page.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`border rounded-lg p-6 ${getReminderStatusBadge(entry.item.status).cardClassName}`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                  <h3 className="font-semibold text-lg m-0">
                                    {entry.item.title}
                                  </h3>
                                  <span
                                    className={`px-2 py-1 text-xs font-medium rounded-full ${getReminderStatusBadge(entry.item.status).badgeClassName}`}
                                  >
                                    {
                                      getReminderStatusBadge(entry.item.status)
                                        .label
                                    }
                                  </span>
                                </div>

                                <div className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                  <span className="font-medium">
                                    {vehicleLookup[entry.item.vin]
                                      ? `${vehicleLookup[entry.item.vin].year} ${vehicleLookup[entry.item.vin].make} ${vehicleLookup[entry.item.vin].model}`
                                      : `VIN ${entry.item.vin}`}
                                  </span>
                                </div>

                                <div className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                                  {typeof entry.item.nextDueMileage ===
                                    'number' && (
                                    <div>
                                      <span className="font-medium">
                                        Due at:
                                      </span>{' '}
                                      {entry.item.nextDueMileage.toLocaleString()}{' '}
                                      miles
                                    </div>
                                  )}
                                  {entry.item.status === 'snoozed' &&
                                    entry.item.snoozedUntil && (
                                      <div>
                                        Snoozed until{' '}
                                        {formatDateLabel(
                                          entry.item.snoozedUntil
                                        )}
                                      </div>
                                    )}
                                  {entry.item.deliveryStatus === 'sent' &&
                                    entry.item.lastDeliveredAt && (
                                      <div>
                                        Email sent{' '}
                                        {formatDateLabel(
                                          entry.item.lastDeliveredAt
                                        )}
                                      </div>
                                    )}
                                  {entry.item.deliveryStatus === 'failed' && (
                                    <div className="text-danger-600 dark:text-danger-400">
                                      Delivery failed
                                      {entry.item.lastDeliveryError
                                        ? `: ${entry.item.lastDeliveryError}`
                                        : ''}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="min-w-[14rem]">
                                <div className="flex flex-wrap items-stretch gap-2 sm:flex-col sm:items-end">
                                  {entry.item.status === 'dismissed' ? (
                                    <button
                                      onClick={() =>
                                        void handleRestoreReminder(entry.item)
                                      }
                                      disabled={actingReminderIds.has(
                                        entry.item.id
                                      )}
                                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                      Restore
                                    </button>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() =>
                                          void handleSendReminderNow(entry.item)
                                        }
                                        disabled={
                                          entry.item.status === 'completed' ||
                                          entry.item.status === 'dismissed' ||
                                          actingReminderIds.has(
                                            entry.item.id
                                          ) ||
                                          sendingReminderIds.has(entry.item.id)
                                        }
                                        className="w-full px-3 py-1.5 border border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-300 rounded-md text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                      >
                                        {sendingReminderIds.has(entry.item.id)
                                          ? 'Sending...'
                                          : 'Send Email Now'}
                                      </button>
                                      <button
                                        onClick={() =>
                                          void handleSnoozeReminder(entry.item)
                                        }
                                        disabled={
                                          entry.item.status === 'completed' ||
                                          actingReminderIds.has(entry.item.id)
                                        }
                                        className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                      >
                                        Snooze 14 Days
                                      </button>
                                      <button
                                        onClick={() =>
                                          void handleCompleteReminder(
                                            entry.item
                                          )
                                        }
                                        disabled={
                                          entry.item.status === 'completed' ||
                                          actingReminderIds.has(entry.item.id)
                                        }
                                        className="w-full px-3 py-1.5 bg-slate-700 text-white rounded-md text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                      >
                                        Complete
                                      </button>
                                      <button
                                        onClick={() =>
                                          void handleDismissReminder(entry.item)
                                        }
                                        disabled={
                                          entry.item.status === 'completed' ||
                                          actingReminderIds.has(entry.item.id)
                                        }
                                        className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                      >
                                        Dismiss
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <h4 className="font-semibold mb-2 mt-0">Legend</h4>
                <div className="flex gap-4 text-sm flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-danger-200 rounded"></div>
                    <span>Urgent (≤1,000 miles)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-warning-200 rounded"></div>
                    <span>Soon (≤5,000 miles) / Snoozed reminder</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-accent-200 rounded"></div>
                    <span>Upcoming (&gt;5,000 miles) / Completed reminder</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-blue-200"></div>
                    <span>Active saved reminder</span>
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
