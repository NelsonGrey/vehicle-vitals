import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  iosFaq,
  troubleshootingFaq,
  websiteFaq,
  type FaqItem,
} from '../data/helpFaq';
import { useFeatureFlag } from '../shared/useMonetization';
// Header and footer provided by Layout

const helpTopics = [
  {
    title: 'Account and sign-in',
    details:
      'Use the login and forgot password flows to recover access. If your email changed, contact support for account assistance.',
  },
  {
    title: 'Adding or changing a vehicle',
    details:
      'Add a vehicle from the Garage, use the lookup for faster setup, and fill in any missing details before saving.',
  },
  {
    title: 'Maintenance history and reminders',
    details:
      'Save services with date, mileage, notes, and cost. Use Timeline and Upcoming to stay ahead of work that is coming up.',
  },
  {
    title: 'Plans and billing',
    details:
      'Open Plans to compare options and manage billing from your profile and billing screens.',
  },
  {
    title: 'Mobile sync and notifications',
    details:
      'Web and mobile use the same account. Keep app notifications on to get reminder and schedule alerts.',
  },
];

const quickActions = [
  {
    title: 'Start your garage setup',
    details:
      'Use the guided setup if you are creating an account, adding your first vehicle, or learning where the main app pages live.',
    to: '/getting-started',
    ctaLabel: 'Open getting started',
  },
  {
    title: 'Fix reminder timing',
    details:
      'Review the public reminder guidance when Upcoming Tasks is showing too much, too little, or not when you expect.',
    to: '/help#maintenance-history-and-reminders',
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
    to: '/help#maintenance-history-and-reminders',
  },
  {
    title: 'Need a human response',
    summary: 'Open support with browser/app version and issue details.',
    to: '/contact',
  },
];

const glossaryTerms = [
  {
    term: 'Vehicle ID',
    meaning:
      'The unique number for your vehicle, such as VIN, HIN, or another serial number.',
  },
  {
    term: 'Vehicle Lookup',
    meaning:
      'A quick tool that can fill in details like year, make, and model from your vehicle ID.',
  },
  {
    term: 'Garage',
    meaning: 'Your main list of saved vehicles.',
  },
  {
    term: 'Records',
    meaning: 'Where you save service history, notes, costs, and attachments.',
  },
  {
    term: 'Upcoming Tasks',
    meaning:
      'A list of service items that may be due soon, based on your vehicle history and settings.',
  },
  {
    term: 'Timeline',
    meaning: 'A date-by-date view of work completed on your vehicle.',
  },
  {
    term: 'Snooze reminder',
    meaning: 'Push a reminder to show again later.',
  },
  {
    term: 'Dismiss reminder',
    meaning: 'Hide a reminder for now. You can bring it back later if needed.',
  },
  {
    term: 'Plans and billing',
    meaning: 'Where you compare plan options and manage your billing details.',
  },
  {
    term: 'Premium',
    meaning: 'Paid plan options that include extra features and higher limits.',
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

function createSectionId(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
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
  const hasPrioritySupport = useFeatureFlag('priority_support');
  const hasPhoneSupport = useFeatureFlag('phone_support');
  const [faqQuery, setFaqQuery] = useState('');
  const location = useLocation();
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

  useEffect(() => {
    if (location.hash !== '#maintenance-history-and-reminders') {
      return;
    }

    const targetElement = document.getElementById(
      'maintenance-history-and-reminders'
    );

    targetElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [location.hash]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-5 py-6 sm:py-8 space-y-5 sm:space-y-6">
      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[1.4fr_0.9fr] lg:items-start">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl text-slate-900 dark:text-slate-100 mb-3">
              Help Center
            </h1>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl">
              This page is for using the app: setup steps, common tasks, and
              troubleshooting. If you are deciding whether the app is right for
              you, use the product overview page.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to="/"
                className="inline-flex items-center rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-800 dark:text-slate-200"
              >
                View product overview
              </Link>
              <Link
                to="/getting-started"
                className="inline-flex items-center rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white"
              >
                Open setup guide
              </Link>
            </div>
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
        <h2 className="font-serif text-xl sm:text-2xl text-slate-900 dark:text-slate-100 mb-3">
          Product overview vs. Help
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <article className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50 p-4">
            <h3 className="m-0 text-lg font-semibold text-slate-900 dark:text-slate-100">
              Use Product Overview for
            </h3>
            <p className="m-0 mt-2 text-slate-700 dark:text-slate-300">
              Learning what the app does, who it helps, and whether it fits your
              needs.
            </p>
            <Link
              to="/"
              className="mt-3 inline-flex items-center text-sm font-medium text-teal-700 underline dark:text-teal-300"
            >
              Go to product overview
            </Link>
          </article>
          <article className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50 p-4">
            <h3 className="m-0 text-lg font-semibold text-slate-900 dark:text-slate-100">
              Use Help for
            </h3>
            <p className="m-0 mt-2 text-slate-700 dark:text-slate-300">
              Step-by-step setup, daily tasks, troubleshooting, and support
              contact.
            </p>
            <Link
              to="/getting-started"
              className="mt-3 inline-flex items-center text-sm font-medium text-teal-700 underline dark:text-teal-300"
            >
              Open setup steps
            </Link>
          </article>
        </div>
      </section>

      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl text-slate-900 dark:text-slate-100 mb-1">
              Quick help
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 m-0">
              Pick the most likely next step without reading the full FAQ.
            </p>
          </div>
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
            <article
              key={topic.title}
              id={createSectionId(topic.title)}
              tabIndex={-1}
            >
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

      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 sm:p-6 shadow-sm space-y-6">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl text-slate-900 dark:text-slate-100 mb-2">
            More answers
          </h2>
          <p className="text-slate-700 dark:text-slate-300">
            Search across website, iOS, and troubleshooting answers when you
            need a specific detail. Use the quick actions above when you just
            need the next step.
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
            placeholder="Search for reminders, vehicle ID, mechanics, billing, iOS..."
            className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100"
          />
          <p className="mt-2 mb-0 text-xs text-slate-500 dark:text-slate-400">
            {faqQuery.trim()
              ? `${totalFaqMatches} matching FAQ ${totalFaqMatches === 1 ? 'entry' : 'entries'} found.`
              : 'Browse the answers below.'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3">
            <p className="m-0 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Website answers
            </p>
            <p className="m-0 mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {filteredWebsiteFaq.length}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3">
            <p className="m-0 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              iOS answers
            </p>
            <p className="m-0 mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {filteredIosFaq.length}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3">
            <p className="m-0 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Troubleshooting help
            </p>
            <p className="m-0 mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {filteredTroubleshootingFaq.length}
            </p>
          </div>
        </div>

        {faqQuery.trim() && totalFaqMatches === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 p-4 text-sm text-slate-600 dark:text-slate-400">
            No answers matched that search. Try a broader term like vehicle ID,
            reminders, mechanics, billing, or account.
          </div>
        ) : null}

        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Website answers
          </h3>
          <FaqList items={filteredWebsiteFaq} />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
            iOS answers
          </h3>
          <FaqList items={filteredIosFaq} />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Troubleshooting help
          </h3>
          <FaqList items={filteredTroubleshootingFaq} />
        </div>
      </section>

      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 sm:p-6 shadow-sm">
        <h2 className="font-serif text-xl sm:text-2xl text-slate-900 dark:text-slate-100 mb-3">
          Plain-language glossary
        </h2>
        <p className="text-slate-700 dark:text-slate-300 mb-4">
          Quick definitions for common terms used in the app.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {glossaryTerms.map(item => (
            <article
              key={item.term}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50 px-4 py-3"
            >
              <h3 className="m-0 text-base font-semibold text-slate-900 dark:text-slate-100">
                {item.term}
              </h3>
              <p className="m-0 mt-1 text-sm text-slate-700 dark:text-slate-300">
                {item.meaning}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 sm:p-6 shadow-sm">
        <h2 className="font-serif text-xl sm:text-2xl text-slate-900 dark:text-slate-100 mb-3">
          Need more help?
        </h2>
        <p className="text-slate-700 dark:text-slate-300 mb-3">
          If you still need help, contact support and include your browser or
          app version plus a short description of what happened.
        </p>
        <div className="mb-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50 px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
          {hasPhoneSupport ? (
            <>
              <p className="m-0 font-semibold text-slate-900 dark:text-slate-100">
                Premium support enabled
              </p>
              <p className="m-0 mt-1">
                You have priority email handling and phone support access for
                escalations.
              </p>
              <p className="m-0 mt-1">
                Priority line:{' '}
                <a className="underline" href="tel:+18005551234">
                  +1 (800) 555-1234
                </a>
              </p>
            </>
          ) : hasPrioritySupport ? (
            <>
              <p className="m-0 font-semibold text-slate-900 dark:text-slate-100">
                Priority support enabled
              </p>
              <p className="m-0 mt-1">
                Your account includes priority email support handling.
              </p>
            </>
          ) : (
            <>
              <p className="m-0 font-semibold text-slate-900 dark:text-slate-100">
                Standard support
              </p>
              <p className="m-0 mt-1">
                Email support is available for all users. Upgrade for priority
                response and phone escalation options.
              </p>
              <Link
                to="/app/subscription"
                className="inline-flex mt-2 text-sm font-medium underline text-teal-700 dark:text-teal-300"
              >
                Compare support plans
              </Link>
            </>
          )}
        </div>
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
            Open getting started
          </Link>
        </div>
      </section>
    </div>
  );
}
