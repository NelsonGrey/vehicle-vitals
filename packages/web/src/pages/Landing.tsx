import { Link } from 'react-router-dom';
import HeaderAdBar from '../components/HeaderAdBar';
import InlineAdSection from '../components/InlineAdSection';
import SiteFooter from '../components/SiteFooter';
import SiteHeader from '../components/SiteHeader';

export default function Landing() {
  const previewPages = [
    {
      title: '3-step onboarding guide',
      description:
        'A quick guide for first-time users: add a vehicle, track service, and stay ahead.',
      image: '/images/features/add-vehicle.png',
      to: '/start-steps',
      ctaLabel: 'Open steps page',
    },
    {
      title: 'Screen gallery',
      description:
        'Explore the most common web screens so users know what daily use looks like.',
      image: '/images/features/garage-vehicles.png',
      to: '/everyday-screens',
      ctaLabel: 'Open screens page',
    },
    {
      title: 'Video tour library',
      description:
        'Watch three short product videos on dedicated pages with focused context.',
      image: '/images/features/ios-home.png',
      to: '/short-video-tours',
      ctaLabel: 'Open video tours',
    },
  ];

  return (
    <div className="h-[100dvh] min-h-screen flex flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <SiteHeader overlay={false} />
      <HeaderAdBar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-900">
        <section className="py-8 sm:py-10 lg:py-12">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-5">
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
                    Explore product previews
                  </h2>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
                    We moved detailed walkthroughs and media to their own pages
                    for cleaner browsing.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                {previewPages.map(item => (
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
                        Dedicated page
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
