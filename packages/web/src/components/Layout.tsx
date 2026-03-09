import { Outlet } from 'react-router-dom';
import HeaderAdBar from './HeaderAdBar';
import SiteFooter from './SiteFooter';
import SiteHeader from './SiteHeader';

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <SiteHeader overlay={false} />
      <HeaderAdBar />
      <main className="pt-40 pb-16 min-h-[calc(100vh-5rem)]">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
