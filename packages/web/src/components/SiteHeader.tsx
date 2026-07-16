import PropTypes from 'prop-types';
import { useState } from 'react';
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isLoggedIn = Boolean(user && !user.isAnonymous);
  const isAppOffline = useAppOffline();

  const linkClass = `hover:opacity-80 transition-opacity whitespace-nowrap rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-slate-900 ${
    overlay ? 'text-gray-100 hover:text-white' : 'text-current'
  }`;

  const authAction = (compact = false) => {
    const sizeClass = compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-1.5 text-sm';
    if (isLoggedIn) {
      return (
        <button
          type="button"
          onClick={signOut}
          className={`whitespace-nowrap rounded-md border border-slate-300 font-medium transition-colors hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700 ${sizeClass}`}
        >
          Sign Out
        </button>
      );
    }
    if (isAppOffline) {
      return (
        <span
          aria-disabled="true"
          className={`whitespace-nowrap rounded-md bg-teal-700 font-medium text-white opacity-50 ${sizeClass}`}
        >
          Sign in unavailable
        </span>
      );
    }
    return (
      <Link
        to="/auth/login"
        className={`whitespace-nowrap rounded-md bg-teal-700 font-medium text-white transition hover:bg-teal-800 ${sizeClass}`}
      >
        Login / Sign Up
      </Link>
    );
  };

  const navLinks = (mobile = false) => (
    <div
      className={
        mobile
          ? 'grid gap-1 text-sm'
          : 'flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg px-2 py-1 text-sm'
      }
    >
      {isLoggedIn ? (
        <>
          <Link
            to={CAPABILITIES_BY_ID.getting_started.webRoute}
            className={linkClass}
            onClick={() => {
              trackHeaderNavClick(
                CAPABILITIES_BY_ID.getting_started.fullLabel,
                CAPABILITIES_BY_ID.getting_started.webRoute,
                CAPABILITIES_BY_ID.getting_started.analyticsId
              );
              if (mobile) setIsMenuOpen(false);
            }}
          >
            {CAPABILITIES_BY_ID.getting_started.fullLabel}
          </Link>
          <Link
            to={PRODUCT_TOUR_LINK.to}
            className={linkClass}
            onClick={() => {
              trackHeaderNavClick(
                PRODUCT_TOUR_LINK.label,
                PRODUCT_TOUR_LINK.to,
                PRODUCT_TOUR_LINK.analyticsId
              );
              if (mobile) setIsMenuOpen(false);
            }}
          >
            {PRODUCT_TOUR_LINK.label}
          </Link>
          {AUTH_NAV_CAPABILITIES_WITHOUT_GETTING_STARTED.map(capability => (
            <Link
              key={capability.id}
              to={capability.webRoute}
              className={linkClass}
              onClick={() => {
                trackHeaderNavClick(
                  capability.fullLabel,
                  capability.webRoute,
                  capability.analyticsId
                );
                if (mobile) setIsMenuOpen(false);
              }}
            >
              {capability.fullLabel}
            </Link>
          ))}
          {supportAccess?.isSuperAdmin && (
            <Link
              to="/app/admin"
              className={linkClass}
              onClick={() => mobile && setIsMenuOpen(false)}
            >
              Admin
            </Link>
          )}
          {isDemonstrationEnvironment && (
            <Link
              to="/app/dev-seed"
              className={linkClass}
              onClick={() => mobile && setIsMenuOpen(false)}
            >
              Data Seed
            </Link>
          )}
        </>
      ) : (
        <>
          {mobile ? (
            <>
              {personaPages.map(persona => (
                <Link
                  key={persona.id}
                  to={persona.path}
                  className={linkClass}
                  onClick={() => {
                    trackHeaderNavClick(persona.navLabel, persona.path);
                    setIsMenuOpen(false);
                  }}
                >
                  {persona.navLabel}
                </Link>
              ))}
              <Link
                to="/getting-started"
                className={linkClass}
                onClick={() => setIsMenuOpen(false)}
              >
                Getting Started
              </Link>
              <Link
                to="/product-tour"
                className={linkClass}
                onClick={() => setIsMenuOpen(false)}
              >
                Product Tour
              </Link>
              <Link
                to="/subscription"
                className={linkClass}
                onClick={() => setIsMenuOpen(false)}
              >
                Plans
              </Link>
            </>
          ) : (
            <>
              <Link to="/getting-started" className={linkClass}>
                Getting Started
              </Link>
              <Link to="/product-tour" className={linkClass}>
                Product Tour
              </Link>
              <Link to="/subscription" className={linkClass}>
                Plans
              </Link>
              <button
                type="button"
                aria-expanded={isMenuOpen}
                aria-controls="site-desktop-use-cases"
                onClick={() => setIsMenuOpen(value => !value)}
                className={`${linkClass} inline-flex items-center gap-1 bg-transparent`}
              >
                Use cases
                <span aria-hidden="true">{isMenuOpen ? '▲' : '▼'}</span>
              </button>
            </>
          )}
        </>
      )}
    </div>
  );

  return (
    <header
      className={`relative z-40 shrink-0 ${
        overlay
          ? 'border-b border-white/25 bg-transparent'
          : 'bg-slate-50 dark:bg-slate-900'
      }`}
    >
      <div className="site-header-frame mx-auto w-full max-w-7xl px-4 py-3 sm:px-5">
        <nav
          className={`site-nav-shell relative flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 sm:px-4 ${
            overlay
              ? 'border-white/30 bg-black/15 backdrop-blur-sm'
              : 'border-slate-200 bg-white/90 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/70'
          }`}
        >
          <Link
            to="/"
            aria-label="Go to home"
            className="inline-flex shrink-0 text-current no-underline"
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

          <div className="hidden min-w-0 items-center justify-end gap-3 lg:flex">
            {navLinks()}
            {authAction()}
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            {authAction(true)}
            <button
              type="button"
              aria-expanded={isMenuOpen}
              aria-controls="site-mobile-menu"
              onClick={() => setIsMenuOpen(value => !value)}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold dark:border-slate-600"
            >
              {isLoggedIn ? 'Menu' : 'Use cases'}
              <span aria-hidden="true">{isMenuOpen ? '▲' : '▼'}</span>
            </button>
          </div>

          {isMenuOpen && (
            <div
              id="site-mobile-menu"
              className="absolute left-3 right-3 top-[calc(100%+0.5rem)] z-50 rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-800 lg:hidden"
            >
              {navLinks(true)}
            </div>
          )}

          {isMenuOpen && !isLoggedIn && (
            <div
              id="site-desktop-use-cases"
              className="absolute right-3 top-[calc(100%+0.5rem)] z-50 hidden w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-800 lg:grid lg:gap-2"
            >
              {personaPages.map(persona => (
                <Link
                  key={persona.id}
                  to={persona.path}
                  className={linkClass}
                  onClick={() => {
                    trackHeaderNavClick(persona.navLabel, persona.path);
                    setIsMenuOpen(false);
                  }}
                >
                  {persona.navLabel}
                </Link>
              ))}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

SiteHeader.propTypes = {
  overlay: PropTypes.bool,
};
