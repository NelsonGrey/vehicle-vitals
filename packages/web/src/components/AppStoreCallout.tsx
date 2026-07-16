const appStoreUrl = String(import.meta.env.VITE_IOS_APP_STORE_URL || '').trim();

export default function AppStoreCallout() {
  if (appStoreUrl) {
    return (
      <a
        href={appStoreUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900"
      >
        View Vehicle-Vitals on the App Store
      </a>
    );
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
      <p className="font-semibold">iPhone app: final release validation</p>
      <p className="mt-1">
        The public App Store link will appear here when the listing is approved.
        You can start with the web app now and use the same account on iPhone
        after release.
      </p>
    </div>
  );
}
