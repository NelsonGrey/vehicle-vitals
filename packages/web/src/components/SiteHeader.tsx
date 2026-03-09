import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { useAuth } from '../shared/AuthContext';
import StackedVLogo from './StackedVLogo';

interface SiteHeaderProps {
  overlay?: boolean;
}

export default function SiteHeader({ overlay = false }: SiteHeaderProps) {
  const { user, signOut } = useAuth();
  return (
    <header
      className={`fixed top-0 left-0 right-0 h-20 flex items-end z-10 border-b ${
        overlay
          ? 'bg-transparent border-white/25'
          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 pb-2 w-full">
        <nav className="flex items-center justify-between w-full">
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
          <div
            className={`flex gap-3 ml-auto flex-none text-right items-center ${
              overlay ? 'text-gray-100' : 'text-current'
            }`}
          >
            <Link
              to="/instructions"
              className={`hover:opacity-75 transition-opacity ${
                overlay ? 'text-gray-100 hover:text-white' : ''
              }`}
            >
              Instructions
            </Link>
            {user ? (
              <>
                <Link
                  to="/app"
                  className={`hover:opacity-75 transition-opacity ${
                    overlay ? 'text-gray-100 hover:text-white' : ''
                  }`}
                >
                  My Garage
                </Link>
                <Link
                  to="/app/timeline"
                  className={`hover:opacity-75 transition-opacity ${
                    overlay ? 'text-gray-100 hover:text-white' : ''
                  }`}
                >
                  Timeline
                </Link>
                <Link
                  to="/app/upcoming"
                  className={`hover:opacity-75 transition-opacity ${
                    overlay ? 'text-gray-100 hover:text-white' : ''
                  }`}
                >
                  Upcoming
                </Link>
                <Link
                  to="/app/profile"
                  className={`hover:opacity-75 transition-opacity ${
                    overlay ? 'text-gray-100 hover:text-white' : ''
                  }`}
                >
                  Profile
                </Link>
                <button
                  onClick={signOut}
                  className={`p-0 bg-transparent border-none cursor-pointer hover:opacity-75 transition-opacity ${
                    overlay ? 'text-gray-100 hover:text-white' : 'text-current'
                  }`}
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/auth/login"
                  className={`hover:opacity-75 transition-opacity ${
                    overlay ? 'text-gray-100 hover:text-white' : ''
                  }`}
                >
                  Login
                </Link>
                <Link
                  to="/auth/signup"
                  className={`hover:opacity-75 transition-opacity ${
                    overlay ? 'text-gray-100 hover:text-white' : ''
                  }`}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

SiteHeader.propTypes = {
  overlay: PropTypes.bool,
};
