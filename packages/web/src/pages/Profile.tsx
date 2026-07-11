import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../shared/AuthContext';
import { useFeatureFlag } from '../shared/useMonetization';

interface ProfileLinkProps {
  to: string;
  title: string;
  description: string;
}

function ProfileLink({ to, title, description }: ProfileLinkProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <div className="flex items-center justify-between gap-3 p-4">
        <Link
          to={to}
          className="font-medium text-slate-900 dark:text-slate-100 no-underline hover:underline"
        >
          {title}
        </Link>
        <button
          type="button"
          onClick={() => setExpanded(current => !current)}
          aria-expanded={expanded}
          aria-label={expanded ? `Collapse ${title}` : `Expand ${title}`}
          className="shrink-0 rounded-md border border-slate-200 dark:border-slate-700 px-2 py-1 text-slate-500 dark:text-slate-400 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/70 cursor-pointer"
        >
          {expanded ? '▲' : '▼'}
        </button>
      </div>
      {expanded && (
        <div className="px-4 pb-4">
          <p className="text-sm text-slate-500 dark:text-slate-400 m-0">
            {description}
          </p>
          <Link
            to={to}
            className="mt-2 inline-block text-sm font-medium text-teal-700 dark:text-teal-400 hover:underline"
          >
            Go to {title} →
          </Link>
        </div>
      )}
    </section>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const hasApiAccess = useFeatureFlag('api_access');

  if (!user) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-5 py-5">
      <div className="mb-6">
        <h1 className="font-serif font-bold text-4xl text-slate-900 dark:text-slate-100 m-0">
          Profile
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mt-2 mb-0">
          Signed in as{' '}
          <strong className="text-slate-900 dark:text-slate-100">
            {user.email}
          </strong>
        </p>
      </div>

      <div className="space-y-3">
        <ProfileLink
          to="/app/account"
          title="Account & Security"
          description="Email, linked sign-in providers, and password."
        />
        <ProfileLink
          to="/app/maintenance-alerts"
          title="Maintenance Alerts"
          description="Reminder timing, driving distance, and push notifications."
        />
        <ProfileLink
          to="/app/account-consolidation"
          title="Merge & Share Garage"
          description="Consolidate a split account or convert to a household garage."
        />
        {hasApiAccess && (
          <ProfileLink
            to="/app/api-automation"
            title="API & Automation"
            description="API keys and Zapier webhook configuration."
          />
        )}
        <ProfileLink
          to="/app/data-privacy"
          title="Data & Privacy"
          description="Export your data or request account deletion."
        />
      </div>
    </div>
  );
}
