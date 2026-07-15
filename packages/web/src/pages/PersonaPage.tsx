import { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import PageSEO from '../components/PageSEO';
import { getPersonaById, personaPages } from '../data/personas';
import {
  trackPersonaCtaClick,
  trackPersonaPageView,
  trackSignupStart,
} from '../shared/marketingAnalytics';
import { getPersonaSeoMeta } from '../shared/seoMeta';

export default function PersonaPage() {
  const { personaId } = useParams();
  const persona = getPersonaById(personaId);

  useEffect(() => {
    if (persona) {
      trackPersonaPageView(persona.id, persona.path, persona.title);
    }
  }, [persona]);

  if (!persona) {
    return <Navigate to="/" replace />;
  }

  const meta = getPersonaSeoMeta(persona.id);
  const relatedPersonas = personaPages.filter(item => item.id !== persona.id);

  return (
    <div className="marketing-content-stack space-y-8">
      <PageSEO meta={meta} />

      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-xl">
        <img
          src={persona.image}
          alt={`${persona.label} product workflow`}
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/75 to-slate-900/50" />
        <div className="marketing-hero-content relative grid gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-12 lg:py-14">
          <div>
            <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase text-slate-100 ring-1 ring-white/30">
              {persona.label}
            </p>
            <h1 className="mt-4 max-w-3xl font-serif text-3xl leading-tight text-white sm:text-4xl lg:text-5xl">
              {persona.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-100/90 sm:text-lg">
              {persona.headline}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/auth/signup"
                className="inline-flex w-full justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 sm:w-auto"
                onClick={() =>
                  trackSignupStart('persona_hero', persona.id)
                }
              >
                Create your account
              </Link>
              <Link
                to="/subscription"
                className="inline-flex w-full justify-center rounded-xl border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20 sm:w-auto"
                onClick={() =>
                  trackPersonaCtaClick(
                    persona.id,
                    'Compare plans',
                    '/subscription',
                    'persona_hero'
                  )
                }
              >
                Compare plans
              </Link>
            </div>
          </div>

          <div className="rounded-xl bg-white/12 p-5 text-white ring-1 ring-white/20">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-200">
              Recommended plan path
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {persona.recommendedPlan}
            </p>
            <p className="mt-3 text-sm text-slate-100/85">{persona.plan}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm font-semibold uppercase text-rose-700 dark:text-rose-300">
            The problem
          </p>
          <h2 className="mt-2 font-serif text-2xl text-slate-900 dark:text-slate-100">
            What gets in the way
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {persona.pain}
          </p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm font-semibold uppercase text-teal-700 dark:text-teal-300">
            The outcome
          </p>
          <h2 className="mt-2 font-serif text-2xl text-slate-900 dark:text-slate-100">
            What Vehicle-Vitals helps prove
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {persona.outcome}
          </p>
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100">
            Why it matters
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            {persona.benefits.map(benefit => (
              <li key={benefit} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-teal-600"
                />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100">
            Common workflow
          </h2>
          <ol className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            {persona.workflows.map((workflow, index) => (
              <li key={workflow} className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
                  {index + 1}
                </span>
                <span>{workflow}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100">
              See the workflow behind this use case
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
              Use the demo page to connect the persona story to the actual
              product surface.
            </p>
          </div>
          <Link
            to={persona.demoTo}
            className="inline-flex w-full justify-center rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-950 md:w-auto dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white"
            onClick={() =>
              trackPersonaCtaClick(
                persona.id,
                persona.ctaLabel,
                persona.demoTo,
                'persona_demo_cta'
              )
            }
          >
            {persona.ctaLabel}
          </Link>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100">
          Other persona paths
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {relatedPersonas.map(item => (
            <Link
              key={item.id}
              to={item.path}
              className={`rounded-xl border p-4 text-sm font-medium transition hover:-translate-y-0.5 hover:shadow-md ${item.accent}`}
            >
              <span className="block text-base font-semibold">
                {item.label}
              </span>
              <span className="mt-2 block">{item.title}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
