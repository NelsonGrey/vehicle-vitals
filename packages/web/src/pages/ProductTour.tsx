import { Link } from 'react-router-dom';
import PageSEO from '../components/PageSEO';
import { ROUTE_SEO } from '../shared/seoMeta';

const workflows = [
  {
    title: '1. Add a vehicle',
    description:
      'Enter a VIN or another vehicle ID, review the lookup results, and fill in anything the lookup could not confirm.',
    to: '/getting-started',
    cta: 'Follow the setup guide',
  },
  {
    title: '2. Save service proof',
    description:
      'Record completed work, mileage, costs, notes, providers, and attachments so the history stays with the vehicle.',
    to: '/ownership-history-demo',
    cta: 'Explore service records',
  },
  {
    title: '3. Review what needs attention',
    description:
      'Use Maintenance Plan for available recommendations and saved reminders, then confirm requirements with the owner’s manual or a qualified professional.',
    to: '/maintenance-planning-demo',
    cta: 'Explore maintenance planning',
  },
];

const productScreens = [
  {
    title: 'Garage',
    description:
      'Review the vehicles and attention signals stored in your account.',
    image: '/images/features/current/garage.png',
  },
  {
    title: 'Vehicle details',
    description:
      'Review mileage, record completeness, history, and available next steps.',
    image: '/images/features/current/vehicle-detail.png',
  },
  {
    title: 'Add a vehicle',
    description:
      'Use a vehicle ID lookup and confirm the details before saving.',
    image: '/images/features/current/add-vehicle.png',
  },
  {
    title: 'Records',
    description:
      'Keep completed work, costs, notes, receipts, and other files organized.',
    image: '/images/features/current/records.png',
  },
  {
    title: 'Maintenance Plan',
    description:
      'Review available recommendations and reminders without treating them as a substitute for the owner’s manual.',
    image: '/images/features/current/maintenance-plan.png',
  },
  {
    title: 'Service History',
    description: 'Review completed maintenance across the garage by date.',
    image: '/images/features/current/service-history.png',
  },
  {
    title: 'Shops & Services',
    description:
      'Find nearby businesses and keep provider context with your records.',
    image: '/images/features/current/shops-services.png',
  },
  {
    title: 'Settings',
    description:
      'Control reminders, calendar behavior, offline data, and account options.',
    image: '/images/features/current/settings.png',
  },
];

export default function ProductTour() {
  return (
    <div className="space-y-6 py-8 sm:py-10">
      <PageSEO meta={ROUTE_SEO['/product-tour']} />
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="max-w-3xl">
          <h1 className="font-serif text-3xl text-slate-900 dark:text-slate-100 sm:text-4xl">
            Product Tour
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
            See how Vehicle-Vitals turns scattered vehicle information into a
            record you can use before a service visit, repair decision, or sale.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
          {workflows.map(item => (
            <article
              key={item.title}
              className="flex flex-col rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/50"
            >
              <h2 className="font-serif text-xl text-slate-900 dark:text-slate-100">
                {item.title}
              </h2>
              <p className="mt-2 flex-1 text-sm text-slate-600 dark:text-slate-400">
                {item.description}
              </p>
              <Link
                to={item.to}
                className="mt-4 inline-flex w-fit rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-950 dark:bg-slate-200 dark:text-slate-900"
              >
                {item.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-5">
          <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100">
            Current product screens
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
            These screens are captured from the current iPhone build using
            demonstration vehicle data. No customer information is shown.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {productScreens.map(screen => (
            <article
              key={screen.title}
              className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50"
            >
              <img
                src={screen.image}
                alt={`${screen.title} product screen`}
                className="h-80 w-full bg-slate-100 object-contain dark:bg-slate-950"
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
