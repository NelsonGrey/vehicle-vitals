import { Link } from 'react-router-dom';
import MarketingVideoPanel from '../components/MarketingVideoPanel';

export default function ShortVideoTours() {
  const demoVideoReady = [
    {
      title: 'Getting started video',
      description:
        'A quick walkthrough of sign-up, adding a vehicle, and opening your garage.',
      poster: '/images/features/add-vehicle.png',
      videoPath: '/videos/feature-demos/onboarding-walkthrough.mp4',
      fallbackHref: '/getting-started',
      fallbackLabel: 'Open getting started guide',
    },
    {
      title: 'Service tracking video',
      description:
        'See how to log service, review history, and track upcoming work.',
      poster: '/images/features/timeline.png',
      videoPath: '/videos/feature-demos/maintenance-lifecycle-tour.mp4',
      fallbackHref: '/maintenance-planning-demo',
      fallbackLabel: 'Open service tracking demo',
    },
    {
      title: 'Web and mobile video',
      description: 'See how the same account works on both web and mobile.',
      poster: '/images/features/ios-home.png',
      videoPath: '/videos/feature-demos/cross-platform-continuity.mp4',
      fallbackHref: '/cross-platform-access-demo',
      fallbackLabel: 'Open web and mobile demo',
    },
  ];

  return (
    <section className="py-8 sm:py-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-5">
        <h1 className="font-serif text-3xl text-slate-900 dark:text-slate-100 sm:text-4xl">
          Short video tours
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
          Three short videos that explain the basics in plain language.
        </p>
        <Link
          to="/"
          className="mt-3 inline-flex items-center text-sm font-medium text-slate-700 underline transition hover:text-slate-900 dark:text-slate-200 dark:hover:text-white"
        >
          Back to product overview
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {demoVideoReady.map(item => (
          <MarketingVideoPanel
            key={item.title}
            title={item.title}
            description={item.description}
            poster={item.poster}
            videoPath={item.videoPath}
            fallbackHref={item.fallbackHref}
            fallbackLabel={item.fallbackLabel}
          />
        ))}
      </div>
    </section>
  );
}
