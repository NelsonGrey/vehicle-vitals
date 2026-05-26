import { Link } from 'react-router-dom';
import HeaderAdBar from '../components/HeaderAdBar';
import InlineAdSection from '../components/InlineAdSection';
import MarketingVideoPanel from '../components/MarketingVideoPanel';
import SiteFooter from '../components/SiteFooter';
import SiteHeader from '../components/SiteHeader';

export default function Landing() {
  const startSteps = [
    {
      title: '1) Add your vehicle',
      description:
        'Enter your vehicle ID and basic details. We can help fill in common fields for you.',
      image: '/images/features/add-vehicle.png',
      ctaLabel: 'See add-vehicle demo',
      to: '/getting-started',
    },
    {
      title: '2) Track service and costs',
      description:
        'Save oil changes, repairs, and costs so your history stays organized and easy to find.',
      image: '/images/features/records.png',
      ctaLabel: 'See records demo',
      to: '/maintenance-planning-demo',
    },
    {
      title: '3) Stay on top of what is next',
      description:
        'Get simple reminders for upcoming service so you can plan ahead.',
      image: '/images/features/upcoming.png',
      ctaLabel: 'See reminders demo',
      to: '/cross-platform-access-demo',
    },
  ];

  const everydayScreens = [
    {
      title: 'Your garage overview',
      description:
        'See all vehicles in one place and jump to what you need quickly.',
      image: '/images/features/garage-vehicles.png',
      appPath: '/app',
      platform: 'Web',
    },
    {
      title: 'Vehicle details',
      description:
        'Review mileage, past service, and recent activity for one vehicle.',
      image: '/images/features/garage-detail.png',
      appPath: '/app',
      platform: 'Web',
    },
    {
      title: 'Add vehicle screen',
      description: 'A simple form to set up your first vehicle.',
      image: '/images/features/add-vehicle.png',
      appPath: '/app/add-vehicle',
      platform: 'Web',
    },
    {
      title: 'Service records',
      description:
        'Save what was done, when it happened, and how much it cost.',
      image: '/images/features/records.png',
      appPath: '/app',
      platform: 'Web',
    },
    {
      title: 'Find mechanics nearby',
      description: 'Find local shops close to your saved location.',
      image: '/images/features/providers.png',
      appPath: '/app/providers',
      platform: 'Web',
    },
    {
      title: 'Timeline view',
      description: 'See your vehicle history in date order.',
      image: '/images/features/timeline.png',
      appPath: '/app/timeline',
      platform: 'Web',
    },
  ];

  const demoVideoReady = [
    {
      title: 'Getting started video',
      description:
        'A quick walkthrough of sign-up, adding a vehicle, and opening your garage.',
      poster: '/images/features/add-vehicle.png',
      videoPath: '/videos/feature-demos/onboarding-walkthrough.mp4',
      fallbackHref: '/getting-started',
      fallbackLabel: 'Open getting started guide',
    },
    {
      title: 'Service tracking video',
      description:
        'See how to log service, review history, and track upcoming work.',
      poster: '/images/features/timeline.png',
      videoPath: '/videos/feature-demos/maintenance-lifecycle-tour.mp4',
      fallbackHref: '/maintenance-planning-demo',
      fallbackLabel: 'Open service tracking demo',
    },
    {
      title: 'Web and mobile video',
      description: 'See how the same account works on both web and mobile.',
      poster: '/images/features/ios-home.png',
      videoPath: '/videos/feature-demos/cross-platform-continuity.mp4',
      fallbackHref: '/cross-platform-access-demo',
      fallbackLabel: 'Open web and mobile demo',
    },
  ];

  return (
    <div className="h-[100dvh] min-h-screen flex flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <SiteHeader overlay={false} />
      <HeaderAdBar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-900">
        <section className="py-8 sm:py-10 lg:py-12">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-5">
            <section className="mb-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3">
              <p className="m-0 text-xs font-semibold uppercase tracking-[0.12em] text-teal-700 dark:text-teal-300">
                You are viewing: Product Overview
              </p>
              <p className="m-0 mt-1 text-sm text-slate-700 dark:text-slate-300">
                This page is for understanding what the app does and who it
                helps. For setup and troubleshooting, open Help.
              </p>
              <div className="mt-2 flex flex-wrap gap-3 text-sm">
                <Link
                  to="/help"
                  className="text-teal-700 underline dark:text-teal-300"
                >
                  Go to help & how-to
                </Link>
                <Link
                  to="/app"
                  className="text-teal-700 underline dark:text-teal-300"
                >
                  Open application workspace
                </Link>
              </div>
            </section>

            <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 shadow-2xl">
              <img
                src="/images/hero-garage.jpg"
                alt="Organized garage workspace demonstrating vehicle record keeping"
                className="absolute inset-0 h-full w-full object-cover opacity-40"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/70 to-emerald-950/60" />
              <div className="relative px-6 py-10 sm:px-10 sm:py-14 lg:px-12 lg:py-16">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-100 ring-1 ring-white/30">
                  Vehicle Vitals
                </div>
                <h1 className="mt-4 max-w-2xl font-serif text-3xl leading-tight text-white sm:text-4xl lg:text-5xl">
                  Keep your vehicle records clear and easy to manage
                </h1>
                <p className="mt-4 max-w-2xl text-base text-slate-100/90 sm:text-lg">
                  We help you save service history, track costs, and stay on top
                  of upcoming work. This page shows short, plain-language
                  previews before you sign in.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link
                    to="/auth/signup"
                    className="inline-block w-full rounded-xl bg-white px-6 py-3 text-center font-semibold text-slate-900 transition hover:bg-slate-100 sm:w-auto"
                  >
                    Create your account
                  </Link>
                  <Link
                    to="/getting-started"
                    className="inline-block w-full rounded-xl border border-white/40 bg-white/10 px-6 py-3 text-center font-semibold text-white transition hover:bg-white/20 sm:w-auto"
                  >
                    See step-by-step setup
                  </Link>
                </div>
                <div className="mt-6 grid grid-cols-1 gap-3 text-sm text-slate-100 sm:grid-cols-3">
                  <div className="rounded-xl bg-white/10 px-3 py-2 ring-1 ring-white/20">
                    Easy setup
                  </div>
                  <div className="rounded-xl bg-white/10 px-3 py-2 ring-1 ring-white/20">
                    Clear reminders
                  </div>
                  <div className="rounded-xl bg-white/10 px-3 py-2 ring-1 ring-white/20">
                    Full history in one place
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-10 sm:mt-12">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100 sm:text-3xl">
                    Start in 3 simple steps
                  </h2>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
                    Each section below is short and focused so you can scan
                    fast.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {startSteps.map(item => (
                  <article
                    key={item.title}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
                  >
                    <div className="relative h-56 sm:h-64 overflow-hidden">
                      <img
                        src={item.image}
                        alt={`${item.title} capability preview`}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent" />
                      <div className="absolute bottom-3 left-3 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-slate-900">
                        Quick look
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-serif text-xl text-slate-900 dark:text-slate-100">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
                        {item.description}
                      </p>
                      <Link
                        to={item.to}
                        className="mt-4 inline-flex items-center rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white"
                      >
                        {item.ctaLabel}
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="mt-10 sm:mt-12">
              <div className="mb-5">
                <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100 sm:text-3xl">
                  Everyday screens you will use
                </h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
                  A small set of screenshots to show the most common tasks.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {everydayScreens.map(feature => (
                  <article
                    key={feature.title}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
                  >
                    <div className="relative h-56 sm:h-64 overflow-hidden">
                      <img
                        src={feature.image}
                        alt={`${feature.title} application screenshot`}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
                      <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-900">
                        {feature.platform}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-serif text-lg text-slate-900 dark:text-slate-100">
                        {feature.title}
                      </h3>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        {feature.description}
                      </p>
                      <Link
                        to="/auth/login"
                        className="mt-3 inline-flex items-center text-sm font-medium text-slate-700 underline transition hover:text-slate-900 dark:text-slate-200 dark:hover:text-white"
                      >
                        Sign in to open {feature.appPath}
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="mt-10 sm:mt-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-5">
                <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100 sm:text-3xl">
                  Short video tours
                </h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
                  Three short videos that explain the basics in plain language.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {demoVideoReady.map(item => (
                  <MarketingVideoPanel
                    key={item.title}
                    title={item.title}
                    description={item.description}
                    poster={item.poster}
                    videoPath={item.videoPath}
                    fallbackHref={item.fallbackHref}
                    fallbackLabel={item.fallbackLabel}
                  />
                ))}
              </div>
            </section>

            <section className="mt-10 sm:mt-12 grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-700 dark:bg-emerald-950/30">
                <h3 className="font-serif text-2xl text-emerald-900 dark:text-emerald-100">
                  Built for everyday drivers
                </h3>
                <p className="mt-2 text-emerald-900/85 dark:text-emerald-200/90">
                  No jargon, no guesswork. You can add a vehicle, save service
                  work, and follow reminders with simple screens.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
                <h3 className="font-serif text-2xl text-slate-900 dark:text-slate-100">
                  Ready to try it?
                </h3>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                  Start with an account, then open your garage and add your
                  first vehicle.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    to="/auth/login"
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-700"
                  >
                    Login
                  </Link>
                  <Link
                    to="/auth/signup"
                    className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white"
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            </section>

            <div className="mt-8 text-center text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Want extra help getting started?{' '}
              <Link
                to="/getting-started"
                className="text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white underline transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100 dark:focus-visible:ring-offset-slate-800"
              >
                Open the step-by-step guide
              </Link>
            </div>
          </div>
        </section>
      </main>
      <div className="shrink-0 bg-slate-50 dark:bg-slate-900">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-5 py-3">
          <InlineAdSection placement="maintenanceHistory" />
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
