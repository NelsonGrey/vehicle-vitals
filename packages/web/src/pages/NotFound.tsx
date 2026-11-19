import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PageSEO from '../components/PageSEO';
import SiteFooter from '../components/SiteFooter';
import SiteHeader from '../components/SiteHeader';
import { APP_URL } from '../shared/seoMeta';

/**
 * In-app unknown routes. Direct requests for unknown URLs are answered by
 * Firebase Hosting with public/404.html and HTTP 404 before this bundle
 * loads. This view covers client-side navigations that never hit the server.
 */
export default function NotFound() {
  const location = useLocation();

  useEffect(() => {
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const created = !robots;
    if (!robots) {
      robots = document.createElement('meta');
      robots.setAttribute('name', 'robots');
      document.head.appendChild(robots);
    }
    const previous = robots.getAttribute('content');
    robots.setAttribute('content', 'noindex');
    return () => {
      if (!robots) return;
      if (created) {
        robots.remove();
      } else if (previous) {
        robots.setAttribute('content', previous);
      } else {
        robots.removeAttribute('content');
      }
    };
  }, []);

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <PageSEO
        meta={{
          title: 'Page not found — Vehicle-Vitals',
          description:
            'That address is not a Vehicle-Vitals page. Head back to the homepage to look up maintenance records, reminders, and ownership costs.',
          canonical: `${APP_URL}${location.pathname}`,
        }}
      />
      <SiteHeader overlay={false} />
      <main className="site-scroll-area flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-slate-900">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            404
          </p>
          <h1 className="mt-3 font-serif text-3xl text-slate-900 dark:text-slate-100 sm:text-4xl">
            Page not found
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-600 dark:text-slate-300">
            That address is not part of Vehicle-Vitals. The page may have
            moved, or the link may be out of date.
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex rounded-xl bg-slate-800 px-5 py-3 font-semibold text-white transition hover:bg-slate-950 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white"
          >
            Back to the homepage
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
