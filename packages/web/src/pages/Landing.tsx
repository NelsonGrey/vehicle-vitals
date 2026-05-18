import { Link } from 'react-router-dom';
import HeaderAdBar from '../components/HeaderAdBar';
import InlineAdSection from '../components/InlineAdSection';
import MarketingVideoPanel from '../components/MarketingVideoPanel';
import SiteFooter from '../components/SiteFooter';
import SiteHeader from '../components/SiteHeader';

export default function Landing() {
  const flagshipCapabilities = [
    {
      title: 'VIN Decode & Quick Add',
      description:
        'Start with a VIN and move from lookup to complete garage entry in moments.',
      image: '/images/features/add-vehicle.png',
      ctaLabel: 'View VIN Demo',
      to: '/vin-decode-demo',
    },
    {
      title: 'Maintenance Planning',
      description:
        'See upcoming tasks, completed services, and ownership costs in one timeline.',
      image: '/images/features/upcoming.png',
      ctaLabel: 'View Planning Demo',
      to: '/maintenance-planning-demo',
    },
    {
      title: 'Cross-Platform Access',
      description:
        'Your garage follows you across web and mobile with one secure account.',
      image: '/images/features/ios-home.png',
      ctaLabel: 'View Cross-Platform Demo',
      to: '/cross-platform-access-demo',
    },
    {
      title: 'Ownership History',
      description:
        'Build a resale-ready record with complete service and expense history.',
      image: '/images/features/timeline.png',
      ctaLabel: 'View Ownership Demo',
      to: '/ownership-history-demo',
    },
  ];

  const applicationFeatureAtlas = [
    {
      title: 'Garage Dashboard',
      description:
        'Centralized overview of all tracked vehicles and quick actions.',
      image: '/images/features/garage-vehicles.png',
      appPath: '/app',
      platform: 'Web',
    },
    {
      title: 'Vehicle Detail',
      description:
        'Deep visibility into mileage, service logs, and ownership health.',
      image: '/images/features/garage-detail.png',
      appPath: '/app',
      platform: 'Web',
    },
    {
      title: 'Add Vehicle Flow',
      description: 'Guided onboarding with VIN-assisted setup and validation.',
      image: '/images/features/add-vehicle.png',
      appPath: '/app/add-vehicle',
      platform: 'Web',
    },
    {
      title: 'Service Records',
      description:
        'Structured maintenance records with notes and cost context.',
      image: '/images/features/records.png',
      appPath: '/app',
      platform: 'Web',
    },
    {
      title: 'Service Providers',
      description:
        'Track shops, vendors, and preferred providers for every vehicle.',
      image: '/images/features/providers.png',
      appPath: '/app/providers',
      platform: 'Web',
    },
    {
      title: 'Timeline Analytics',
      description:
        'Historical timeline view that turns maintenance into insight.',
      image: '/images/features/timeline.png',
      appPath: '/app/timeline',
      platform: 'Web',
    },
    {
      title: 'Upcoming Tasks',
      description:
        'Forward-looking maintenance reminders and schedule management.',
      image: '/images/features/upcoming.png',
      appPath: '/app/upcoming',
      platform: 'Web',
    },
    {
      title: 'Account Profile',
      description: 'Personal preferences and account controls in one place.',
      image: '/images/features/profile.png',
      appPath: '/app/profile',
      platform: 'Web',
    },
    {
      title: 'iOS Home Experience',
      description:
        'Native mobile access to your garage and day-to-day ownership.',
      image: '/images/features/ios-home.png',
      appPath: '/app',
      platform: 'Mobile',
    },
    {
      title: 'iOS Upcoming View',
      description:
        'Stay ahead of tasks and service windows directly from mobile.',
      image: '/images/features/ios-upcoming.png',
      appPath: '/app/upcoming',
      platform: 'Mobile',
    },
    {
      title: 'iOS Profile Controls',
      description:
        'Carry account and preferences across devices with consistent UX.',
      image: '/images/features/ios-profile.png',
      appPath: '/app/profile',
      platform: 'Mobile',
    },
  ];

  const demoVideoReady = [
    {
      title: 'Onboarding Walkthrough',
      description:
        'Video-ready slot for a full VIN-to-garage onboarding demonstration.',
      poster: '/images/features/add-vehicle.png',
      videoPath: '/videos/feature-demos/onboarding-walkthrough.mp4',
      fallbackHref: '/getting-started',
      fallbackLabel: 'Open guided onboarding',
    },
    {
      title: 'Maintenance Lifecycle Tour',
      description:
        'Video-ready slot for records, timeline, and upcoming tasks flow.',
      poster: '/images/features/timeline.png',
      videoPath: '/videos/feature-demos/maintenance-lifecycle-tour.mp4',
      fallbackHref: '/maintenance-planning-demo',
      fallbackLabel: 'Open maintenance demo',
    },
    {
      title: 'Cross-Platform Continuity',
      description:
        'Video-ready slot for web-to-mobile continuity and account sync.',
      poster: '/images/features/ios-home.png',
      videoPath: '/videos/feature-demos/cross-platform-continuity.mp4',
      fallbackHref: '/cross-platform-access-demo',
      fallbackLabel: 'Open continuity demo',
    },
  ];

  return (
    <div className="h-[100dvh] min-h-screen flex flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <SiteHeader overlay={false} />
      <HeaderAdBar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-900">
        <section className="py-8 sm:py-10 lg:py-12">
          <div className="w-full max-w-[1024px] mx-auto px-4 sm:px-5">
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
                  Vehicle Vitals Platform
                </div>
                <h1 className="mt-4 max-w-2xl font-serif text-3xl leading-tight text-white sm:text-4xl lg:text-5xl">
                  A complete ownership platform, now shown as a full visual tour
                </h1>
                <p className="mt-4 max-w-2xl text-base text-slate-100/90 sm:text-lg">
                  Explore every core capability across dashboard, planning,
                  timeline, providers, records, and mobile continuity through a
                  richer marketing experience.
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
                    View getting started workflow
                  </Link>
                </div>
                <div className="mt-6 grid grid-cols-1 gap-3 text-sm text-slate-100 sm:grid-cols-3">
                  <div className="rounded-xl bg-white/10 px-3 py-2 ring-1 ring-white/20">
                    End-to-end feature coverage
                  </div>
                  <div className="rounded-xl bg-white/10 px-3 py-2 ring-1 ring-white/20">
                    Real application screenshots
                  </div>
                  <div className="rounded-xl bg-white/10 px-3 py-2 ring-1 ring-white/20">
                    Video-ready demo storytelling
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-10 sm:mt-12">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100 sm:text-3xl">
                    Flagship capability demos
                  </h2>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
                    Focused walkthrough entries that connect marketing
                    narratives to application behavior.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {flagshipCapabilities.map(item => (
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
                        Preview
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
                  Full application feature atlas
                </h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
                  Every major application-side workflow represented with real
                  screenshots from web and mobile experiences.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {applicationFeatureAtlas.map(feature => (
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
                        Open in app ({feature.appPath})
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="mt-10 sm:mt-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-5">
                <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100 sm:text-3xl">
                  Video showcase lanes
                </h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
                  Dedicated lanes for narrated product demos with automatic
                  poster fallback when a clip is not yet present.
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
                  Built for practical ownership
                </h3>
                <p className="mt-2 text-emerald-900/85 dark:text-emerald-200/90">
                  The marketing experience now mirrors the breadth of the real
                  application: onboarding, records, planning, profile, timeline,
                  and mobile continuity.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
                <h3 className="font-serif text-2xl text-slate-900 dark:text-slate-100">
                  Ready to see more?
                </h3>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                  Explore visual demos here, then sign in for direct access to
                  the secured application workflows.
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
              Need a guided setup?{' '}
              <Link
                to="/getting-started"
                className="text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white underline transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100 dark:focus-visible:ring-offset-slate-800"
              >
                Open the getting started workflow
              </Link>
            </div>
          </div>
        </section>
      </main>
      <div className="shrink-0 bg-slate-50 dark:bg-slate-900">
        <div className="w-full max-w-[1024px] mx-auto px-4 sm:px-5 py-3">
          <InlineAdSection placement="maintenanceHistory" />
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
