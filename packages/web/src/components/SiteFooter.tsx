import { Link } from 'react-router-dom';

export default function SiteFooter() {
  return (
    <footer className="shrink-0 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-5 py-4 w-full">
        <div className="flex flex-wrap items-center justify-center gap-3 text-slate-600 dark:text-slate-400 text-sm">
          <Link
            to="/subscription"
            className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            Plans
          </Link>
          <span>•</span>
          <Link
            to="/getting-started"
            className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            Getting Started
          </Link>
          <span>•</span>
          <Link
            to="/help"
            className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            Help
          </Link>
          <span>•</span>
          <Link
            to="/terms"
            className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            Terms of Use
          </Link>
          <span>•</span>
          <Link
            to="/privacy"
            className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            Privacy
          </Link>
          <span>•</span>
          <Link
            to="/contact"
            className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </footer>
  );
}
