import { Link } from 'react-router-dom';
import MarketingVideoPanel from '../components/MarketingVideoPanel';
import { useAuth } from '../shared/AuthContext';

interface FeatureDemoProps {
  title: string;
  subtitle: string;
  marketingBullets: string[];
  appRoute: string;
  appCtaLabel: string;
}

const mediaByFeature: Record<
  string,
  {
    hero: string;
    gallery: string[];
    videoPoster: string;
    videoPath: string;
  }
> = {
  'VIN Lookup': {
    hero: '/images/features/add-vehicle.png',
    gallery: [
      '/images/features/garage-vehicles.png',
      '/images/features/garage-detail.png',
      '/images/features/add-vehicle.png',
    ],
    videoPoster: '/images/features/add-vehicle.png',
    videoPath: '/videos/feature-demos/vin-decode-demo.mp4',
  },
  'Maintenance Planning': {
    hero: '/images/features/upcoming.png',
    gallery: [
      '/images/features/records.png',
      '/images/features/timeline.png',
      '/images/features/upcoming.png',
    ],
    videoPoster: '/images/features/timeline.png',
    videoPath: '/videos/feature-demos/maintenance-planning-demo.mp4',
  },
  'Cross Platform Access': {
    hero: '/images/features/ios-home.png',
    gallery: [
      '/images/features/ios-home.png',
      '/images/features/ios-upcoming.png',
      '/images/features/ios-profile.png',
    ],
    videoPoster: '/images/features/ios-home.png',
    videoPath: '/videos/feature-demos/cross-platform-access-demo.mp4',
  },
  'Ownership History': {
    hero: '/images/features/timeline.png',
    gallery: [
      '/images/features/records.png',
      '/images/features/timeline.png',
      '/images/features/profile.png',
    ],
    videoPoster: '/images/features/timeline.png',
    videoPath: '/videos/feature-demos/ownership-history-demo.mp4',
  },
};

export default function FeatureDemo({
  title,
  subtitle,
  marketingBullets,
  appRoute,
  appCtaLabel,
}: FeatureDemoProps) {
  const { user } = useAuth();
  const media = mediaByFeature[title] ?? {
    hero: '/images/features/landing-current.png',
    gallery: [
      '/images/features/landing-current.png',
      '/images/features/garage-vehicles.png',
      '/images/features/profile.png',
    ],
    videoPoster: '/images/features/landing-current.png',
    videoPath: '/videos/feature-demos/generic-feature-demo.mp4',
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-5 py-8 space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
        <img
          src={media.hero}
          alt={`${title} hero preview`}
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/75 to-slate-900/55" />
        <div className="relative p-6 sm:p-8 lg:p-10">
          <div className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white ring-1 ring-white/30">
            Feature Overview
          </div>
          <h1 className="mt-4 font-serif text-3xl text-white sm:text-4xl">
            {title} Demo
          </h1>
          <p className="mt-3 max-w-2xl text-base text-slate-100 sm:text-lg">
            {subtitle}
          </p>
        </div>
      </section>

      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
        <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100 mb-4">
          Visual Product Gallery
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {media.gallery.map((imagePath, index) => (
            <a
              key={`${title}-gallery-${index + 1}`}
              href={imagePath}
              target="_blank"
              rel="noreferrer"
              className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700"
            >
              <img
                src={imagePath}
                alt={`${title} gallery preview ${index + 1}`}
                className="h-64 sm:h-72 w-full object-cover"
                loading="lazy"
              />
            </a>
          ))}
        </div>
      </section>

      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
        <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100 mb-4">
          What This Demo Highlights
        </h2>
        <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300 leading-relaxed">
          {marketingBullets.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
        <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100 mb-3">
          Video Walkthrough Lane
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          Watch the narrated preview here, or fall back to the getting started
          guide if the clip is unavailable.
        </p>
        <MarketingVideoPanel
          title={`${title} Walkthrough`}
          description="Narrated product walkthrough lane for this capability."
          poster={media.videoPoster}
          videoPath={media.videoPath}
          fallbackHref="/getting-started"
          fallbackLabel="View the getting started guide"
          className="border-slate-200 dark:border-slate-700"
        />
      </section>

      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
        <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100 mb-3">
          Open The Live App Flow
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          {user
            ? 'You are signed in, so you can open the matching app route for this capability directly.'
            : 'These app pages are secured. Sign in or create an account first, then open the matching app route for this capability.'}
        </p>
        <div className="flex flex-wrap gap-3">
          {!user ? (
            <>
              <Link
                to="/auth/login"
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Sign In
              </Link>
              <Link
                to="/auth/signup"
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Create Account
              </Link>
            </>
          ) : null}
          <Link
            to={user ? appRoute : '/auth/login'}
            className="px-4 py-2 bg-slate-700 text-white dark:bg-slate-300 dark:text-slate-900 rounded-lg border border-slate-700 dark:border-slate-300 hover:opacity-90"
          >
            {user ? appCtaLabel : 'Sign in to open this feature'}
          </Link>
        </div>
      </section>
    </div>
  );
}
