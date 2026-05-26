import { Link } from 'react-router-dom';

export default function EverydayScreens() {
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

  return (
    <section className="py-8 sm:py-10">
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-slate-900 dark:text-slate-100 sm:text-4xl">
          Everyday screens you will use
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
          A small set of screenshots to show the most common tasks.
        </p>
        <Link
          to="/"
          className="mt-3 inline-flex items-center text-sm font-medium text-slate-700 underline transition hover:text-slate-900 dark:text-slate-200 dark:hover:text-white"
        >
          Back to product overview
        </Link>
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
              <h2 className="font-serif text-lg text-slate-900 dark:text-slate-100">
                {feature.title}
              </h2>
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
  );
}
