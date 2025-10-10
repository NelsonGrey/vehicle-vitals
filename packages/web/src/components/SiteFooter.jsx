import React from 'react';
import { Link } from 'react-router-dom';

export default function SiteFooter() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 h-16 border-t border-tan dark:border-dark-border bg-cream dark:bg-deep-brown flex items-center">
      <div className="max-w-6xl mx-auto px-5 w-full">
        <div className="flex flex-wrap gap-3 py-4 text-warm-gray dark:text-light-gray text-sm">
          <Link to="/terms" className="hover:text-charcoal dark:hover:text-light-cream transition-colors">
            Terms of Use
          </Link>
          <span>•</span>
          <Link to="/privacy" className="hover:text-charcoal dark:hover:text-light-cream transition-colors">
            Privacy
          </Link>
          <span>•</span>
          <Link to="/contact" className="hover:text-charcoal dark:hover:text-light-cream transition-colors">
            Contact Us
          </Link>
        </div>
      </div>
    </footer>
  );
}
