import { Outlet } from 'react-router-dom';
import HeaderAdBar from './HeaderAdBar';
import InlineAdSection from './InlineAdSection';
import SiteFooter from './SiteFooter';
import SiteHeader from './SiteHeader';

export default function AuthLayout() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100 lg:h-[100dvh] lg:overflow-hidden">
      <SiteHeader />

      <HeaderAdBar />

      <main className="flex-1 overflow-x-hidden bg-slate-50 dark:bg-slate-900 px-4 sm:px-5 py-6 sm:py-8 lg:overflow-y-auto">
        <div className="w-full max-w-7xl mx-auto">
          <div className="w-full max-w-2xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

      <div className="shrink-0 bg-slate-50 dark:bg-slate-900">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-5 py-3">
          <InlineAdSection placement="maintenanceHistory" />
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
