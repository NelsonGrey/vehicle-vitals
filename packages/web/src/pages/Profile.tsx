import { Link } from 'react-router-dom';
import { useAuth } from '../shared/AuthContext';
import { useFeatureFlag } from '../shared/useMonetization';

interface ProfileLinkProps {
  to: string;
  title: string;
  description: string;
}

function ProfileLink({ to, title, description }: ProfileLinkProps) {
  return (
    <Link
      to={to}
      className="block rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 no-underline hover:bg-slate-50 dark:hover:bg-slate-700/70 transition-colors"
    >
      <div className="font-medium text-slate-900 dark:text-slate-100">
        {title}
      </div>
      <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
        {description}
      </div>
    </Link>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const hasApiAccess = useFeatureFlag('api_access');

  if (!user) return null;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-5 py-5">
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
          to="/app/providers"
          title="Mechanics"
          description="Home address and nearby repair shop / dealership search."
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
