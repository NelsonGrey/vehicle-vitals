import { Link } from 'react-router-dom';
import { useAuth } from '../shared/AuthContext';
import {
  AUTH_NAV_CAPABILITIES_WITHOUT_GETTING_STARTED,
  CAPABILITIES_BY_ID,
  PRODUCT_TOUR_LINK,
} from '../data/capabilities';
import { personaPages } from '../data/personas';
import { trackFooterNavClick } from '../shared/marketingAnalytics';
import StackedVLogo from './StackedVLogo';

interface FooterLink {
  label: string;
  to: string;
  capabilityId?: string;
}

// Getting Started and Product Tour are both "learn about the product"
// content rather than an app task, so they're paired together and styled
// distinctly (blue, vs. the slate used by every other footer link) on both
// the signed-out (marketing) and signed-in (app) sides — always shown,
// unlike the persona/App nav below which switches on auth state.
const learnMoreLinks: FooterLink[] = [
  {
    label: CAPABILITIES_BY_ID.getting_started.fullLabel,
    to: CAPABILITIES_BY_ID.getting_started.webRoute,
    capabilityId: CAPABILITIES_BY_ID.getting_started.analyticsId,
  },
  {
    label: PRODUCT_TOUR_LINK.label,
    to: PRODUCT_TOUR_LINK.to,
    capabilityId: PRODUCT_TOUR_LINK.analyticsId,
  },
];

const supportLinks = [
  { label: 'Pricing', to: '/subscription' },
  { label: 'Help', to: '/help' },
  { label: 'Support', to: '/support' },
  { label: 'Privacy', to: '/privacy' },
  { label: 'Terms', to: '/terms' },
];

const SOCIAL_LINKS = [
  {
    label: 'Threads',
    href: 'https://www.threads.com/@vehicle.vitals',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
        <path d="M18.263 11.097c-.03-3.486-1.92-5.586-5.111-5.586-2.13 0-3.922.963-4.863 2.499l2.062 1.438c.535-.843 1.272-1.543 2.628-1.543 1.528 0 2.318.85 2.544 2.431a15 15 0 0 0-2.236-.173c-4.125 0-6.068 1.867-6.068 4.336s1.943 3.99 4.804 3.99c3.139 0 5.013-2.115 5.781-4.735.798.361 1.348 1.204 1.348 2.47 0 3.387-3.907 5.232-7.22 5.232-4.885 0-8.077-3.207-8.077-8.424 0-6.392 4.223-10.487 9.9-10.487 3.808 0 5.69 1.671 6.97 3.914l2.108-1.475C21.44 2.078 18.331 0 13.663 0 6.227 0 1.168 5.277 1.168 12.934c0 7 4.953 11.066 10.856 11.066 4.878 0 9.809-2.846 9.809-7.716 0-2.545-1.46-4.231-3.569-5.187m-6.33 4.855c-1.077 0-2.026-.512-2.026-1.453 0-1.483 1.822-1.934 3.606-1.934.678 0 1.34.045 1.927.173-.422 1.927-1.671 3.215-3.508 3.214Z" />
      </svg>
    ),
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=61593861356748',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
        <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/vehicle.vitals/',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    ),
  },
  {
    label: 'Reddit',
    href: 'https://www.reddit.com/r/VehicleVitals/',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 3.314 1.343 6.314 3.515 8.485l-2.286 2.286C.775 23.225 1.097 24 1.738 24H12c6.627 0 12-5.373 12-12S18.627 0 12 0Zm4.388 3.199c1.104 0 1.999.895 1.999 1.999 0 1.105-.895 2-1.999 2-.946 0-1.739-.657-1.947-1.539v.002c-1.147.162-2.032 1.15-2.032 2.341v.007c1.776.067 3.4.567 4.686 1.363.473-.363 1.064-.58 1.707-.58 1.547 0 2.802 1.254 2.802 2.802 0 1.117-.655 2.081-1.601 2.531-.088 3.256-3.637 5.876-7.997 5.876-4.361 0-7.905-2.617-7.998-5.87-.954-.447-1.614-1.415-1.614-2.538 0-1.548 1.255-2.802 2.803-2.802.645 0 1.239.218 1.712.585 1.275-.79 2.881-1.291 4.64-1.365v-.01c0-1.663 1.263-3.034 2.88-3.207.188-.911.993-1.595 1.959-1.595Zm-8.085 8.376c-.784 0-1.459.78-1.506 1.797-.047 1.016.64 1.429 1.426 1.429.786 0 1.371-.369 1.418-1.385.047-1.017-.553-1.841-1.338-1.841Zm7.406 0c-.786 0-1.385.824-1.338 1.841.047 1.017.634 1.385 1.418 1.385.785 0 1.473-.413 1.426-1.429-.046-1.017-.721-1.797-1.506-1.797Zm-3.703 4.013c-.974 0-1.907.048-2.77.135-.147.015-.241.168-.183.305.483 1.154 1.622 1.964 2.953 1.964 1.33 0 2.47-.81 2.953-1.964.057-.137-.037-.29-.184-.305-.863-.087-1.795-.135-2.769-.135Z" />
      </svg>
    ),
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@vehicle.vitals',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    ),
  },
  {
    label: 'X / Twitter',
    href: 'https://x.com/vehiclevitalapp',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.629 5.905-5.629zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/@vehicle-vitals',
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
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <Link
            to="/"
            aria-label="Go to home"
            className="inline-flex no-underline text-white shrink-0"
          >
            <StackedVLogo
              size={28}
              showText={false}
              color="#ffffff"
              accent="#2563eb"
              wordmarkColor="#cbd5e1"
              windowColor="#020617"
            />
          </Link>

          <div className="footer-primary-links flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:gap-x-10 sm:gap-y-4 lg:flex-nowrap lg:items-center lg:gap-x-5">
            <nav
              aria-label="Learn more"
              className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-blue-300 lg:flex-nowrap"
            >
              {learnMoreLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="whitespace-nowrap transition-colors hover:text-blue-100"
                  onClick={() =>
                    trackFooterNavClick(link.label, link.to, link.capabilityId)
                  }
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {!user ? (
              <nav
                aria-label="Personas"
                className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-300 lg:flex-nowrap"
              >
                {personaPages.map(persona => (
                  <Link
                    key={persona.id}
                    to={persona.path}
                    className="whitespace-nowrap transition-colors hover:text-white"
                    onClick={() =>
                      trackFooterNavClick(persona.navLabel, persona.path)
                    }
                  >
                    {persona.navLabel}
                  </Link>
                ))}
              </nav>
            ) : (
              <nav
                aria-label="App"
                className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-300 lg:flex-nowrap"
              >
                {AUTH_NAV_CAPABILITIES_WITHOUT_GETTING_STARTED.map(
                  capability => (
                    <Link
                      key={capability.id}
                      to={capability.webRoute}
                      className="whitespace-nowrap transition-colors hover:text-white"
                      onClick={() =>
                        trackFooterNavClick(
                          capability.fullLabel,
                          capability.webRoute,
                          capability.analyticsId
                        )
                      }
                    >
                      {capability.fullLabel}
                    </Link>
                  )
                )}
              </nav>
            )}

            <nav
              aria-label="Support and legal"
              className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400 lg:flex-nowrap"
            >
              {supportLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="whitespace-nowrap transition-colors hover:text-white"
                  onClick={() => trackFooterNavClick(link.label, link.to)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2 border-t border-slate-700 pt-3 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Vehicle-Vitals, a product of Nelson
            Grey LLC. All rights reserved.
          </p>
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
