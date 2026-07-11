import { useState } from 'react';
import type { ComponentType } from 'react';
import { useAuth } from '../shared/AuthContext';
import { useFeatureFlag } from '../shared/useMonetization';
import { AccountSecurityContent } from './AccountSecurity';
import { MaintenanceAlertsContent } from './MaintenanceAlerts';
import { AccountConsolidationContent } from './AccountConsolidation';
import { ApiAutomationContent } from './ApiAutomation';
import { DataPrivacyContent } from './DataPrivacy';

interface ProfileSection {
  key: string;
  title: string;
  description: string;
  Content: ComponentType;
}

export default function Profile() {
  const { user } = useAuth();
  const hasApiAccess = useFeatureFlag('api_access');

  const sections: ProfileSection[] = [
    {
      key: 'account',
      title: 'Account & Security',
      description: 'Email, linked sign-in providers, and password.',
      Content: AccountSecurityContent,
    },
    {
      key: 'alerts',
      title: 'Maintenance Alerts',
      description:
        'Reminder timing, driving distance, and push notifications.',
      Content: MaintenanceAlertsContent,
    },
    {
      key: 'merge',
      title: 'Merge & Share Garage',
      description:
        'Consolidate a split account or convert to a household garage.',
      Content: AccountConsolidationContent,
    },
    ...(hasApiAccess
      ? [
          {
            key: 'api',
            title: 'API & Automation',
            description: 'API keys and Zapier webhook configuration.',
            Content: ApiAutomationContent,
          },
        ]
      : []),
    {
      key: 'privacy',
      title: 'Data & Privacy',
      description: 'Export your data or request account deletion.',
      Content: DataPrivacyContent,
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

        <div className="lg:col-span-8 lg:sticky lg:top-4 max-h-[calc(100dvh-6rem)] overflow-y-auto bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
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
              <selectedSection.Content />
            </>
          )}
        </div>
      </section>
    </div>
  );
}
