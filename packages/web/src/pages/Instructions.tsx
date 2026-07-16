import { Link } from 'react-router-dom';
import MarketingVideoPanel from '../components/MarketingVideoPanel';
import PageSEO from '../components/PageSEO';
import { ROUTE_SEO } from '../shared/seoMeta';
import { trackOnboardingStepAction } from '../shared/marketingAnalytics';
import { useAppOffline } from '../shared/useAppOffline';
// Header and footer provided by Layout

const quickLookSteps = [
  {
    stepId: 'add_vehicle',
    title: '1) Add your vehicle',
    description:
      'Enter your vehicle ID and basic details. We can help fill in common fields for you.',
    image: '/images/features/add-vehicle.png',
    ctaLabel: 'See add-vehicle demo',
    to: '/vin-lookup-demo',
  },
  {
    stepId: 'track_service_and_costs',
    title: '2) Track service and costs',
    description:
      'Save oil changes, repairs, and costs so your history stays organized and easy to find.',
    image: '/images/features/records.png',
    ctaLabel: 'See records demo',
    to: '/maintenance-planning-demo',
  },
  {
    stepId: 'stay_on_top_of_whats_next',
    title: '3) Stay on top of what is next',
    description:
      'Get simple reminders for upcoming service so you can plan ahead.',
    image: '/images/features/upcoming.png',
    ctaLabel: 'See reminders demo',
    to: '/help#maintenance-history-and-reminders',
  },
];

export default function Instructions() {
  const isAppOffline = useAppOffline();

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-5 py-6 sm:py-8 space-y-5 sm:space-y-6">
      <PageSEO meta={ROUTE_SEO['/getting-started']} />
      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 sm:p-6 shadow-sm">
        <h1 className="font-serif text-3xl sm:text-4xl text-slate-900 dark:text-slate-100 mb-3">
          Getting Started
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Follow this workflow to set up your garage, add records, and stay on
          top of maintenance.
        </p>
      </section>

      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 sm:p-6 shadow-sm">
        <h2 className="font-serif text-xl sm:text-2xl text-slate-900 dark:text-slate-100 mb-4">
          Simple setup steps
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Start with account access first. Your garage, service records,
          timeline, and reminders open after you sign in.
        </p>
        <ol className="list-decimal pl-5 space-y-3 text-slate-700 dark:text-slate-300">
          <li>
            {isAppOffline ? (
              <>
                Create an account or sign in from the{' '}
                <span
                  aria-disabled="true"
                  className="text-slate-400 dark:text-slate-500 cursor-not-allowed"
                >
                  login page
                </span>{' '}
                (currently unavailable).
              </>
            ) : (
              <>
                Create an account or sign in from the{' '}
                <Link
                  to="/auth/login"
                  className="underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-800"
                >
                  login page
                </Link>
                .
              </>
            )}
          </li>
          <li>
            After you sign in, open the{' '}
            <Link
              to="/app"
              className="underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-800"
            >
              web app
            </Link>{' '}
            to reach your garage and add your first vehicle.
          </li>
          <li>
            Enter the vehicle ID, use the lookup for faster setup, and fill any
            missing Year, Make, and Model details by hand if needed.
          </li>
          <li>
            Save service entries with date, mileage, notes, and cost to build a
            clear service record.
          </li>
          <li>
            Review Service History and your Maintenance Plan to catch up on
            past work and plan what is next.
          </li>
          <li>
            Configure account and notification preferences so reminders match
            your driving habits.
          </li>
          <li>
            Optional: find or save a place in{' '}
            <Link
              to="/app/providers"
              className="underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-800"
            >
              Shops &amp; Services
            </Link>{' '}
            so it is ready the next time you need service.
          </li>
        </ol>
      </section>

      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 sm:p-6 shadow-sm">
        <h2 className="font-serif text-xl sm:text-2xl text-slate-900 dark:text-slate-100 mb-4">
          Quick look at the first steps
        </h2>
        <div className="flex flex-col gap-5">
          {quickLookSteps.map(item => (
            <article
              key={item.title}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900/40 sm:flex-row"
            >
              <div className="relative h-56 overflow-hidden sm:h-auto sm:w-72 sm:shrink-0">
                <img
                  src={item.image}
                  alt={`${item.title} capability preview`}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent sm:bg-linear-to-r" />
                <div className="absolute bottom-3 left-3 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-slate-900">
                  Quick look
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-center p-5">
                <h3 className="font-serif text-xl text-slate-900 dark:text-slate-100">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
                  {item.description}
                </p>
                <Link
                  to={item.to}
                  onClick={() =>
                    trackOnboardingStepAction(item.stepId, item.ctaLabel)
                  }
                  className="mt-4 inline-flex w-fit items-center rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white"
                >
                  {item.ctaLabel}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 sm:p-6 shadow-sm">
        <h2 className="font-serif text-xl sm:text-2xl text-slate-900 dark:text-slate-100 mb-3">
          Getting Started Video
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          Watch a short walkthrough of first-time setup and the main things you
          will do in the app.
        </p>
        <MarketingVideoPanel
          title="Simple setup walkthrough"
          description="From account creation to saving your first service entry."
          poster="/images/features/add-vehicle.png"
          videoPath="/videos/feature-demos/getting-started-help.mp4"
          fallbackHref="/auth/signup"
          fallbackLabel="Start your account"
        />
      </section>

      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 sm:p-6 shadow-sm">
        <h2 className="font-serif text-xl sm:text-2xl text-slate-900 dark:text-slate-100 mb-3">
          Mobile Apps
        </h2>
        <p className="text-slate-700 dark:text-slate-300 mb-3">
          Our iOS and Android apps sync with your account so you can scan a
          vehicle ID, update mileage, and add notes on the go. Public App Store
          and Google Play listings are not available yet.
        </p>
        <p className="text-slate-600 dark:text-slate-400">
          Mobile access is currently limited to controlled distribution and
          internal testing while store launch work is in progress.
        </p>
        <p className="text-slate-600 dark:text-slate-400">
          Need troubleshooting or support details? Visit the{' '}
          <Link
            to="/help"
            className="underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-800"
          >
            Help section
          </Link>
          , or{' '}
          <Link
            to="/support"
            className="underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-800"
          >
            visit Support
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
