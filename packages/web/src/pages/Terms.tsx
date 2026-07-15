import { Link } from 'react-router-dom';
import PageSEO from '../components/PageSEO';
import { ROUTE_SEO } from '../shared/seoMeta';
// Header and footer provided by Layout

export default function Terms() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-5 py-6 sm:py-8">
      <PageSEO meta={ROUTE_SEO['/terms']} />
      <article className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 sm:p-6 shadow-sm">
        <h1 className="font-serif text-3xl sm:text-4xl text-slate-900 dark:text-slate-100 mb-2">
          Terms of Use
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Last updated: September 30, 2025
        </p>

        <div className="space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed">
          <section>
            <h2 className="font-serif text-xl sm:text-2xl text-slate-900 dark:text-slate-100 mb-3">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using Vehicle-Vitals, you agree to be bound by
              these Terms of Use. If you do not agree, do not use the service.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl sm:text-2xl text-slate-900 dark:text-slate-100 mb-3">
              2. Description of Service
            </h2>
            <p>
              Vehicle-Vitals provides tools to track vehicle information and
              maintenance. Features may change over time.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl sm:text-2xl text-slate-900 dark:text-slate-100 mb-3">
              3. Your Responsibilities
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Provide accurate information about your vehicles and
                maintenance.
              </li>
              <li>Maintain the security of your account.</li>
              <li>Use the service in compliance with applicable laws.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl sm:text-2xl text-slate-900 dark:text-slate-100 mb-3">
              4. Data and Privacy
            </h2>
            <p>
              We handle personal and vehicle data as described in our{' '}
              <Link to="/privacy" className="underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl sm:text-2xl text-slate-900 dark:text-slate-100 mb-3">
              5. Disclaimers
            </h2>
            <p>
              The service is provided "as is" without warranties of any kind.
              Maintenance reminders or suggestions are informational and you are
              responsible for your vehicle's upkeep.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl sm:text-2xl text-slate-900 dark:text-slate-100 mb-3">
              6. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by law, Vehicle-Vitals is not
              liable for any indirect, incidental, or consequential damages
              arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl sm:text-2xl text-slate-900 dark:text-slate-100 mb-3">
              7. Changes to Terms
            </h2>
            <p>
              We may update these Terms from time to time. Continued use
              constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl sm:text-2xl text-slate-900 dark:text-slate-100 mb-3">
              8. Support
            </h2>
            <p>
              Questions about these Terms? Reach out via{' '}
              <Link to="/support" className="underline">
                Support
              </Link>
              .
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
