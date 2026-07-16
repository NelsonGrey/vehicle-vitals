import { Link } from 'react-router-dom';
import PageSEO from '../components/PageSEO';
import { ROUTE_SEO } from '../shared/seoMeta';

const sectionClass =
  'font-serif text-xl sm:text-2xl text-slate-900 dark:text-slate-100 mb-3';

export default function Privacy() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-5 sm:py-8">
      <PageSEO meta={ROUTE_SEO['/privacy']} />
      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6">
        <h1 className="mb-2 font-serif text-3xl text-slate-900 dark:text-slate-100 sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mb-2 text-slate-600 dark:text-slate-400">
          Last updated: July 16, 2026
        </p>
        <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
          This policy describes the product’s current data categories and
          controls. Final legal approval is required before public launch.
        </p>

        <div className="space-y-6 leading-relaxed text-slate-700 dark:text-slate-300">
          <section>
            <h2 className={sectionClass}>Information we collect</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Account and authentication information, including email address
                and provider identifiers.
              </li>
              <li>
                Vehicle information such as VIN or other vehicle ID, make,
                model, year, mileage, nickname, and photos.
              </li>
              <li>
                Maintenance records, costs, dates, notes, providers, receipts,
                invoices, PDFs, and other attachments you choose to save.
              </li>
              <li>
                Reminder, notification, calendar, email, location-search, and
                offline-sync preferences.
              </li>
              <li>
                Support requests and the information you include with them.
              </li>
              <li>
                Device, browser, diagnostics, analytics, advertising-consent,
                and feature-usage information.
              </li>
              <li>
                Subscription and entitlement status. Payment providers process
                payment details; Vehicle-Vitals does not need to store a
                complete payment-card number.
              </li>
            </ul>
          </section>

          <section>
            <h2 className={sectionClass}>How we use information</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Provide, secure, synchronize, support, and improve
                Vehicle-Vitals.
              </li>
              <li>
                Show your Garage, Records, Service History, Maintenance Plan,
                and saved preferences across supported devices.
              </li>
              <li>
                Deliver reminders, notifications, email, calendar actions,
                exports, and requested analysis.
              </li>
              <li>
                Process support, account, privacy, security, and subscription
                requests.
              </li>
              <li>
                Measure reliability and product usage, prevent abuse, and show
                advertising where enabled and consented to.
              </li>
            </ul>
          </section>

          <section>
            <h2 className={sectionClass}>Service providers and sharing</h2>
            <p>
              We do not sell your personal information. We use service providers
              for hosting, authentication, storage, analytics, advertising,
              support delivery, notifications, vehicle-data lookup, document or
              AI-assisted processing, and payments. They receive only the
              information needed to provide their service under their applicable
              terms and safeguards. Information may also be disclosed when
              required by law, to protect users or the service, or as part of a
              business transaction subject to appropriate protections.
            </p>
          </section>

          <section>
            <h2 className={sectionClass}>Your choices and controls</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Review and update vehicle, record, and preference information in
                the app.
              </li>
              <li>
                Control optional analytics or advertising consent where those
                controls are presented.
              </li>
              <li>
                Control notifications, calendar access, location access, and
                other permissions in the app or device settings.
              </li>
              <li>
                Request an account-data export or account deletion from Data
                &amp; Privacy.
              </li>
              <li>
                Contact Support with an access, correction, deletion, or other
                privacy request.
              </li>
            </ul>
          </section>

          <section>
            <h2 className={sectionClass}>Retention and deletion</h2>
            <p>
              We retain information while your account is active and as needed
              to provide the service, meet legal or security obligations,
              resolve disputes, and enforce agreements. Account deletion removes
              or de-identifies covered account data through the documented
              deletion process, subject to necessary backup, fraud-prevention,
              transaction, and legal-retention periods. The final retention
              schedule and request-processing timeline require legal approval.
            </p>
          </section>

          <section>
            <h2 className={sectionClass}>
              Security and international processing
            </h2>
            <p>
              We use administrative, technical, and organizational safeguards,
              including access controls and encryption supported by our service
              providers. No method of storage or transmission is completely
              secure. Information may be processed in locations where our
              service providers operate, subject to applicable safeguards.
            </p>
          </section>

          <section>
            <h2 className={sectionClass}>Children and policy changes</h2>
            <p>
              Vehicle-Vitals is not directed to children under the age required
              to consent to online services in their location. We may update
              this policy as the product or legal requirements change and will
              update the date above when we do.
            </p>
          </section>

          <section>
            <h2 className={sectionClass}>Contact</h2>
            <p>
              Questions or privacy requests can be submitted through{' '}
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
