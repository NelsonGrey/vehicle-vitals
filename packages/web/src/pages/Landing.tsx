import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import HeaderAdBar from '../components/HeaderAdBar';
import InlineAdSection from '../components/InlineAdSection';
import PageSEO from '../components/PageSEO';
import SiteFooter from '../components/SiteFooter';
import SiteHeader from '../components/SiteHeader';
import { personaPages } from '../data/personas';
import { trackMarketingPageView, trackSignupStart } from '../shared/marketingAnalytics';
import { ROUTE_SEO } from '../shared/seoMeta';

const proofPoints = [
  {
    title: 'Proof when you need it',
    body: 'Maintenance history stays organized for resale, warranty review, insurance questions, and mechanic conversations.',
  },
  {
    title: 'Fewer missed service moments',
    body: 'Upcoming work becomes visible before it turns into a surprise repair or last-minute scheduling problem.',
  },
  {
    title: 'Plans that grow with the garage',
    body: 'Start with core tracking, then unlock reminders, forecasts, exports, and ad-free power-user workflows as needs grow.',
  },
];

const planGuides = [
  {
    name: 'Free',
    audience: 'Learn and document',
    description:
      'Start the maintenance habit with core records, basic reminders, and enough capacity for an early garage.',
  },
  {
    name: 'Pro',
    audience: 'Plan and coordinate',
    description:
      'Add calendar sync, advanced reminders, exports, and shared planning for households and active DIY owners.',
  },
  {
    name: 'Premium',
    audience: 'Forecast and automate',
    description:
      'Unlock predictive planning, AI-assisted workflows, integrations, and an ad-free workspace for power users.',
  },
  {
    name: 'Enterprise',
    audience: 'Govern and integrate',
    description:
      'Add contract capacity, operational controls, integrations, reporting, and dedicated support for teams.',
  },
];

export default function Landing() {
  const meta = ROUTE_SEO['/'];

  useEffect(() => {
    trackMarketingPageView('/', meta.title);
  }, [meta.title]);

  return (
    <div className="h-[100dvh] min-h-screen flex flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <PageSEO meta={meta} />
      <SiteHeader overlay={false} />
      <HeaderAdBar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-900">
        <section className="py-8 sm:py-10 lg:py-12">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-5">
            <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-xl">
              <img
                src="/images/hero-garage.jpg"
                alt="Organized garage workspace demonstrating vehicle record keeping"
                className="absolute inset-0 h-full w-full object-cover opacity-45"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/75 to-teal-950/60" />
              <div className="relative grid gap-8 px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-[1.1fr_0.9fr] lg:px-12 lg:py-16">
                <div>
                  <div className="flex items-center gap-4">
                    <img
                      src="/android-chrome-512x512.png"
                      alt=""
                      aria-hidden="true"
                      width={160}
                      height={160}
                      className="h-30 w-30 rounded-2xl shadow-lg ring-1 ring-white/20 sm:h-40 sm:w-40"
                    />
                    <span className="text-sm font-semibold uppercase tracking-wide text-slate-100">
                      Vehicle Vitals
                    </span>
                  </div>
                  <h1 className="mt-4 max-w-3xl font-serif text-3xl leading-tight text-white sm:text-4xl lg:text-5xl">
                    One garage for every vehicle record, reminder, and repair
                    cost
                  </h1>
                  <p className="mt-4 max-w-2xl text-base text-slate-100/90 sm:text-lg">
                    Track service history, plan upcoming work, and prove what
                    was done across personal cars, shared household vehicles,
                    and light business fleets.
                  </p>
                  <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Link
                      to="/auth/signup"
                      className="inline-block w-full rounded-xl bg-white px-6 py-3 text-center font-semibold text-slate-900 transition hover:bg-slate-100 sm:w-auto"
                      onClick={() => trackSignupStart('landing_hero')}
                    >
                      Create your account
                    </Link>
                    <Link
                      to="/subscription"
                      className="inline-block w-full rounded-xl border border-white/40 bg-white/10 px-6 py-3 text-center font-semibold text-white transition hover:bg-white/20 sm:w-auto"
                    >
                      Compare plans
                    </Link>
                  </div>
                </div>

                <div className="grid gap-3 text-sm text-white sm:grid-cols-3 lg:grid-cols-1">
                  <div className="rounded-xl bg-white/12 px-4 py-3 ring-1 ring-white/20">
                    <p className="font-semibold">Track receipts</p>
                    <p className="mt-1 text-slate-100/80">
                      Keep mechanic, DIY, and parts records together.
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/12 px-4 py-3 ring-1 ring-white/20">
                    <p className="font-semibold">Plan service</p>
                    <p className="mt-1 text-slate-100/80">
                      See upcoming work before it becomes urgent.
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/12 px-4 py-3 ring-1 ring-white/20">
                    <p className="font-semibold">Scale by garage</p>
                    <p className="mt-1 text-slate-100/80">
                      Move from first cars to DIY projects, households, and
                      teams.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-10 sm:mt-12">
              <div className="mb-5 max-w-3xl">
                <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100 sm:text-3xl">
                  Choose the path that matches your garage
                </h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
                  Each buyer has a different reason to trust the same vehicle
                  record. Start with the use case, then pick the plan that
                  supports it.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {personaPages.map(item => (
                  <article
                    id={item.id}
                    key={item.id}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
                  >
                    <div className="grid min-h-full grid-cols-1 md:grid-cols-[0.9fr_1.1fr]">
                      <div className="relative min-h-56 overflow-hidden">
                        <img
                          src={item.image}
                          alt={`${item.title} product preview`}
                          className="absolute inset-0 h-full w-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/20 to-transparent" />
                        <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900">
                          {item.label}
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="font-serif text-xl text-slate-900 dark:text-slate-100">
                          {item.title}
                        </h3>
                        <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Pain: {item.pain}
                        </p>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                          Outcome: {item.outcome}
                        </p>
                        <div
                          className={`mt-4 rounded-lg border px-3 py-2 text-sm font-medium ${item.accent}`}
                        >
                          <p>{item.plan}</p>
                        </div>
                        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                          <Link
                            to={item.path}
                            className="inline-flex items-center justify-center rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-950 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white"
                          >
                            Read use case
                          </Link>
                          <Link
                            to={item.demoTo}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                          >
                            {item.ctaLabel}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="mt-10 sm:mt-12">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-3xl">
                  <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100 sm:text-3xl">
                    Plans built around growing vehicle responsibility
                  </h2>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
                    The pricing model follows the story: organize one vehicle,
                    coordinate a household, then unlock forecasting, automation,
                    and team support.
                  </p>
                </div>
                <Link
                  to="/subscription"
                  className="inline-flex w-full justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 sm:w-auto dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  View full pricing
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {planGuides.map(plan => (
                  <article
                    key={plan.name}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
                  >
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {plan.name}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-teal-700 dark:text-teal-300">
                      {plan.audience}
                    </p>
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                      {plan.description}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section className="mt-10 sm:mt-12">
              <div className="mb-5 max-w-3xl">
                <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100 sm:text-3xl">
                  Product proof for the story
                </h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
                  Use the demos after you know which problem you are solving.
                  The screenshots and short videos show the core workflows
                  behind each persona path.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <h3 className="font-serif text-xl text-slate-900 dark:text-slate-100">
                    3-step onboarding guide
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    Add a vehicle, track service, and stay ahead without
                    learning the whole product at once.
                  </p>
                  <Link
                    to="/start-steps"
                    className="mt-4 inline-flex items-center rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-950 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white"
                  >
                    Open steps page
                  </Link>
                </article>
                <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <h3 className="font-serif text-xl text-slate-900 dark:text-slate-100">
                    Screen gallery
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    See common web screens for records, timelines, providers,
                    and garage management.
                  </p>
                  <Link
                    to="/everyday-screens"
                    className="mt-4 inline-flex items-center rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-950 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white"
                  >
                    Open screens page
                  </Link>
                </article>
                <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <h3 className="font-serif text-xl text-slate-900 dark:text-slate-100">
                    Video tour library
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    Watch short product tours for onboarding, service tracking,
                    and web-to-mobile continuity.
                  </p>
                  <Link
                    to="/short-video-tours"
                    className="mt-4 inline-flex items-center rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-950 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white"
                  >
                    Open video tours
                  </Link>
                </article>
              </div>
            </section>

            <section className="mt-10 sm:mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
              {proofPoints.map(point => (
                <div
                  key={point.title}
                  className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800"
                >
                  <h3 className="font-serif text-xl text-slate-900 dark:text-slate-100">
                    {point.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    {point.body}
                  </p>
                </div>
              ))}
            </section>
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
