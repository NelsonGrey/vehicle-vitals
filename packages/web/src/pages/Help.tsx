import { Link } from 'react-router-dom';
import MarketingVideoPanel from '../components/MarketingVideoPanel';
// Header and footer provided by Layout

const helpTopics = [
  {
    title: 'Account and sign-in',
    details:
      'Use the login and forgot password flows to recover access. If your email changed, contact support for account assistance.',
  },
  {
    title: 'Adding or editing vehicles',
    details:
      'Add a vehicle from the Garage with VIN decode or manual year/make/model. Edit details any time from the vehicle dashboard.',
  },
  {
    title: 'Maintenance history and reminders',
    details:
      'Log services with date, mileage, notes, and cost. Review Timeline and Upcoming views to stay ahead of recommended work.',
  },
  {
    title: 'Subscription and billing',
    details:
      'Open Plans to review available tiers and manage subscription status from your profile and billing screens.',
  },
  {
    title: 'Mobile sync and notifications',
    details:
      'Web and mobile use the same account. Keep app notifications enabled to receive reminder and schedule alerts.',
  },
];

export default function Help() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-5 py-6 sm:py-8 space-y-5 sm:space-y-6">
      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 sm:p-6 shadow-sm">
        <h1 className="font-serif text-3xl sm:text-4xl text-slate-900 dark:text-slate-100 mb-3">
          Help Center
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Find answers for the most common Vehicle Vitals questions and support
          paths.
        </p>
      </section>

      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 sm:p-6 shadow-sm">
        <h2 className="font-serif text-xl sm:text-2xl text-slate-900 dark:text-slate-100 mb-4">
          Popular Topics
        </h2>
        <div className="space-y-4">
          {helpTopics.map(topic => (
            <article key={topic.title}>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
                {topic.title}
              </h3>
              <p className="text-slate-700 dark:text-slate-300">
                {topic.details}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 sm:p-6 shadow-sm">
        <h2 className="font-serif text-xl sm:text-2xl text-slate-900 dark:text-slate-100 mb-3">
          Help Video Walkthroughs
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          Short walkthrough clips for common setup and support tasks.
        </p>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <MarketingVideoPanel
            title="Getting Started Help"
            description="Account setup, first vehicle entry, and records flow in one concise walkthrough."
            poster="/images/features/add-vehicle.png"
            videoPath="/videos/feature-demos/getting-started-help.mp4"
            fallbackHref="/getting-started"
            fallbackLabel="Open getting started"
          />
          <MarketingVideoPanel
            title="Help Center Overview"
            description="Where to find troubleshooting topics, provider guidance, and support routes."
            poster="/images/features/providers.png"
            videoPath="/videos/feature-demos/help-center-overview.mp4"
            fallbackHref="/contact"
            fallbackLabel="Contact support"
          />
        </div>
      </section>

      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 sm:p-6 shadow-sm">
        <h2 className="font-serif text-xl sm:text-2xl text-slate-900 dark:text-slate-100 mb-3">
          Need More Help?
        </h2>
        <p className="text-slate-700 dark:text-slate-300 mb-3">
          If you still need assistance, contact support and include your browser
          or app version plus a short description of what happened.
        </p>
        <div className="flex flex-wrap items-center gap-3 text-sm sm:text-base">
          <Link
            to="/contact"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-800"
          >
            Contact Support
          </Link>
          <Link
            to="/getting-started"
            className="underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-800"
          >
            View Getting Started Workflow
          </Link>
        </div>
      </section>
    </div>
  );
}
