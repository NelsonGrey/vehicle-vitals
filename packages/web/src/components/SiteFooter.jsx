import React from 'react';
import { Link } from 'react-router-dom';

export default function SiteFooter() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 h-16 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center">
      <div className="max-w-6xl mx-auto px-5 w-full">
        <div className="flex flex-wrap gap-3 py-4 text-slate-600 dark:text-slate-400 text-sm">
          <Link to="/terms" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
            Terms of Use
          </Link>
          <span>•</span>
          <Link to="/privacy" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
            Privacy
          </Link>
          <span>•</span>
          <Link to="/contact" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
            Contact Us
          </Link>
        </div>
      </div>
    </footer>
  );
}
