interface AppOfflineNoticeProps {
  title?: string;
}

/**
 * Shown in place of sign-in/sign-up forms and protected app content when the
 * app_offline Remote Config flag is on (see useAppOffline) — a pre-launch
 * window or a maintenance outage. Communicates the state instead of a silent
 * redirect or a dead-end form.
 */
export default function AppOfflineNotice({
  title = 'Vehicle-Vitals is not available right now',
}: AppOfflineNoticeProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700 text-center">
      <h1 className="font-serif font-bold text-2xl text-slate-900 dark:text-slate-100 mb-2">
        {title}
      </h1>
      <p className="text-slate-600 dark:text-slate-400">
        We're not accepting sign-ins or new accounts at the moment. Please
        check back soon.
      </p>
    </div>
  );
}
