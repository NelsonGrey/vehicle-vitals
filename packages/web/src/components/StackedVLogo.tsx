import type { CSSProperties } from 'react';

interface StackedVLogoProps {
  size?: number;
  color?: string;
  accent?: string;
  showText?: boolean;
  compact?: boolean;
  wordmarkColor?: string;
  windowColor?: string;
  gaugeColor?: string;
}

// The mark is a simplified crop of the master icon (roof + gauge only,
// dropping the road/document/checkmark detail that turns to mush at nav
// sizes) -- it isn't square. This is its fixed source aspect ratio.
const MARK_ASPECT_RATIO = 569 / 340;

export default function StackedVLogo({
  size = 32,
  color = 'currentColor',
  showText = true,
  compact = false,
  wordmarkColor = '#64748b',
}: StackedVLogoProps) {
  const width = Math.round(size * MARK_ASPECT_RATIO);
  const isLightMark =
    color.toLowerCase() === '#ffffff' ||
    color.toLowerCase() === 'white' ||
    wordmarkColor.toLowerCase() === '#ffffff';
  // Cache-bust: this filename was previously overwritten in place multiple
  // times behind a 1-year immutable Cache-Control header, so browsers that
  // fetched an earlier version had a stale (differently-proportioned) copy
  // stuck in cache, rendered distorted once forced into the current square
  // dimensions. Bumping this query param forces a fresh fetch for everyone.
  const logoSrc = isLightMark
    ? '/assets/vehicle-vitals-header-mark-light.png?v=2026-07-09b'
    : '/assets/vehicle-vitals-header-mark.png?v=2026-07-09b';

  const compactFontSize = Math.max(14, Math.round(size * 0.3));
  const compactLetterSpacing = +(compactFontSize * -0.025).toFixed(2);

  const wordmark = (
    <div
      className={`stacked-v-logo-wordmark ${compact ? 'compact' : ''} ${wordmarkColor === '#64748b' ? '' : 'shadow'}`}
      style={{ color: wordmarkColor }}
    >
      {compact ? 'Vehicle Vitals' : <>VEHICLE<br />VITALS</>}
    </div>
  );

  return (
    <div
      className={`stacked-v-logo-container ${compact ? 'compact' : ''}`}
      style={
        compact
          ? ({
              '--logo-icon-height': `${size}px`,
              '--logo-icon-width': `${width}px`,
              '--logo-font-size': `${compactFontSize}px`,
              '--logo-letter-spacing': `${compactLetterSpacing}px`,
            } as CSSProperties)
          : undefined
      }
    >
      <img
        src={logoSrc}
        width={width}
        height={size}
        className="stacked-v-logo-mark"
        alt=""
        aria-hidden="true"
        decoding="async"
      />
      {showText && wordmark}
    </div>
  );
}
