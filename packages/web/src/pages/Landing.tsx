import { Link } from 'react-router-dom';
import HeaderAdBar from '../components/HeaderAdBar';
import InlineAdSection from '../components/InlineAdSection';
import SiteFooter from '../components/SiteFooter';
import SiteHeader from '../components/SiteHeader';

export default function Landing() {
  return (
    <div className="h-[100dvh] min-h-screen flex flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <SiteHeader overlay={false} />
      <HeaderAdBar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-900">
        {/* Clean Slate Hero Section */}
        <section className="py-10 sm:py-14 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-5">
            <div className="text-center py-6 sm:py-8 lg:py-10 max-w-7xl mx-auto">
              <div className="text-slate-600 dark:text-slate-400 uppercase tracking-widest text-xs font-bold mb-3">
                Care for every mile
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl leading-tight mb-4 text-slate-900 dark:text-slate-100">
                Track your vehicle&apos;s story with confidence
              </h1>
              <p className="text-base sm:text-lg max-w-7xl mx-auto text-slate-700 dark:text-slate-300 mb-7 sm:mb-8">
                Vehicle Vitals helps you log maintenance, plan service, and keep
                a timeless record—on web and mobile.
              </p>
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <Link
                  to="/auth/signup"
                  className="inline-block w-full sm:w-auto text-center px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100 dark:focus-visible:ring-offset-slate-800"
                >
                  Create your account
                </Link>
                <span className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                  or{' '}
                  <Link
                    to="/instructions"
                    className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 underline transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100 dark:focus-visible:ring-offset-slate-800"
                  >
                    read the instructions
                  </Link>
                </span>
              </div>
            </div>

            {/* Feature Cards */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 mt-10 sm:mt-12 lg:mt-14">
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-xl shadow-sm">
                <h3 className="font-serif font-semibold text-xl text-slate-900 dark:text-slate-100 mb-3">
                  VIN decode & quick add
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Enter a VIN to prefill year, make, and model from the NHTSA
                  database.
                </p>
                <Link
                  to="/vin-decode-demo"
                  className="inline-block mt-4 text-slate-700 dark:text-slate-200 underline hover:no-underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-700"
                >
                  Open VIN Decode Demo
                </Link>
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-xl shadow-sm">
                <h3 className="font-serif font-semibold text-xl text-slate-900 dark:text-slate-100 mb-3">
                  Maintenance, organized
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Log services, notes, and costs. Stay on top of what&apos;s due
                  next.
                </p>
                <Link
                  to="/maintenance-planning-demo"
                  className="inline-block mt-4 text-slate-700 dark:text-slate-200 underline hover:no-underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-700"
                >
                  Open Maintenance Planning Demo
                </Link>
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-xl shadow-sm">
                <h3 className="font-serif font-semibold text-xl text-slate-900 dark:text-slate-100 mb-3">
                  Your garage, anywhere
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Access your vehicles from the web and our companion mobile
                  apps.
                </p>
                <Link
                  to="/cross-platform-access-demo"
                  className="inline-block mt-4 text-slate-700 dark:text-slate-200 underline hover:no-underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-700"
                >
                  Open Cross Platform Access Demo
                </Link>
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-xl shadow-sm">
                <h3 className="font-serif font-semibold text-xl text-slate-900 dark:text-slate-100 mb-3">
                  Own your history
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  A clear record helps with resale and long-term care—one place
                  to remember it all.
                </p>
                <Link
                  to="/ownership-history-demo"
                  className="inline-block mt-4 text-slate-700 dark:text-slate-200 underline hover:no-underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-700"
                >
                  Open Ownership History Demo
                </Link>
              </div>
            </section>
          </div>
        </section>
        <div className="max-w-5xl mx-auto px-4 sm:px-5 mt-6 sm:mt-8">
          <InlineAdSection placement="maintenanceHistory" />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
