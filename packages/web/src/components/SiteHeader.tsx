import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { useAuth } from '../shared/AuthContext';
import { isDemonstrationEnvironment } from '../shared/environment';
import { personaPages } from '../data/personas';
import { trackHeaderNavClick } from '../shared/marketingAnalytics';
import StackedVLogo from './StackedVLogo';

interface SiteHeaderProps {
  overlay?: boolean;
}

export default function SiteHeader({ overlay = false }: SiteHeaderProps) {
  const { user, signOut, supportAccess } = useAuth();
  const isLoggedIn = Boolean(user && !user.isAnonymous);

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
                size={42}
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
                  <Link to="/getting-started" className={linkClass} onClick={() => trackHeaderNavClick('Getting Started', '/getting-started')}>
                    Getting Started
                  </Link>
                  <Link to="/app" className={linkClass} onClick={() => trackHeaderNavClick('Garage', '/app')}>
                    Garage
                  </Link>
                  <Link to="/app/profile" className={linkClass} onClick={() => trackHeaderNavClick('Profile', '/app/profile')}>
                    Profile
                  </Link>
                  <Link to="/app/timeline" className={linkClass} onClick={() => trackHeaderNavClick('Timeline', '/app/timeline')}>
                    Timeline
                  </Link>
                  <Link to="/app/upcoming" className={linkClass} onClick={() => trackHeaderNavClick('Upcoming', '/app/upcoming')}>
                    Upcoming
                  </Link>
                  <Link to="/app/providers" className={linkClass} onClick={() => trackHeaderNavClick('Mechanics', '/app/providers')}>
                    Mechanics
                  </Link>
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
                      onClick={() => trackHeaderNavClick(persona.navLabel, persona.path)}
                    >
                      {persona.navLabel}
                    </Link>
                  ))}
                  <Link to="/subscription" className={linkClass} onClick={() => trackHeaderNavClick('Pricing', '/subscription')}>
                    Pricing
                  </Link>
                  <Link to="/short-video-tours" className={linkClass} onClick={() => trackHeaderNavClick('Product Tour', '/short-video-tours')}>
                    Product Tour
                  </Link>
                </>
              )}
            </div>

            <div className="flex items-center sm:justify-end rounded-lg px-2 py-1 min-w-[8rem] sm:min-w-[10rem]">
              {isLoggedIn ? (
                <button
                  onClick={signOut}
                  className={`p-0 bg-transparent border-none cursor-pointer ${linkClass}`}
                >
                  Sign Out
                </button>
              ) : (
                <Link to="/auth/login" className={linkClass}>
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
