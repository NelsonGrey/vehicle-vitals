import React from 'react';
import { Link } from 'react-router-dom';
import StackedVLogo from './StackedVLogo';
import { useAuth } from '../shared/AuthContext';

export default function SiteHeader({ overlay = false }) {
  const { user, signOut } = useAuth();
  return (
    <header className={`fixed top-0 left-0 right-0 h-20 flex items-end z-10 border-b ${
      overlay 
        ? 'bg-transparent border-white/25' 
        : 'bg-cream dark:bg-deep-brown border-tan dark:border-dark-border'
    }`}>
      <div className="max-w-6xl mx-auto px-5 pb-2 w-full">
        <nav className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2.5 flex-none">
            <Link to="/" aria-label="Go to home" className="inline-flex no-underline text-current">
              <StackedVLogo
                size={34}
                showText
                color={overlay ? '#ffffff' : 'currentColor'}
                accent={overlay ? 'var(--gold)' : 'var(--primary)'}
                wordmarkColor={overlay ? '#ffffff' : 'var(--muted)'}
              />
            </Link>
          </div>
          <div className={`flex gap-3 ml-auto flex-none text-right items-center ${
            overlay ? 'text-gray-100' : 'text-current'
          }`}>
            <Link to="/instructions" className={`hover:opacity-75 transition-opacity ${
              overlay ? 'text-gray-100 hover:text-white' : ''
            }`}>
              Instructions
            </Link>
            {user ? (
              <>
                <Link to="/app" className={`hover:opacity-75 transition-opacity ${
                  overlay ? 'text-gray-100 hover:text-white' : ''
                }`}>
                  My Garage
                </Link>
                <Link to="/profile" className={`hover:opacity-75 transition-opacity ${
                  overlay ? 'text-gray-100 hover:text-white' : ''
                }`}>
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
                <Link to="/login" className={`hover:opacity-75 transition-opacity ${
                  overlay ? 'text-gray-100 hover:text-white' : ''
                }`}>
                  Login
                </Link>
                <Link to="/signup" className={`hover:opacity-75 transition-opacity ${
                  overlay ? 'text-gray-100 hover:text-white' : ''
                }`}>
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
