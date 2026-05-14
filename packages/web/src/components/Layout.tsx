import { Outlet } from 'react-router-dom';
import HeaderAdBar from './HeaderAdBar';
import InlineAdSection from './InlineAdSection';
import SiteFooter from './SiteFooter';
import SiteHeader from './SiteHeader';

export default function Layout() {
  return (
    <div className="h-[100dvh] min-h-screen flex flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <SiteHeader overlay={false} />
      <HeaderAdBar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-900">
        <div className="w-full px-4 sm:px-5 py-4">
          <Outlet />
          <div className="max-w-5xl mx-auto mt-4">
            <InlineAdSection placement="maintenanceHistory" />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
