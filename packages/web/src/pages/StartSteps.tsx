import { Link } from 'react-router-dom';

export default function StartSteps() {
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
      to: '/help#maintenance-history-and-reminders',
    },
  ];

  return (
    <section className="py-8 sm:py-10">
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-slate-900 dark:text-slate-100 sm:text-4xl">
          Start in 3 simple steps
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
          A simple first-use flow for new users who want to get value quickly.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {startSteps.map(item => (
          <article
            key={item.title}
            className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800 sm:flex-row"
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
              <h2 className="font-serif text-xl text-slate-900 dark:text-slate-100">
                {item.title}
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
                {item.description}
              </p>
              <Link
                to={item.to}
                className="mt-4 inline-flex w-fit items-center rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white"
              >
                {item.ctaLabel}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
