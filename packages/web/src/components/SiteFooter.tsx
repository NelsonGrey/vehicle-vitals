import { Link } from 'react-router-dom';
import { useAuth } from '../shared/AuthContext';
import { personaPages } from '../data/personas';
import { trackFooterNavClick } from '../shared/marketingAnalytics';
import StackedVLogo from './StackedVLogo';

const productLinks = [
  { label: 'How It Works', to: '/start-steps' },
  { label: 'Pricing', to: '/subscription' },
  { label: 'Product Tour', to: '/short-video-tours' },
  { label: 'Screens', to: '/everyday-screens' },
];

const appNavLinks = [
  { label: 'Garage', to: '/app' },
  { label: 'Profile', to: '/app/profile' },
  { label: 'Timeline', to: '/app/timeline' },
  { label: 'Upcoming', to: '/app/upcoming' },
  { label: 'Mechanics', to: '/app/providers' },
];

const supportLinks = [
  { label: 'Help', to: '/help' },
  { label: 'Support', to: '/support' },
  { label: 'Privacy', to: '/privacy' },
  { label: 'Terms', to: '/terms' },
];

const SOCIAL_LINKS = [
  {
    label: 'X / Twitter',
    href: 'https://x.com/vehiclevitals',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.629 5.905-5.629zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com/vehiclevitals',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    ),
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com/@vehiclevitals',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
];

export default function SiteFooter() {
  const { user } = useAuth();
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
              size={60}
              compact
              showText
              color="#ffffff"
              accent="#14b8a6"
              wordmarkColor="#cbd5e1"
              windowColor="#020617"
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
                onClick={() => trackFooterNavClick(link.label, link.to)}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {!user ? (
            <nav
              aria-label="Personas"
              className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-300"
            >
              {personaPages.map(persona => (
                <Link
                  key={persona.id}
                  to={persona.path}
                  className="transition-colors hover:text-white"
                  onClick={() => trackFooterNavClick(persona.navLabel, persona.path)}
                >
                  {persona.navLabel}
                </Link>
              ))}
            </nav>
          ) : (
            <nav
              aria-label="App"
              className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-300"
            >
              {appNavLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="transition-colors hover:text-white"
                  onClick={() => trackFooterNavClick(link.label, link.to)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          <nav
            aria-label="Support and legal"
            className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400"
          >
            {supportLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="transition-colors hover:text-white"
                onClick={() => trackFooterNavClick(link.label, link.to)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-3 flex flex-col gap-2 border-t border-slate-700 pt-3 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Vehicle Vitals. All rights reserved.</p>
          <div className="flex items-center gap-3">
            {SOCIAL_LINKS.map(({ label, href, icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-slate-500 hover:text-white transition-colors"
              >
                {icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
