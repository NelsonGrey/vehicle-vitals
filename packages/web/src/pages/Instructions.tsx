import { Link } from 'react-router-dom';
// Header and footer provided by Layout

export default function Instructions() {
  return (
    <div className="max-w-4xl mx-auto px-5 py-8 space-y-6">
      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
        <h1 className="font-serif text-4xl text-slate-900 dark:text-slate-100 mb-3">
          Instructions
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Follow these steps to get started with Vehicle Vitals.
        </p>
      </section>

      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
        <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100 mb-4">
          Quick Start
        </h2>
        <ol className="list-decimal pl-5 space-y-2 text-slate-700 dark:text-slate-300">
          <li>
            Open the{' '}
            <Link to="/app" className="underline">
              web app
            </Link>{' '}
            and sign in.
          </li>
          <li>
            Add your first vehicle by entering a VIN or selecting Year, Make,
            and Model.
          </li>
          <li>Log maintenance entries with date, title, notes, and cost.</li>
          <li>Return anytime to review history and plan upcoming service.</li>
        </ol>
      </section>

      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
        <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100 mb-3">
          Mobile Apps
        </h2>
        <p className="text-slate-700 dark:text-slate-300 mb-3">
          Our iOS and Android apps sync with your account so you can scan a VIN,
          update mileage, and add notes on the go. Store listings are coming
          soon.
        </p>
        <p className="text-slate-600 dark:text-slate-400">
          Need help?{' '}
          <Link to="/contact" className="underline">
            Contact us
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
