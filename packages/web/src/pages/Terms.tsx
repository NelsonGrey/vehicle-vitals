import { Link } from 'react-router-dom';
import PageSEO from '../components/PageSEO';
import { ROUTE_SEO } from '../shared/seoMeta';

const sectionClass =
  'font-serif text-xl sm:text-2xl text-slate-900 dark:text-slate-100 mb-3';

export default function Terms() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-5 sm:py-8">
      <PageSEO meta={ROUTE_SEO['/terms']} />
      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6">
        <h1 className="mb-2 font-serif text-3xl text-slate-900 dark:text-slate-100 sm:text-4xl">
          Terms of Use
        </h1>
        <p className="mb-2 text-slate-600 dark:text-slate-400">
          Last updated: July 16, 2026
        </p>
        <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
          These terms are synchronized across web and iPhone for product review.
          Final legal approval is required before public launch.
        </p>

        <div className="space-y-6 leading-relaxed text-slate-700 dark:text-slate-300">
          <section>
            <h2 className={sectionClass}>1. Acceptance</h2>
            <p>
              By accessing or using Vehicle-Vitals, you agree to these Terms of
              Use and our Privacy Policy. If you do not agree, do not use the
              service. Vehicle-Vitals is a product of Nelson Grey LLC.
            </p>
          </section>
          <section>
            <h2 className={sectionClass}>2. The service</h2>
            <p>
              Vehicle-Vitals provides tools for vehicle profiles, maintenance
              records, reminders, history, attachments, exports, provider
              context, and related account features. Features, availability,
              limits, and supported platforms may change. Planned capabilities
              are not guaranteed until they are released.
            </p>
          </section>
          <section>
            <h2 className={sectionClass}>3. Accounts and acceptable use</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Provide accurate account information and protect your
                credentials.
              </li>
              <li>
                Keep vehicle and maintenance information accurate enough for
                your intended use.
              </li>
              <li>
                Do not misuse, disrupt, reverse engineer, probe, or attempt
                unauthorized access to the service.
              </li>
              <li>
                Do not upload unlawful content or content you do not have the
                right to use.
              </li>
              <li>
                Use the service in compliance with applicable laws and
                third-party rights.
              </li>
            </ul>
          </section>
          <section>
            <h2 className={sectionClass}>
              4. Vehicle information and maintenance guidance
            </h2>
            <p>
              Vehicle lookups, health indicators, reminders, schedules, cost
              estimates, AI-assisted output, and maintenance suggestions are
              informational estimates. Data may be incomplete, delayed, generic,
              or incorrect. Vehicle-Vitals does not replace the owner’s manual,
              manufacturer guidance, inspections, recalls, qualified diagnosis,
              or professional service. You remain responsible for safe
              operation, maintenance decisions, and verifying information before
              acting.
            </p>
          </section>
          <section>
            <h2 className={sectionClass}>5. Your content and privacy</h2>
            <p>
              You retain responsibility for information and files you submit.
              You grant Vehicle-Vitals the rights needed to host, process,
              synchronize, analyze, and present that content to provide the
              service. Personal and vehicle information is handled as described
              in our{' '}
              <Link to="/privacy" className="underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>
          <section>
            <h2 className={sectionClass}>6. Subscriptions and payments</h2>
            <p>
              Free and paid features may have different limits. Paid
              subscriptions will be offered only when enabled for the applicable
              platform. Before purchase, the checkout or app store will show the
              price, billing period, renewal terms, and available cancellation
              method. Purchases, renewals, refunds, charge disputes, taxes, and
              cancellations may also be governed by Stripe, Apple, or another
              payment provider’s terms. Unless required by law or the applicable
              store policy, fees are not refundable for partially used periods.
            </p>
          </section>
          <section>
            <h2 className={sectionClass}>7. Third-party services</h2>
            <p>
              Authentication, maps or location results, vehicle lookups, shops,
              calendars, email, notifications, analytics, advertising, payments,
              and AI-assisted features may rely on third parties. Vehicle-Vitals
              does not control their availability, content, or independent
              terms.
            </p>
          </section>
          <section>
            <h2 className={sectionClass}>8. Suspension and termination</h2>
            <p>
              You may stop using the service and request account deletion. We
              may restrict or terminate access to protect users or the service,
              address violations, comply with law, or discontinue the service.
              Applicable retention obligations may continue after termination.
            </p>
          </section>
          <section>
            <h2 className={sectionClass}>9. Disclaimers and liability</h2>
            <p>
              The service is provided “as is” and “as available” to the maximum
              extent permitted by law. We do not warrant uninterrupted operation
              or the accuracy of third-party or maintenance data. To the maximum
              extent permitted by law, Vehicle-Vitals and Nelson Grey LLC are
              not liable for indirect, incidental, special, consequential, or
              punitive damages arising from use of the service.
            </p>
          </section>
          <section>
            <h2 className={sectionClass}>10. Changes and contact</h2>
            <p>
              We may update these terms and will update the date above. Material
              changes will be communicated when required. Questions can be
              submitted through{' '}
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
