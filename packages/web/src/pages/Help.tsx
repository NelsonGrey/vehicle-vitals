import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import MarketingVideoPanel from '../components/MarketingVideoPanel';
import {
  iosFaq,
  iosRoutes,
  troubleshootingFaq,
  websiteFaq,
  websiteRoutes,
  type FaqItem,
} from '../data/helpFaq';
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
      'Add a vehicle from the Garage with VIN decode, then review and complete any remaining fields before saving.',
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

const quickActions = [
  {
    title: 'Start your garage setup',
    details:
      'Use the guided onboarding flow if you are creating an account, adding your first vehicle, or learning where the main app pages live.',
    to: '/getting-started',
    ctaLabel: 'Open getting started',
  },
  {
    title: 'Fix reminder timing',
    details:
      'Go straight to profile if Upcoming Tasks is showing too much, too little, or not when you expect.',
    to: '/app/profile',
    ctaLabel: 'Open reminder preferences',
  },
  {
    title: 'Contact support',
    details:
      'Use this path when you are blocked, need account help, or want to report an issue with a specific workflow.',
    to: '/contact',
    ctaLabel: 'Contact support',
  },
];

const supportPaths = [
  {
    title: 'New here',
    summary: 'Account setup, first vehicle, and where to begin.',
    to: '/getting-started',
  },
  {
    title: 'Reminders look wrong',
    summary: 'Adjust lead time, daily miles, and task visibility.',
    to: '/app/profile',
  },
  {
    title: 'Need a human response',
    summary: 'Open support with browser/app version and issue details.',
    to: '/contact',
  },
];

function filterFaqItems(items: FaqItem[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return items;
  }

  return items.filter(item => {
    const haystack = [item.question, ...item.answers].join(' ').toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}

function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <details
          key={item.question}
          className="group rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50 px-4 py-3"
        >
          <summary className="cursor-pointer list-none text-slate-900 dark:text-slate-100 font-semibold flex items-start justify-between gap-3">
            <span>
              {index + 1}. {item.question}
            </span>
            <span className="text-slate-500 group-open:rotate-45 transition-transform">
              +
            </span>
          </summary>
          <div className="mt-3 space-y-2">
            {item.answers.map(answer => (
              <p
                key={`${item.question}-${answer}`}
                className="text-slate-700 dark:text-slate-300"
              >
                {answer}
              </p>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}

export default function Help() {
  const [faqQuery, setFaqQuery] = useState('');
  const filteredWebsiteFaq = useMemo(
    () => filterFaqItems(websiteFaq, faqQuery),
    [faqQuery]
  );
  const filteredIosFaq = useMemo(
    () => filterFaqItems(iosFaq, faqQuery),
    [faqQuery]
  );
  const filteredTroubleshootingFaq = useMemo(
    () => filterFaqItems(troubleshootingFaq, faqQuery),
    [faqQuery]
  );
  const totalFaqMatches =
    filteredWebsiteFaq.length +
    filteredIosFaq.length +
    filteredTroubleshootingFaq.length;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-5 py-6 sm:py-8 space-y-5 sm:space-y-6">
      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[1.4fr_0.9fr] lg:items-start">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-400">
              Support hub
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl text-slate-900 dark:text-slate-100 mb-3">
              Help Center
            </h1>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl">
              Find answers for the most common Vehicle Vitals questions and get
              to the right next step faster.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/50 p-4">
            <h2 className="mt-0 mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">
              Fastest paths
            </h2>
            <div className="space-y-3">
              {supportPaths.map(path => (
                <Link
                  key={path.title}
                  to={path.to}
                  className="block rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 transition hover:border-teal-300 hover:bg-teal-50/60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-teal-700 dark:hover:bg-teal-950/20"
                >
                  <div className="text-sm font-semibold">{path.title}</div>
                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {path.summary}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl text-slate-900 dark:text-slate-100 mb-1">
              Start Here
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 m-0">
              Choose the most likely next step instead of scanning the full FAQ
              first.
            </p>
          </div>
          <Link
            to="/contact"
            className="text-sm font-medium text-teal-700 underline dark:text-teal-300"
          >
            Skip to support contact
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {quickActions.map(action => (
            <article
              key={action.title}
              className="flex h-full flex-col rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50 p-4"
            >
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-0 mb-2">
                {action.title}
              </h3>
              <p className="text-slate-700 dark:text-slate-300 mb-4 flex-1">
                {action.details}
              </p>
              <Link
                to={action.to}
                className="inline-flex items-center rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white"
              >
                {action.ctaLabel}
              </Link>
            </article>
          ))}
        </div>
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
            description="Where to find troubleshooting topics, mechanic guidance, and support routes."
            poster="/images/features/providers.png"
            videoPath="/videos/feature-demos/help-center-overview.mp4"
            fallbackHref="/contact"
            fallbackLabel="Contact support"
          />
        </div>
      </section>

      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 sm:p-6 shadow-sm space-y-6">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl text-slate-900 dark:text-slate-100 mb-2">
            Detailed FAQs
          </h2>
          <p className="text-slate-700 dark:text-slate-300">
            Search across website, iOS, and troubleshooting answers when you
            need a specific detail. Use the quick actions above when you just
            need the right next step.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50 p-4">
          <label
            htmlFor="faq-search"
            className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
          >
            Search FAQs
          </label>
          <input
            id="faq-search"
            type="search"
            value={faqQuery}
            onChange={event => setFaqQuery(event.target.value)}
            placeholder="Search for reminders, VIN, mechanics, billing, iOS..."
            className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100"
          />
          <p className="mt-2 mb-0 text-xs text-slate-500 dark:text-slate-400">
            {faqQuery.trim()
              ? `${totalFaqMatches} matching FAQ ${totalFaqMatches === 1 ? 'entry' : 'entries'} found.`
              : 'Browse the full FAQ library below.'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3">
            <p className="m-0 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Website FAQ
            </p>
            <p className="m-0 mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {filteredWebsiteFaq.length}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3">
            <p className="m-0 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              iOS FAQ
            </p>
            <p className="m-0 mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {filteredIosFaq.length}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3">
            <p className="m-0 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Troubleshooting
            </p>
            <p className="m-0 mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {filteredTroubleshootingFaq.length}
            </p>
          </div>
        </div>

        {faqQuery.trim() && totalFaqMatches === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 p-4 text-sm text-slate-600 dark:text-slate-400">
            No FAQ entries matched that search. Try a broader term such as VIN,
            reminders, mechanics, billing, or account.
          </div>
        ) : null}

        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Website FAQ
          </h3>
          <FaqList items={filteredWebsiteFaq} />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
            iOS App FAQ
          </h3>
          <FaqList items={filteredIosFaq} />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Cross-Platform Troubleshooting
          </h3>
          <FaqList items={filteredTroubleshootingFaq} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Website route reference
            </h3>
            <ul className="space-y-1 text-slate-700 dark:text-slate-300 text-sm sm:text-base">
              {websiteRoutes.map(route => (
                <li key={route}>{route}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              iOS route reference
            </h3>
            <ul className="space-y-1 text-slate-700 dark:text-slate-300 text-sm sm:text-base">
              {iosRoutes.map(route => (
                <li key={route}>{route}</li>
              ))}
            </ul>
          </div>
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
