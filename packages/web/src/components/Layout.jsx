import React from 'react';
import { Outlet } from 'react-router-dom';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <SiteHeader overlay={false} />
      <main className="pt-20 pb-16 min-h-[calc(100vh-5rem)]">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
