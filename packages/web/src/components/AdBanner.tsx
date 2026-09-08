import { useEffect, useRef, useState } from 'react';
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

// AdSense marks a slot it couldn't fill by setting data-ad-status="unfilled"
// on the <ins> element once it finishes processing the push() call -- but it
// only does this if its own script actually loads and runs at all. An ad
// blocker (extremely common) prevents that script from ever loading, so
// data-ad-status never gets set either way. Without a timeout, a blocked ad
// would sit in this "still deciding" state forever, keeping its reserved
// space. FILL_TIMEOUT_MS treats "no verdict after this long" the same as
// "unfilled" -- fine for a real slow-loading ad too, since AdSense normally
// resolves in well under a second once its script is present.
const FILL_TIMEOUT_MS = 4000;

interface AdBannerProps {
  style?: React.CSSProperties;
  className?: string;
  slot?: string;
  /** Called whenever this instance's actual fill status changes. Parents
   * use this to collapse their own wrapper (padding, "Sponsored" label,
   * etc.) when nothing actually rendered, instead of just hiding the ad
   * unit itself and leaving a blank gap behind. */
  onFillStatusChange?: (filled: boolean) => void;
}

export default function AdBanner({
  style,
  className,
  slot: slotOverride,
  onFillStatusChange,
}: AdBannerProps) {
  const containerRef = useRef<HTMLModElement | null>(null);
  const client = import.meta?.env?.VITE_ADSENSE_CLIENT;
  const slot = slotOverride || import.meta?.env?.VITE_ADSENSE_SLOT;

  // Fallback placeholder when ads are disabled or env is not configured
  const renderPlaceholder = !enableAds || !client || !slot;

  // Real AdSense units start "unfilled" (nothing to show yet) and flip to
  // filled only once AdSense confirms it actually has an ad for this slot.
  // Placeholders (dev/disabled) are always "filled" from a layout
  // perspective -- they're an intentional, static block, not something that
  // should collapse.
  const [filled, setFilled] = useState(renderPlaceholder);

  useEffect(() => {
    onFillStatusChange?.(filled);
  }, [filled, onFillStatusChange]);

  useEffect(() => {
    if (renderPlaceholder) return undefined;

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

    const pushId = setTimeout(tryPush, 0);

    const insEl = containerRef.current;
    const checkStatus = () => {
      const status = insEl?.getAttribute('data-ad-status');
      if (status === 'filled') {
        setFilled(true);
        return true;
      }
      if (status === 'unfilled') {
        setFilled(false);
        return true;
      }
      return false;
    };

    let observer: MutationObserver | undefined;
    if (insEl && typeof MutationObserver === 'function') {
      observer = new MutationObserver(() => {
        checkStatus();
      });
      observer.observe(insEl, {
        attributes: true,
        attributeFilter: ['data-ad-status'],
      });
    }

    // Covers both a genuinely blocked/failed script (data-ad-status never
    // appears at all) and belt-and-suspenders in case the MutationObserver
    // somehow misses the attribute change.
    const timeoutId = setTimeout(() => {
      checkStatus();
    }, FILL_TIMEOUT_MS);

    return () => {
      clearTimeout(pushId);
      clearTimeout(timeoutId);
      observer?.disconnect();
    };
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

  // AdSense unit. Kept mounted (not conditionally rendered) even while
  // unfilled so the same <ins> element stays alive for AdSense's script to
  // populate/report status on -- only the reserved layout space (the `my-3`
  // margin) is conditional; the parent chain hides the rest once
  // onFillStatusChange reports false.
  return (
    <div
      style={style}
      className={`${filled ? 'my-3' : 'my-0 h-0 overflow-hidden'} ${className || ''}`}
    >
      <ins
        ref={containerRef}
        className="adsbygoogle block"
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
