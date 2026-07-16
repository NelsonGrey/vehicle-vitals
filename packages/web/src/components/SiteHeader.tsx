import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { useAuth } from '../shared/AuthContext';
import { isDemonstrationEnvironment } from '../shared/environment';
import {
  AUTH_NAV_CAPABILITIES_WITHOUT_GETTING_STARTED,
  CAPABILITIES_BY_ID,
  PRODUCT_TOUR_LINK,
} from '../data/capabilities';
import { personaPages } from '../data/personas';
import { trackHeaderNavClick } from '../shared/marketingAnalytics';
import { useAppOffline } from '../shared/useAppOffline';
import StackedVLogo from './StackedVLogo';

interface SiteHeaderProps {
  overlay?: boolean;
}

export default function SiteHeader({ overlay = false }: SiteHeaderProps) {
  const { user, signOut, supportAccess } = useAuth();
  const isLoggedIn = Boolean(user && !user.isAnonymous);
  const isAppOffline = useAppOffline();

  const linkClass = `hover:opacity-80 transition-opacity whitespace-nowrap rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-slate-900 ${
    overlay ? 'text-gray-100 hover:text-white' : 'text-current'
  }`;

  return (
    <header
      className={`shrink-0 ${
        overlay
          ? 'bg-transparent border-b border-white/25'
          : 'bg-slate-50 dark:bg-slate-900'
      }`}
    >
      <div className="site-header-frame w-full max-w-7xl mx-auto px-4 sm:px-5 py-3">
        <nav
          className={`site-nav-shell rounded-xl border px-4 py-2.5 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between ${
            overlay
              ? 'border-white/30 bg-black/15 backdrop-blur-sm'
              : 'border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/70 backdrop-blur-sm'
          }`}
        >
          <div className="flex items-center gap-2.5 flex-none">
            <Link
              to="/"
              aria-label="Go to home"
              className="inline-flex no-underline text-current"
            >
              <StackedVLogo
                size={52}
                compact
                showText
                color={overlay ? '#ffffff' : 'currentColor'}
                accent={overlay ? '#10b981' : '#334155'}
                wordmarkColor={overlay ? '#ffffff' : '#64748b'}
              />
            </Link>
          </div>

          <div className="ml-0 lg:ml-auto flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-4 text-sm w-full lg:w-auto">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg px-2 py-1">
              {isLoggedIn ? (
                <>
                  <div className="flex items-center gap-x-3 mr-4">
                    <Link
                      to={CAPABILITIES_BY_ID.getting_started.webRoute}
                      className={linkClass}
                      onClick={() =>
                        trackHeaderNavClick(
                          CAPABILITIES_BY_ID.getting_started.fullLabel,
                          CAPABILITIES_BY_ID.getting_started.webRoute,
                          CAPABILITIES_BY_ID.getting_started.analyticsId
                        )
                      }
                    >
                      {CAPABILITIES_BY_ID.getting_started.fullLabel}
                    </Link>
                    <Link
                      to={PRODUCT_TOUR_LINK.to}
                      className={linkClass}
                      onClick={() =>
                        trackHeaderNavClick(
                          PRODUCT_TOUR_LINK.label,
                          PRODUCT_TOUR_LINK.to,
                          PRODUCT_TOUR_LINK.analyticsId
                        )
                      }
                    >
                      {PRODUCT_TOUR_LINK.label}
                    </Link>
                  </div>
                  {AUTH_NAV_CAPABILITIES_WITHOUT_GETTING_STARTED.map(
                    capability => (
                      <Link
                        key={capability.id}
                        to={capability.webRoute}
                        className={linkClass}
                        onClick={() =>
                          trackHeaderNavClick(
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
                  {supportAccess?.isSuperAdmin && (
                    <Link to="/app/admin" className={linkClass}>
                      Admin
                    </Link>
                  )}
                  {isDemonstrationEnvironment && (
                    <Link to="/app/dev-seed" className={linkClass}>
                      Data Seed
                    </Link>
                  )}
                </>
              ) : (
                <>
                  {personaPages.map(persona => (
                    <Link
                      key={persona.id}
                      to={persona.path}
                      className={linkClass}
                      onClick={() =>
                        trackHeaderNavClick(persona.navLabel, persona.path)
                      }
                    >
                      {persona.navLabel}
                    </Link>
                  ))}
                </>
              )}
            </div>

            <div className="flex flex-col items-center gap-1 sm:items-end rounded-lg px-2 py-1 min-w-32 sm:min-w-40">
              {isLoggedIn ? (
                <button
                  onClick={signOut}
                  className="whitespace-nowrap rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2"
                >
                  Sign Out
                </button>
              ) : isAppOffline ? (
                <>
                  <span
                    aria-disabled="true"
                    className="whitespace-nowrap rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white opacity-50 cursor-not-allowed"
                  >
                    Login / Sign Up
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Currently unavailable
                  </span>
                </>
              ) : (
                <Link
                  to="/auth/login"
                  className="whitespace-nowrap rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2"
                >
                  Login / Sign Up
                </Link>
              )}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}

SiteHeader.propTypes = {
  overlay: PropTypes.bool,
};
