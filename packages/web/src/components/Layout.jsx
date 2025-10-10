import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';

export default function Layout({ forceOverlay = false }) {
  const location = useLocation();
  const overlay = forceOverlay || location.pathname === '/';
  return (
    <div className="min-h-screen bg-cream text-charcoal dark:bg-deep-brown dark:text-light-cream">
      <SiteHeader overlay={overlay} />
      <main className={`${overlay ? 'pt-0' : 'pt-20'} pb-16 min-h-[calc(100vh-5rem)]`}>
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
