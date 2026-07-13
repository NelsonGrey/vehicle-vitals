import MarketingVideoPanel from '../components/MarketingVideoPanel';
import PageSEO from '../components/PageSEO';
import { ROUTE_SEO } from '../shared/seoMeta';

const productScreens = [
  {
    title: 'Garage',
    description: 'See personal, shared, and work vehicles in one place.',
    image: '/images/features/garage-vehicles.png',
  },
  {
    title: 'Vehicle details',
    description:
      'Review mileage, past service, and recent activity for one vehicle.',
    image: '/images/features/garage-detail.png',
  },
  {
    title: 'Add vehicle screen',
    description: 'A simple form to set up your first vehicle.',
    image: '/images/features/add-vehicle.png',
  },
  {
    title: 'Service records',
    description: 'Keep completed work, costs, notes, and receipts organized.',
    image: '/images/features/records.png',
  },
  {
    title: 'Service history',
    description: 'Review completed maintenance across the garage by date.',
    image: '/images/features/timeline.png',
  },
  {
    title: 'Maintenance plan',
    description: 'See upcoming work before it becomes urgent.',
    image: '/images/features/upcoming.png',
  },
  {
    title: 'Shops & services',
    description: 'Find nearby businesses and save the places you trust.',
    image: '/images/features/providers.png',
  },
  {
    title: 'Web and mobile',
    description: 'Use the same garage and records across supported devices.',
    image: '/images/features/ios-home.png',
  },
];

export default function ProductTour() {
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
    <div className="space-y-6 py-8 sm:py-10">
      <PageSEO meta={ROUTE_SEO['/product-tour']} />
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-5">
          <h1 className="font-serif text-3xl text-slate-900 dark:text-slate-100 sm:text-4xl">
            Product Tour
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
            Explore the core Vehicle Vitals workflows through short videos and
            product screens.
          </p>
        </div>

        <h2 className="mb-4 font-serif text-2xl text-slate-900 dark:text-slate-100">
          Watch the workflows
        </h2>
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

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-5">
          <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100">
            Explore the core screens
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
            See how the product supports the same capability story from garage
            setup through service history and future planning.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {productScreens.map(screen => (
            <article
              key={screen.title}
              className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50"
            >
              <img
                src={screen.image}
                alt={`${screen.title} product screen`}
                className="h-52 w-full object-cover"
                loading="lazy"
              />
              <div className="p-4">
                <h3 className="font-serif text-lg text-slate-900 dark:text-slate-100">
                  {screen.title}
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {screen.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
