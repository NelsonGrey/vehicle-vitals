import { useState } from 'react';

interface MarketingVideoPanelProps {
  title: string;
  description: string;
  poster: string;
  videoPath: string;
  className?: string;
}

export default function MarketingVideoPanel({
  title,
  description,
  poster,
  videoPath,
  className = '',
}: MarketingVideoPanelProps) {
  const [videoFailed, setVideoFailed] = useState(false);

  const canTryVideo = Boolean(videoPath);
  const showVideo = canTryVideo && !videoFailed;

  return (
    <article
      className={`overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 ${className}`.trim()}
    >
      <div className="relative h-36">
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10" />
        <div className="absolute inset-0 flex items-center justify-center">
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
      </div>
    </article>
  );
}
