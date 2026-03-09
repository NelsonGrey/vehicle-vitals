import { Link, Outlet } from 'react-router-dom';
import HeaderAdBar from './HeaderAdBar';
import SiteFooter from './SiteFooter';
import StackedVLogo from './StackedVLogo';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <header className="fixed top-0 left-0 right-0 h-20 flex items-end z-10 border-b bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-5 pb-2 w-full flex items-center justify-between">
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
            <Link to="/contact" className="underline hover:no-underline">
              Contact us
            </Link>
          </p>
        </div>
      </header>

      <HeaderAdBar />

      <main className="pt-40 pb-24 min-h-[calc(100vh-5rem)] flex items-center justify-center px-5">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
