import { useState } from 'react';
import { useAppOffline } from '../shared/useAppOffline';

interface MarketingVideoPanelProps {
  title: string;
  description: string;
  poster: string;
  videoPath: string;
  fallbackHref?: string;
  fallbackLabel?: string;
  className?: string;
}

export default function MarketingVideoPanel({
  title,
  description,
  poster,
  videoPath,
  fallbackHref,
  fallbackLabel = 'Open interactive demo',
  className = '',
}: MarketingVideoPanelProps) {
  const [videoFailed, setVideoFailed] = useState(false);
  const isAppOffline = useAppOffline();

  const canTryVideo = Boolean(videoPath);
  const showVideo = canTryVideo && !videoFailed;
  // Only entry-flow fallbacks (sign-up/sign-in) respect the offline kill
  // switch — the other usages of this panel fall back to plain marketing
  // pages (e.g. /getting-started), which stay available either way.
  const isEntryFallback = Boolean(fallbackHref?.startsWith('/auth/'));

  return (
    <article
      className={`overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 ${className}`.trim()}
    >
      <div className="relative h-56 sm:h-64 lg:h-72">
        {showVideo ? (
          <video
            className="h-full w-full object-cover"
            controls
            playsInline
            muted
            preload="metadata"
            poster={poster}
            onError={() => setVideoFailed(true)}
          >
            <source src={videoPath} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <img
            src={poster}
            alt={`${title} video poster`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 to-black/10" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900">
            {showVideo ? 'Playable demo' : 'Poster preview'}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-serif text-lg text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {description}
        </p>
        {videoFailed && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Video not found at {videoPath}. Add the clip to enable playback.
          </p>
        )}
        {!showVideo && fallbackHref && isEntryFallback && isAppOffline && (
          <span className="mt-3 inline-flex flex-col items-start gap-1">
            <span
              aria-disabled="true"
              className="inline-flex items-center rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-white opacity-50 cursor-not-allowed dark:bg-slate-200 dark:text-slate-900"
            >
              {fallbackLabel}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Currently unavailable
            </span>
          </span>
        )}
        {!showVideo && fallbackHref && !(isEntryFallback && isAppOffline) && (
          <a
            href={fallbackHref}
            className="mt-3 inline-flex items-center rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white"
          >
            {fallbackLabel}
          </a>
        )}
      </div>
    </article>
  );
}
