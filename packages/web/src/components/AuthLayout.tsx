import { Link, Outlet } from 'react-router-dom';
import HeaderAdBar from './HeaderAdBar';
import InlineAdSection from './InlineAdSection';
import SiteFooter from './SiteFooter';
import StackedVLogo from './StackedVLogo';

export default function AuthLayout() {
  return (
    <div className="h-[100dvh] min-h-screen flex flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <header className="shrink-0 bg-slate-50 dark:bg-slate-900">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-5 py-3">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/70 backdrop-blur-sm px-4 py-2.5 flex items-center justify-between">
            <Link
              to="/"
              aria-label="Go to home"
              className="inline-flex no-underline text-current"
            >
              <StackedVLogo
                size={34}
                showText
                color="currentColor"
                accent="#334155"
                wordmarkColor="#64748b"
              />
            </Link>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Need help?{' '}
              <Link to="/help" className="underline hover:no-underline">
                Visit Help
              </Link>
            </p>
          </div>
        </div>
      </header>

      <HeaderAdBar />

      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-900 px-4 sm:px-5 py-6 sm:py-8">
        <div className="w-full max-w-7xl mx-auto">
          <div className="w-full max-w-2xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

      <div className="shrink-0 bg-slate-50 dark:bg-slate-900">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-5 py-3">
          <InlineAdSection placement="maintenanceHistory" />
        </div>
      </div>

      <SiteFooter showPersonas={false} />
    </div>
  );
}
