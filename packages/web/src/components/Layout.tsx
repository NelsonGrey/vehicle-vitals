import { Link, Outlet, useLocation } from 'react-router-dom';
import HeaderAdBar from './HeaderAdBar';
import InlineAdSection from './InlineAdSection';
import SiteFooter from './SiteFooter';
import SiteHeader from './SiteHeader';

export default function Layout() {
  const location = useLocation();
  const pathname = location.pathname;

  const isAppWorkspace =
    pathname.startsWith('/app') ||
    pathname === '/add-vehicle' ||
    pathname.startsWith('/edit-vehicle') ||
    pathname === '/providers';
  const isHelpWorkspace =
    pathname === '/help' ||
    pathname === '/instructions' ||
    pathname === '/getting-started';

  const contextLabel = isAppWorkspace
    ? 'Application Workspace'
    : isHelpWorkspace
      ? 'Help & How-To'
      : 'Product Overview';
  const contextDetails = isAppWorkspace
    ? 'Use this area to do work in your garage, records, reminders, and profile.'
    : isHelpWorkspace
      ? 'Use this area for setup steps, task guidance, and troubleshooting.'
      : 'Use this area to learn what the product does and whether it fits your needs.';

  return (
    <div className="h-[100dvh] min-h-screen flex flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <SiteHeader overlay={false} />
      <HeaderAdBar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-900">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-5 py-4">
          <section className="mb-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3">
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.12em] text-teal-700 dark:text-teal-300">
              You are viewing: {contextLabel}
            </p>
            <p className="m-0 mt-1 text-sm text-slate-700 dark:text-slate-300">
              {contextDetails}
            </p>
            <div className="mt-2 flex flex-wrap gap-3 text-sm">
              <Link
                to="/"
                className="text-teal-700 underline dark:text-teal-300"
              >
                Product overview
              </Link>
              <Link
                to="/help"
                className="text-teal-700 underline dark:text-teal-300"
              >
                Help & how-to
              </Link>
              <Link
                to="/app"
                className="text-teal-700 underline dark:text-teal-300"
              >
                Application workspace
              </Link>
            </div>
          </section>
          <Outlet />
        </div>
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
