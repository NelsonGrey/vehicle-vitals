import { useEffect, useMemo, useRef, useState } from 'react';
import { trackAdClick, trackAdImpression } from '../shared/adAnalytics';
import {
  getAdDisplayConfig,
  getAdUnit,
  isAdVisibleOnDesktop,
  isAdVisibleOnMobile,
  type WebAdPlacement,
} from '../shared/adPlacements';
import { useSubscription } from '../shared/useMonetization';
import AdBanner from './AdBanner';

interface AdPlacementProps {
  placement: WebAdPlacement;
  className?: string;
  advertiserId?: string;
  campaignId?: string;
  hideLabel?: boolean;
  surface?: 'card' | 'flat';
}

function isMobileViewport(): boolean {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return false;
  }

  return window.matchMedia('(max-width: 768px)').matches;
}

export default function AdPlacement({
  placement,
  className,
  advertiserId,
  campaignId,
  hideLabel = false,
  surface = 'card',
}: AdPlacementProps) {
  const { tier } = useSubscription();
  const [isMobile, setIsMobile] = useState(isMobileViewport());
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasTrackedImpressionRef = useRef(false);

  const adConfig = useMemo(
    () => getAdDisplayConfig(placement, tier, isMobile),
    [placement, tier, isMobile]
  );

  const adUnit = useMemo(() => getAdUnit(placement), [placement]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(isMobileViewport());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!containerRef.current || dismissed) {
      return;
    }

    if (typeof IntersectionObserver !== 'function') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        const isIntersecting = entries.some(entry => entry.isIntersecting);
        setIsVisible(isIntersecting);
      },
      {
        threshold: 0.4,
      }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [dismissed]);

  useEffect(() => {
    if (!adConfig.shouldShow || !isVisible || hasTrackedImpressionRef.current) {
      return;
    }

    trackAdImpression(placement, tier, advertiserId);
    hasTrackedImpressionRef.current = true;
  }, [adConfig.shouldShow, advertiserId, isVisible, placement, tier]);

  useEffect(() => {
    if (!adConfig.shouldShow) {
      setDismissed(false);
      hasTrackedImpressionRef.current = false;
    }
  }, [adConfig.shouldShow]);

  if (!adConfig.shouldShow || dismissed) {
    return null;
  }

  if (
    (isMobile && !isAdVisibleOnMobile(placement)) ||
    (!isMobile && !isAdVisibleOnDesktop(placement))
  ) {
    return null;
  }

  return (
    <section
      ref={containerRef}
      aria-label={`Sponsored placement: ${adUnit.name}`}
      className={`${
        surface === 'card'
          ? 'rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800'
          : 'border-0 bg-transparent rounded-none px-0 py-0'
      } ${className || ''}`}
      onClick={() => trackAdClick(placement, tier, advertiserId, campaignId)}
    >
      {!hideLabel && (
        <div className="mb-1 flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Sponsored
          </p>
          {adUnit.dismissible && (
            <button
              type="button"
              onClick={event => {
                event.stopPropagation();
                setDismissed(true);
              }}
              className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              aria-label="Dismiss sponsored placement"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      <AdBanner className="my-0" slot={adConfig.adSlot} />
    </section>
  );
}
