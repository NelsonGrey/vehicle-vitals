import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { useAuth } from '../shared/AuthContext';
import StackedVLogo from './StackedVLogo';

interface SiteHeaderProps {
  overlay?: boolean;
}

export default function SiteHeader({ overlay = false }: SiteHeaderProps) {
  const { user, signOut } = useAuth();

  const linkClass = `hover:opacity-80 transition-opacity whitespace-nowrap rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-slate-900 ${
    overlay ? 'text-gray-100 hover:text-white' : 'text-current'
  }`;

  const sectionLabelClass = `text-[10px] font-semibold uppercase tracking-wider ${
    overlay ? 'text-gray-200/90' : 'text-slate-500 dark:text-slate-400'
  }`;

  return (
    <header
      className={`shrink-0 border-b ${
        overlay
          ? 'bg-transparent border-white/25'
          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-5 py-3 w-full">
        <nav
          className={`rounded-xl border px-4 py-2.5 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between ${
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
                size={34}
                showText
                color={overlay ? '#ffffff' : 'currentColor'}
                accent={overlay ? '#10b981' : '#334155'}
                wordmarkColor={overlay ? '#ffffff' : '#64748b'}
              />
            </Link>
          </div>

          <div className="ml-0 lg:ml-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 md:gap-3 text-sm w-full lg:w-auto">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg px-2 py-1 border border-transparent md:border-slate-200/80 md:dark:border-slate-700/80">
              <span className={sectionLabelClass}>Marketing</span>
              <Link to="/" className={linkClass}>
                Home
              </Link>
              <Link to="/instructions" className={linkClass}>
                Instructions
              </Link>
              <Link to="/contact" className={linkClass}>
                Contact
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg px-2 py-1 border border-transparent md:border-slate-200/80 md:dark:border-slate-700/80">
              <span className={sectionLabelClass}>Account</span>
              {user ? (
                <>
                  <Link to="/app/profile" className={linkClass}>
                    Profile
                  </Link>
                  <button
                    onClick={signOut}
                    className={`p-0 bg-transparent border-none cursor-pointer ${linkClass}`}
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/auth/login" className={linkClass}>
                    Login
                  </Link>
                  <Link to="/auth/signup" className={linkClass}>
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg px-2 py-1 border border-transparent md:border-slate-200/80 md:dark:border-slate-700/80">
              <span className={sectionLabelClass}>Application</span>
              <Link to="/app" className={linkClass}>
                Garage
              </Link>
              <Link to="/app/timeline" className={linkClass}>
                Timeline
              </Link>
              <Link to="/app/upcoming" className={linkClass}>
                Upcoming
              </Link>
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
