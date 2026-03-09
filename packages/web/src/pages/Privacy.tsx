import { Link } from 'react-router-dom';
// Header and footer provided by Layout

export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto px-5 py-8">
      <article className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
        <h1 className="font-serif text-4xl text-slate-900 dark:text-slate-100 mb-2">
          Privacy Policy
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Last updated: September 30, 2025
        </p>

        <div className="space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed">
          <section>
            <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100 mb-3">
              Information We Collect
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Account information (e.g., email, authentication identifiers)
              </li>
              <li>Vehicle data (VIN, make, model, year, mileage)</li>
              <li>Maintenance entries (dates, notes, costs)</li>
              <li>
                Usage data (device/browser metadata) to improve the service
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100 mb-3">
              How We Use Information
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide and improve the service</li>
              <li>Sync your data across web and mobile apps</li>
              <li>Communicate with you about updates and support</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100 mb-3">
              Data Sharing
            </h2>
            <p>
              We do not sell your personal data. We may share data with service
              providers (e.g., hosting, analytics) under agreements that protect
              your information.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100 mb-3">
              Data Security
            </h2>
            <p>
              We use industry-standard measures to protect your data. No method
              of transmission or storage is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100 mb-3">
              Your Choices
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access, update, or delete your data via the app</li>
              <li>Contact us to make a privacy request</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100 mb-3">
              Contact
            </h2>
            <p>
              Questions about privacy? Visit{' '}
              <Link to="/contact" className="underline">
                Contact Us
              </Link>
              .
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
