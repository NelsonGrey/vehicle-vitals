import { Link } from 'react-router-dom';
import StackedVLogo from './StackedVLogo';

export default function SiteFooter() {
  return (
    <footer className="shrink-0 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          {/* Brand */}
          <Link to="/" className="inline-flex no-underline text-current shrink-0">
            <StackedVLogo size={28} showText color="currentColor" accent="#334155" wordmarkColor="#64748b" />
          </Link>

          {/* Main nav */}
          <nav className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600 dark:text-slate-300">
            <Link to="/getting-started" className="hover:text-slate-900 dark:hover:text-white transition-colors">Getting Started</Link>
            <Link to="/help" className="hover:text-slate-900 dark:hover:text-white transition-colors">Help</Link>
            <Link to="/subscription" className="hover:text-slate-900 dark:hover:text-white transition-colors">Subscriptions</Link>
          </nav>

          {/* Legal + support */}
          <nav className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <Link to="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy</Link>
            <Link to="/contact" className="hover:text-slate-900 dark:hover:text-white transition-colors">Contact</Link>
          </nav>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            © {new Date().getFullYear()} Vehicle Vitals. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
