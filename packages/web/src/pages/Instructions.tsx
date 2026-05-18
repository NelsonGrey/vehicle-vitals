import { Link } from 'react-router-dom';
import MarketingVideoPanel from '../components/MarketingVideoPanel';
// Header and footer provided by Layout

export default function Instructions() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-5 py-6 sm:py-8 space-y-5 sm:space-y-6">
      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 sm:p-6 shadow-sm">
        <h1 className="font-serif text-3xl sm:text-4xl text-slate-900 dark:text-slate-100 mb-3">
          Getting Started
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Follow this workflow to set up your garage, add records, and stay on
          top of maintenance.
        </p>
      </section>

      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 sm:p-6 shadow-sm">
        <h2 className="font-serif text-xl sm:text-2xl text-slate-900 dark:text-slate-100 mb-4">
          Getting Started Workflow
        </h2>
        <ol className="list-decimal pl-5 space-y-3 text-slate-700 dark:text-slate-300">
          <li>
            Create an account or sign in from the{' '}
            <Link
              to="/auth/login"
              className="underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-800"
            >
              login page
            </Link>
            .
          </li>
          <li>
            Open the{' '}
            <Link
              to="/app"
              className="underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-800"
            >
              web app
            </Link>{' '}
            and add your first vehicle.
          </li>
          <li>
            Use VIN decode for faster setup, or enter Year, Make, and Model
            manually.
          </li>
          <li>
            Log maintenance entries with date, mileage, title, notes, and cost
            to build a complete service record.
          </li>
          <li>
            Review Timeline and Upcoming tasks to plan future service and avoid
            missed work.
          </li>
          <li>
            Configure profile and notification preferences so reminders match
            your driving habits.
          </li>
        </ol>
      </section>

      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 sm:p-6 shadow-sm">
        <h2 className="font-serif text-xl sm:text-2xl text-slate-900 dark:text-slate-100 mb-3">
          Getting Started Video
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          Watch a guided walkthrough of first-time setup and core ownership
          flows.
        </p>
        <MarketingVideoPanel
          title="Getting Started Walkthrough"
          description="From account creation to logging your first maintenance entry in under a minute."
          poster="/images/features/add-vehicle.png"
          videoPath="/videos/feature-demos/getting-started-help.mp4"
          fallbackHref="/auth/signup"
          fallbackLabel="Start your account"
        />
      </section>

      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 sm:p-6 shadow-sm">
        <h2 className="font-serif text-xl sm:text-2xl text-slate-900 dark:text-slate-100 mb-3">
          Mobile Apps
        </h2>
        <p className="text-slate-700 dark:text-slate-300 mb-3">
          Our iOS and Android apps sync with your account so you can scan a VIN,
          update mileage, and add notes on the go. Store listings are coming
          soon.
        </p>
        <p className="text-slate-600 dark:text-slate-400">
          Need troubleshooting or support details? Visit the{' '}
          <Link
            to="/help"
            className="underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-800"
          >
            Help section
          </Link>
          , or{' '}
          <Link
            to="/contact"
            className="underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-800"
          >
            contact us
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
