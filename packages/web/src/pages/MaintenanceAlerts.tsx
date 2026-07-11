import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../shared/AuthContext';
import { getVehicle, updateVehicle } from '../shared/firestoreService';
import { requestNotificationPermission } from '../shared/notificationService';

export function MaintenanceAlertsContent() {
  const { user } = useAuth();
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [maintenanceAlertsEnabled, setMaintenanceAlertsEnabled] =
    useState(true);
  const [preferredReminderTimingDays, setPreferredReminderTimingDays] =
    useState(14);
  const [preferredDailyMiles, setPreferredDailyMiles] = useState(35);
  const [pushPermission, setPushPermission] = useState<
    'granted' | 'denied' | 'default' | 'unsupported'
  >('unsupported');
  const [fcmToken, setFcmToken] = useState('');
  const [pushSaving, setPushSaving] = useState(false);

  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;
      try {
        const prefs = await getVehicle('preferences');
        const enabled = prefs?.maintenanceAlertsEnabled;
        const leadDays = Number(prefs?.preferredReminderTimingDays);
        const dailyMiles = Number(prefs?.preferredDailyMiles);

        if (typeof enabled === 'boolean') {
          setMaintenanceAlertsEnabled(enabled);
        }
        if (Number.isFinite(leadDays) && leadDays > 0) {
          setPreferredReminderTimingDays(Math.round(leadDays));
        }
        if (Number.isFinite(dailyMiles) && dailyMiles > 0) {
          setPreferredDailyMiles(Math.round(dailyMiles));
        }
        if (typeof prefs?.fcmToken === 'string') {
          setFcmToken(prefs.fcmToken);
        }
        if (typeof Notification !== 'undefined') {
          setPushPermission(
            Notification.permission as 'granted' | 'denied' | 'default'
          );
        }
      } catch (prefError) {
        console.warn('Unable to load reminder preferences', prefError);
      }
    };

    void loadPreferences();
  }, [user]);

  if (!user) return null;

  const savePreferences = async () => {
    setPreferencesSaving(true);
    setError('');
    setStatus('');
    try {
      await updateVehicle('preferences', {
        maintenanceAlertsEnabled,
        preferredReminderTimingDays,
        preferredDailyMiles,
      });
      setStatus('Reminder preferences saved.');
    } catch (prefError) {
      setError(
        prefError instanceof Error
          ? prefError.message
          : 'Failed to save reminder preferences'
      );
    } finally {
      setPreferencesSaving(false);
    }
  };

  const handleEnablePushNotifications = async () => {
    setPushSaving(true);
    setError('');
    setStatus('');
    try {
      const token = await requestNotificationPermission();
      if (token) {
        await updateVehicle('preferences', { fcmToken: token });
        setFcmToken(token);
        setPushPermission('granted');
        setStatus('Push notifications enabled for this browser.');
      } else {
        if (typeof Notification !== 'undefined') {
          setPushPermission(
            Notification.permission as 'granted' | 'denied' | 'default'
          );
        }
        setError(
          'Push notifications could not be enabled. Check your browser settings.'
        );
      }
    } catch (pushError) {
      setError(
        pushError instanceof Error
          ? pushError.message
          : 'Failed to enable push notifications'
      );
    } finally {
      setPushSaving(false);
    }
  };

  const handleDisablePushNotifications = async () => {
    setPushSaving(true);
    setError('');
    setStatus('');
    try {
      await updateVehicle('preferences', { fcmToken: '' });
      setFcmToken('');
      setStatus('Push notifications disabled.');
    } catch (pushError) {
      setError(
        pushError instanceof Error
          ? pushError.message
          : 'Failed to disable push notifications'
      );
    } finally {
      setPushSaving(false);
    }
  };

  return (
    <div>
      {status && (
        <div
          className="bg-accent-50 border border-accent-200 text-accent-700 px-4 py-3 rounded-lg mb-6"
          role="alert"
        >
          {status}
        </div>
      )}
      {error && (
        <div
          className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg mb-6"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6 space-y-6">
        <h2 className="font-serif font-bold text-2xl text-slate-900 dark:text-slate-100 m-0">
          Maintenance Alert Preferences
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 mt-0">
          Control whether maintenance reminders are generated and when they
          should appear before service is due.
        </p>
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
          Upcoming Tasks uses these settings to decide which services appear now
          and how far in advance to surface them. Higher values show work
          earlier; lower values keep the queue focused on near-term needs.
        </div>

        <div className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-4">
          <label className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
            <span>Enable maintenance alerts</span>
            <input
              type="checkbox"
              checked={maintenanceAlertsEnabled}
              onChange={event =>
                setMaintenanceAlertsEnabled(event.target.checked)
              }
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Preferred reminder lead time (days)
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0 mb-2">
            Example: 14 means the app starts showing work about two weeks before
            it estimates the service will be due.
          </p>
          <input
            type="number"
            min={1}
            max={90}
            value={preferredReminderTimingDays}
            onChange={event => {
              const next = Number(event.target.value);
              if (Number.isFinite(next)) {
                setPreferredReminderTimingDays(Math.max(1, Math.min(90, next)));
              }
            }}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
          />

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2 mt-4">
            Average driving distance (miles/day)
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0 mb-2">
            This helps convert mileage-based schedules into a practical reminder
            window. If you usually drive 35 miles a day, a 14-day lead time
            shows tasks roughly 490 miles before they are due.
          </p>
          <input
            type="number"
            min={1}
            max={250}
            value={preferredDailyMiles}
            onChange={event => {
              const next = Number(event.target.value);
              if (Number.isFinite(next)) {
                setPreferredDailyMiles(
                  Math.max(1, Math.min(250, Math.round(next)))
                );
              }
            }}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
          />
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => void savePreferences()}
            disabled={preferencesSaving}
            className="bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
          >
            {preferencesSaving ? 'Saving…' : 'Save Alert Preferences'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 space-y-4">
        <h2 className="font-serif font-bold text-2xl text-slate-900 dark:text-slate-100 m-0">
          Push Notifications
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 mb-0">
          Receive push notifications in this browser when maintenance reminders
          are due.
        </p>
        <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3">
          {pushPermission === 'unsupported' && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Push notifications are not supported in this browser.
            </p>
          )}
          {pushPermission === 'denied' && (
            <p className="text-sm text-warning-600 dark:text-warning-400">
              Notifications are blocked by your browser. To enable, update your
              browser or OS notification settings for this site.
            </p>
          )}
          {pushPermission === 'granted' && fcmToken && (
            <p className="text-sm text-accent-600 dark:text-accent-400">
              Push notifications are enabled for this browser.
            </p>
          )}
          {pushPermission !== 'unsupported' && pushPermission !== 'denied' && (
            <div className="flex gap-3 flex-wrap">
              {!fcmToken ? (
                <button
                  type="button"
                  id="enablePushNotifications"
                  onClick={() => void handleEnablePushNotifications()}
                  disabled={pushSaving}
                  className="bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                >
                  {pushSaving ? 'Enabling…' : 'Enable Push Notifications'}
                </button>
              ) : (
                <button
                  type="button"
                  id="disablePushNotifications"
                  onClick={() => void handleDisablePushNotifications()}
                  disabled={pushSaving}
                  className="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-medium py-2 px-4 rounded-md transition-colors duration-200 disabled:opacity-60"
                >
                  {pushSaving ? 'Disabling…' : 'Disable Push Notifications'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MaintenanceAlerts() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-5 py-5">
      <div className="flex items-start justify-between gap-4 mb-6">
        <h1 className="font-serif font-bold text-4xl text-slate-900 dark:text-slate-100 m-0">
          Maintenance Alerts
        </h1>
        <Link
          to="/app/profile"
          className="inline-block px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg no-underline text-slate-900 dark:text-slate-100"
        >
          Back
        </Link>
      </div>
      <MaintenanceAlertsContent />
    </div>
  );
}
