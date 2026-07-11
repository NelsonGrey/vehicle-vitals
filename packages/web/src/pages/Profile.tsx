import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../shared/AuthContext';
import { useFeatureFlag } from '../shared/useMonetization';

interface ProfileSection {
  key: string;
  to: string;
  title: string;
  description: string;
}

export default function Profile() {
  const { user } = useAuth();
  const hasApiAccess = useFeatureFlag('api_access');

  const sections: ProfileSection[] = [
    {
      key: 'account',
      to: '/app/account',
      title: 'Account & Security',
      description: 'Email, linked sign-in providers, and password.',
    },
    {
      key: 'alerts',
      to: '/app/maintenance-alerts',
      title: 'Maintenance Alerts',
      description:
        'Reminder timing, driving distance, and push notifications.',
    },
    {
      key: 'merge',
      to: '/app/account-consolidation',
      title: 'Merge & Share Garage',
      description:
        'Consolidate a split account or convert to a household garage.',
    },
    ...(hasApiAccess
      ? [
          {
            key: 'api',
            to: '/app/api-automation',
            title: 'API & Automation',
            description: 'API keys and Zapier webhook configuration.',
          },
        ]
      : []),
    {
      key: 'privacy',
      to: '/app/data-privacy',
      title: 'Data & Privacy',
      description: 'Export your data or request account deletion.',
    },
  ];

  const [selectedKey, setSelectedKey] = useState(sections[0]?.key);
  const selectedSection =
    sections.find(section => section.key === selectedKey) ?? sections[0];

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

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:items-start">
        <div className="lg:col-span-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
          <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mt-0 mb-3 px-1">
            Settings
          </h2>
          <div className="space-y-2">
            {sections.map(section => {
              const isSelected = section.key === selectedSection?.key;
              return (
                <button
                  key={section.key}
                  type="button"
                  onClick={() => setSelectedKey(section.key)}
                  aria-current={isSelected}
                  className={`w-full text-left rounded-lg border p-3 transition-colors ${
                    isSelected
                      ? 'border-slate-500 bg-slate-100 dark:border-slate-300 dark:bg-slate-700'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/70'
                  }`}
                >
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {section.title}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                    {section.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          {!selectedSection ? (
            <p className="text-slate-600 dark:text-slate-400 m-0">
              Select a section to view details.
            </p>
          ) : (
            <>
              <h2 className="font-semibold text-xl text-slate-900 dark:text-slate-100 mt-0 mb-1">
                {selectedSection.title}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0 mb-4">
                {selectedSection.description}
              </p>
              <Link
                to={selectedSection.to}
                className="inline-block px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg no-underline text-sm font-medium"
              >
                Go to {selectedSection.title} →
              </Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
