import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { denyConsent, grantConsent, hasDecided } from '../shared/consent';

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hasDecided()) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  function handleAccept() {
    grantConsent();
    setVisible(false);
  }

  function handleDeny() {
    denyConsent();
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-lg"
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <p className="flex-1 text-sm text-slate-700 dark:text-slate-300">
          We use cookies and similar technologies for analytics and advertising.
          See our{' '}
          <Link
            to="/privacy"
            className="underline text-slate-900 dark:text-slate-100 hover:text-slate-600 dark:hover:text-slate-400"
          >
            Privacy Policy
          </Link>{' '}
          for details.
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleDeny}
            className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            Essential only
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-sm rounded-lg bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-200 transition-colors"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
