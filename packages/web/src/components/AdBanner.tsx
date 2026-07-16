import { useEffect, useRef } from 'react';
import { enableAds } from '../shared/environment';

// Declare AdSense global
declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

// Env-driven AdSense banner. Configure:
// - VITE_ADSENSE_CLIENT: e.g., 'ca-pub-XXXXXXXXXXXXXXXX'
// - VITE_ADSENSE_SLOT: numeric string for the ad slot
// You can override slot per-instance via the `slot` prop.

interface AdBannerProps {
  style?: React.CSSProperties;
  className?: string;
  slot?: string;
}

export default function AdBanner({
  style,
  className,
  slot: slotOverride,
}: AdBannerProps) {
  const containerRef = useRef(null);
  const client = import.meta?.env?.VITE_ADSENSE_CLIENT;
  const slot = slotOverride || import.meta?.env?.VITE_ADSENSE_SLOT;

  // Fallback placeholder when ads are disabled or env is not configured
  const renderPlaceholder = !enableAds || !client || !slot;

  useEffect(() => {
    if (renderPlaceholder) return;

    // Ensure the AdSense script is loaded once
    const SCRIPT_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
      client
    )}`;
    const existing = document.querySelector(
      `script[src^="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]`
    );
    if (!existing) {
      const script = document.createElement('script');
      script.async = true;
      script.src = SCRIPT_SRC;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
      // We don't block on load; AdSense will hydrate when ready
    }

    // Try to (re)request an ad for this unit
    // Wrap in try/catch to avoid console noise in development
    const tryPush = () => {
      try {
        // eslint-disable-next-line no-underscore-dangle, no-unused-expressions
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (_) {
        // Ignore errors; AdSense may not be ready yet in dev
      }
    };

    // Push after mount
    const id = setTimeout(tryPush, 0);
    return () => clearTimeout(id);
  }, [client, slot, renderPlaceholder]);

  if (renderPlaceholder) {
    const placeholderMessage = enableAds
      ? 'Ad placeholder — set VITE_ADSENSE_CLIENT and VITE_ADSENSE_SLOT to enable ads'
      : 'Ads are disabled for this environment';

    return (
      <div
        style={style}
        className={`bg-slate-100 dark:bg-slate-700 border border-dashed border-slate-300 dark:border-slate-500 p-3 text-center my-3 rounded-md ${className || ''}`}
      >
        <small className="text-slate-500 dark:text-slate-400 text-xs">
          {placeholderMessage}
        </small>
      </div>
    );
  }

  // AdSense unit
  return (
    <div style={style} className={`my-3 ${className || ''}`} ref={containerRef}>
      <ins
        className="adsbygoogle block"
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
