import { Outlet } from 'react-router-dom';
import HeaderAdBar from './HeaderAdBar';
import InlineAdSection from './InlineAdSection';
import SiteFooter from './SiteFooter';
import SiteHeader from './SiteHeader';

export default function Layout() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100 lg:h-[100dvh] lg:overflow-hidden">
      <SiteHeader overlay={false} />
      <HeaderAdBar />
      <main className="site-scroll-area flex-1 overflow-x-hidden bg-slate-50 dark:bg-slate-900 lg:overflow-y-auto">
        <div className="site-main-content w-full max-w-7xl mx-auto px-4 sm:px-5 py-4">
          <Outlet />
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
