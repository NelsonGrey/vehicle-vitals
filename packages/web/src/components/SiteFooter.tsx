import { Link } from 'react-router-dom';
import { personaPages } from '../data/personas';
import StackedVLogo from './StackedVLogo';

const productLinks = [
  { label: 'How It Works', to: '/start-steps' },
  { label: 'Pricing', to: '/subscription' },
  { label: 'Product Tour', to: '/short-video-tours' },
  { label: 'Screens', to: '/everyday-screens' },
];

const supportLinks = [
  { label: 'Help', to: '/help' },
  { label: 'Contact', to: '/contact' },
  { label: 'Privacy', to: '/privacy' },
  { label: 'Terms', to: '/terms' },
];

export default function SiteFooter() {
  return (
    <footer className="shrink-0 border-t border-slate-700 bg-slate-950 text-white">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <Link
            to="/"
            aria-label="Go to home"
            className="inline-flex no-underline text-white shrink-0"
          >
            <StackedVLogo
              size={30}
              showText
              color="#ffffff"
              accent="#14b8a6"
              wordmarkColor="#cbd5e1"
            />
          </Link>

          <nav
            aria-label="Product"
            className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-300"
          >
            {productLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <nav
            aria-label="Personas"
            className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-300"
          >
            {personaPages.map(persona => (
              <Link
                key={persona.id}
                to={persona.path}
                className="transition-colors hover:text-white"
              >
                {persona.navLabel}
              </Link>
            ))}
          </nav>

          <nav
            aria-label="Support and legal"
            className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400"
          >
            {supportLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-3 flex flex-col gap-2 border-t border-slate-700 pt-3 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Vehicle Vitals. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <a
              href="mailto:support@vehicle-vitals.com"
              className="transition-colors hover:text-white"
            >
              Support
            </a>
            <a
              href="mailto:sales@vehicle-vitals.com"
              className="transition-colors hover:text-white"
            >
              Sales
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
